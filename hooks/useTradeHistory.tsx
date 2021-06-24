import useMangoStore from '../stores/useMangoStore'

const byTimestamp = (a, b) => {
  return (
    new Date(b.loadTimestamp).getTime() - new Date(a.loadTimestamp).getTime()
  )
}

const parsedPerpEvent = (trade) => {
  let side
  if (trade.maker) {
    side = trade.quoteChange === 0 ? 'buy' : 'sell'
  } else {
    side = trade.quoteChange === 0 ? 'sell' : 'buy'
  }

  return {
    ...trade,
    marketName: trade.marketName
      ? trade.marketName
      : `${trade.baseCurrency}/${trade.quoteCurrency}`,
    key: `${trade.orderId}-${trade.uuid}`,
    liquidity: trade.maker,
    value: trade.price * trade.size,
    side,
  }
}

const parsedSerumEvent = (trade) => {
  return {
    ...trade,
    marketName: trade.marketName
      ? trade.marketName
      : `${trade.baseCurrency}/${trade.quoteCurrency}`,
    key: `${trade.orderId}-${trade.uuid}`,
    liquidity: trade.maker || trade?.eventFlags?.maker ? 'Maker' : 'Taker',
    value: trade.price * trade.size,
    side: trade.side,
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
      if (fill.eventFlags) {
        return fill.openOrders.equals(openOrdersAccount.publicKey)
      } else {
        return fill.owner.equals(mangoAccount.publicKey)
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
