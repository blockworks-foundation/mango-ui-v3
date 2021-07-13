import useMangoStore from '../stores/useMangoStore'

const byTimestamp = (a, b) => {
  return (
    new Date(b.loadTimestamp).getTime() - new Date(a.loadTimestamp).getTime()
  )
}

const parsedPerpEvent = (event) => {
  return {
    ...event,
    key: `${event.orderId}-${event.uuid}`,
    liquidity: event.maker ? 'Maker' : 'Taker',
    value: event.price * event.size,
    side: event.side,
    feeCost: 0.0,
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

const formatTradeHistory = (newTradeHistory) => {
  return newTradeHistory
    .flat()
    .map((trade) => {
      if (trade.eventFlags) {
        return parsedSerumEvent(trade)
      } else {
        return parsedPerpEvent(trade)
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
      return formatTradeHistory(newTradeHistory)
    }
  }

  return formatTradeHistory(tradeHistory)
}

export default useTradeHistory
