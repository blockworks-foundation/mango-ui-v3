import { getMarketByPublicKey } from '@blockworks-foundation/mango-client'
import { PublicKey } from '@solana/web3.js'
import {
  fillsSelector,
  mangoAccountSelector,
  mangoGroupSelector,
  marketConfigSelector,
  tradeHistorySelector,
} from '../stores/selectors'
import useMangoStore from '../stores/useMangoStore'

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
    marketName = marketInfo.name
  }
  return event.marketName || marketName
}

const parsedPerpEvent = (mangoAccountPk: PublicKey, event) => {
  const maker = event.maker.toString() === mangoAccountPk.toString()
  const orderId = maker ? event.makerOrderId : event.takerOrderId
  const value = event.quantity * event.price
  const feeRate = maker ? event.makerFee : event.takerFee
  const side = maker ? reverseSide(event.takerSide) : event.takerSide

  return {
    ...event,
    key: orderId?.toString(),
    liquidity: maker ? 'Maker' : 'Taker',
    size: event.quantity,
    price: event.price,
    value,
    feeCost: (feeRate * value).toFixed(4),
    side,
    marketName: getMarketName(event),
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

const formatTradeHistory = (mangoAccountPk: PublicKey, newTradeHistory) => {
  return newTradeHistory
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

export const useTradeHistory = (
  opts: { excludePerpLiquidations?: boolean } = {}
) => {
  const marketConfig = useMangoStore(marketConfigSelector)
  const fills = useMangoStore(fillsSelector)
  const mangoAccount = useMangoStore(mangoAccountSelector)
  const selectedMangoGroup = useMangoStore(mangoGroupSelector)
  const tradeHistory = useMangoStore(tradeHistorySelector)

  if (!mangoAccount || !selectedMangoGroup) return null

  let combinedTradeHistory = [...tradeHistory.spot, ...tradeHistory.perp]

  const openOrdersAccount =
    mangoAccount.spotOpenOrdersAccounts[marketConfig.marketIndex]

  const mangoAccountFills = fills
    .filter((fill) => {
      if (fill.openOrders) {
        return openOrdersAccount?.publicKey
          ? fill.openOrders.equals(openOrdersAccount?.publicKey)
          : false
      } else {
        return (
          fill.taker.equals(mangoAccount.publicKey) ||
          fill.maker.equals(mangoAccount.publicKey)
        )
      }
    })
    .map((fill) => ({ ...fill, marketName: marketConfig.name }))

  const allTrades = []
  if (mangoAccountFills && mangoAccountFills.length > 0) {
    const newFills = mangoAccountFills.filter(
      (fill) =>
        !combinedTradeHistory.flat().find((t) => {
          if (t.orderId) {
            return t.orderId === fill.orderId?.toString()
          } else {
            return t.seqNum === fill.seqNum?.toString()
          }
        })
    )
    const newTradeHistory = [...newFills, ...combinedTradeHistory]
    if (newFills.length > 0 && newTradeHistory.length !== allTrades.length) {
      combinedTradeHistory = newTradeHistory
    }
  }

  const formattedTradeHistory = formatTradeHistory(
    mangoAccount.publicKey,
    combinedTradeHistory
  )
  if (opts.excludePerpLiquidations) {
    return formattedTradeHistory.filter((t) => !('liqor' in t))
  }
  return formattedTradeHistory
}

export default useTradeHistory
