import { getMarketByPublicKey } from '@blockworks-foundation/mango-client'
import { PublicKey } from '@solana/web3.js'
import BigNumber from 'bignumber.js'
import { useEffect } from 'react'
import {
  fillsSelector,
  mangoAccountSelector,
  mangoGroupSelector,
  marketConfigSelector,
} from '../stores/selectors'
import useMangoStore from '../stores/useMangoStore'
import { perpContractPrecision } from '../utils'

const byTimestamp = (a, b) => {
  return (
    new Date(b.loadTimestamp || b.timestamp * 1000).getTime() -
    new Date(a.loadTimestamp || a.timestamp * 1000).getTime()
  )
}

const reverseSide = (side) => (side === 'buy' ? 'sell' : 'buy')

function getMarketName(event) {
  const mangoGroupConfig = useMangoStore.getState().selectedMangoGroup.config

  let marketName
  if (!event.marketName && event.address) {
    const marketInfo = getMarketByPublicKey(mangoGroupConfig, event.address)
    if (marketInfo) {
      marketName = marketInfo.name
    }
  }
  return event.marketName || marketName
}

const parsedPerpEvent = (mangoAccountPk: PublicKey, event) => {
  const maker = event.maker.toString() === mangoAccountPk.toString()
  const orderId = maker ? event.makerOrderId : event.takerOrderId
  const value = event.quantity * event.price
  const feeRate = maker ? event.makerFee : event.takerFee
  const side = maker ? reverseSide(event.takerSide) : event.takerSide
  const marketName = getMarketName(event)
  const sizeDecimalCount = perpContractPrecision[marketName.split('-')[0]]
  const size = new BigNumber(event.quantity).toFormat(sizeDecimalCount)

  return {
    ...event,
    key: orderId?.toString(),
    liquidity: maker ? 'Maker' : 'Taker',
    size,
    price: event.price,
    value,
    feeCost: (feeRate * value).toFixed(4),
    side,
    marketName,
  }
}

const parsedSerumEvent = (event) => {
  let liquidity
  if (event.eventFlags) {
    liquidity = event?.eventFlags?.maker ? 'Maker' : 'Taker'
  } else {
    liquidity = event.maker ? 'Maker' : 'Taker'
  }
  return {
    ...event,
    liquidity,
    key: `${event.maker}-${event.price}`,
    value: event.price * event.size,
    side: event.side,
    marketName: getMarketName(event),
  }
}

const formatTradeHistory = (mangoAccountPk: PublicKey, tradeHistory: any[]) => {
  return tradeHistory
    .flat()
    .map((event) => {
      if (event.eventFlags || event.nativeQuantityPaid) {
        return parsedSerumEvent(event)
      } else if (event.maker) {
        return parsedPerpEvent(mangoAccountPk, event)
      } else {
        return event
      }
    })
    .sort(byTimestamp)
}

export const useTradeHistory = () => {
  const marketConfig = useMangoStore(marketConfigSelector)
  const fills = useMangoStore(fillsSelector)
  const mangoAccount = useMangoStore(mangoAccountSelector)
  const selectedMangoGroup = useMangoStore(mangoGroupSelector)
  const spotTradeHistory = useMangoStore((s) => s.tradeHistory.spot)
  const perpTradeHistory = useMangoStore((s) => s.tradeHistory.perp)
  const setMangoStore = useMangoStore.getState().set

  useEffect(() => {
    if (!mangoAccount || !selectedMangoGroup) return
    const previousTradeHistory = useMangoStore.getState().tradeHistory.parsed

    // combine the trade histories loaded from the DB
    let tradeHistory = spotTradeHistory.concat(perpTradeHistory)

    const openOrdersAccount =
      mangoAccount.spotOpenOrdersAccounts[marketConfig.marketIndex]

    // Look through the loaded fills from the event queue to see if
    // there are any that match the user's open orders account
    const tradeHistoryFromEventQueue = fills
      .filter((fill) => {
        if (fill.openOrders) {
          // handles serum event queue for spot trades
          return openOrdersAccount?.publicKey
            ? fill.openOrders.equals(openOrdersAccount?.publicKey)
            : false
        } else {
          // handles mango event queue for perp trades
          return (
            fill.taker.equals(mangoAccount.publicKey) ||
            fill.maker.equals(mangoAccount.publicKey)
          )
        }
      })
      .map((fill) => ({ ...fill, marketName: marketConfig.name }))

    // filters the trades from tradeHistoryFromEventQueue to find the ones we don't already have in the DB
    if (tradeHistoryFromEventQueue?.length) {
      const newFills = tradeHistoryFromEventQueue.filter(
        (fill) =>
          !tradeHistory.find((t) => {
            if (t.orderId) {
              return t.orderId === fill.orderId?.toString()
            } else {
              return t.seqNum === fill.seqNum?.toString()
            }
          })
      )
      tradeHistory = [...newFills, ...tradeHistory]
    }

    if (previousTradeHistory.length !== tradeHistory.length) {
      const formattedTradeHistory = formatTradeHistory(
        mangoAccount.publicKey,
        tradeHistory
      )

      setMangoStore((state) => {
        state.tradeHistory.parsed = formattedTradeHistory
      })
    }
  }, [spotTradeHistory, perpTradeHistory, fills, mangoAccount])
}

export default useTradeHistory
