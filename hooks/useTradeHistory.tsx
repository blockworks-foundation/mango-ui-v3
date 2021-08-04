import {
  getMarketIndexBySymbol,
  MangoGroup,
} from '@blockworks-foundation/mango-client'
import { PublicKey } from '@solana/web3.js'
import useMangoStore from '../stores/useMangoStore'

const byTimestamp = (a, b) => {
  return (
    new Date(b.loadTimestamp || b.timestamp.toNumber()).getTime() -
    new Date(a.loadTimestamp || a.timestamp.toNumber()).getTime()
  )
}

const parsedPerpEvent = (
  mangoGroup: MangoGroup,
  mangoAccountPk: PublicKey,
  event
) => {
  const mangoGroupConfig = useMangoStore.getState().selectedMangoGroup.config
  const marketIndex = getMarketIndexBySymbol(
    mangoGroupConfig,
    event.marketName.split(/-|\//)[0]
  )
  const perpMarketInfo = mangoGroup.perpMarkets[marketIndex]
  const maker = event.maker.equals(mangoAccountPk)
  const orderId = maker ? event.makerOrderId : event.takerOrderId
  const value = event.quantity * event.price
  const feeRate = maker
    ? perpMarketInfo.makerFee.toNumber()
    : perpMarketInfo.takerFee.toNumber()

  return {
    ...event,
    key: orderId.toString(),
    liquidity: maker ? 'Maker' : 'Taker',
    size: event.quantity,
    price: event.price,
    value,
    feeCost: (feeRate * value).toFixed(4),
    side: event.side,
  }
}

const parsedSerumEvent = (event) => {
  return {
    ...event,
    key: `${event.maker}-${event.price}`,
    liquidity: event?.eventFlags?.maker ? 'Maker' : 'Taker',
    value: event.price * event.size,
    side: event.side,
  }
}

const formatTradeHistory = (
  selectedMangoGroup,
  mangoAccountPk: PublicKey,
  newTradeHistory
) => {
  return newTradeHistory
    .flat()
    .map((trade) => {
      if (trade.eventFlags) {
        return parsedSerumEvent(trade)
      } else {
        return parsedPerpEvent(selectedMangoGroup, mangoAccountPk, trade)
      }
    })
    .sort(byTimestamp)
}

export const useTradeHistory = () => {
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const fills = useMangoStore((s) => s.selectedMarket.fills)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const selectedMangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const tradeHistory = useMangoStore((s) => s.tradeHistory)

  if (!mangoAccount || !selectedMangoGroup) return null
  const openOrdersAccount =
    mangoAccount.spotOpenOrdersAccounts[marketConfig.marketIndex]
  if (!openOrdersAccount) return []

  const mangoAccountFills = fills
    .filter((fill) => {
      if (fill.openOrders) {
        return fill.openOrders.equals(openOrdersAccount.publicKey)
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
        !tradeHistory.flat().find((t) => t.orderId === fill.orderId.toString())
    )
    const newTradeHistory = [...newFills, ...tradeHistory]
    if (newFills.length > 0 && newTradeHistory.length !== allTrades.length) {
      return formatTradeHistory(
        selectedMangoGroup,
        mangoAccount.publicKey,
        newTradeHistory
      )
    }
  }

  return formatTradeHistory(
    selectedMangoGroup,
    mangoAccount.publicKey,
    tradeHistory
  )
}

export default useTradeHistory
