import useMangoStore from '../stores/useMangoStore'

const byTimestamp = (a, b) => {
  return (
    new Date(b.loadTimestamp).getTime() - new Date(a.loadTimestamp).getTime()
  )
}

const formatTradeHistory = (newTradeHistory) => {
  return newTradeHistory
    .flat()
    .map((trade) => {
      return {
        ...trade,
        marketName: trade.marketName
          ? trade.marketName
          : `${trade.baseCurrency}/${trade.quoteCurrency}`,
        key: `${trade.orderId}-${trade.uuid}`,
        liquidity: trade.maker || trade?.eventFlags?.maker ? 'Maker' : 'Taker',
        value: trade.price * trade.size,
      }
    })
    .sort(byTimestamp)
}

const useFills = () => {
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const fills = useMangoStore((s) => s.selectedMarket.fills)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const selectedMangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)

  if (!mangoAccount || !selectedMangoGroup) return null

  const openOrdersAccount =
    mangoAccount.spotOpenOrdersAccounts[marketConfig.marketIndex]
  if (!openOrdersAccount) return []

  return fills
    .filter((fill) => fill.openOrders.equals(openOrdersAccount.publicKey))
    .map((fill) => ({ ...fill, marketName: marketConfig.name }))
}

export const useTradeHistory = () => {
  const eventQueueFills = useFills()
  const tradeHistory = useMangoStore((s) => s.tradeHistory)

  const allTrades = []
  if (eventQueueFills && eventQueueFills.length > 0) {
    const newFills = eventQueueFills.filter(
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
