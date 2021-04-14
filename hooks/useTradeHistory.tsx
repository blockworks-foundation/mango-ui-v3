import { useState, useEffect } from 'react'
import useMangoStore from '../stores/useMangoStore'
import useSerumStore from '../stores/useSerumStore'
import useMarket from './useMarket'
import useInterval from './useInterval'

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
        key: `${trade.orderId}${trade.side}${trade.uuid}`,
        liquidity: trade.maker || trade?.eventFlags?.maker ? 'Maker' : 'Taker',
      }
    })
    .sort(byTimestamp)
}

const useFills = () => {
  const fills = useSerumStore((s) => s.fills)
  const { market, marketName } = useMarket()
  const marginAccount = useMangoStore((s) => s.selectedMarginAccount.current)
  const selectedMangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)

  if (!marginAccount || !selectedMangoGroup) return null

  const marketIndex = selectedMangoGroup.getMarketIndex(market)
  const openOrdersAccount = marginAccount.openOrdersAccounts[marketIndex]
  if (!openOrdersAccount) return []
  return fills
    .filter((fill) => fill.openOrders.equals(openOrdersAccount.publicKey))
    .map((fill) => ({ ...fill, marketName }))
}

export const useTradeHistory = () => {
  const eventQueueFills = useFills()
  const [allTrades, setAllTrades] = useState<any[]>([])
  const tradeHistory = useMangoStore((s) => s.tradeHistory)
  const marginAccount = useMangoStore((s) => s.selectedMarginAccount.current)
  const actions = useMangoStore((s) => s.actions)

  useInterval(() => {
    if (marginAccount) {
      actions.fetchTradeHistory()
    }
  }, 12000)

  useEffect(() => {
    if (eventQueueFills && eventQueueFills.length > 0) {
      const newFills = eventQueueFills.filter(
        (fill) =>
          !tradeHistory.find((t) => t.orderId === fill.orderId.toString())
      )
      const newTradeHistory = [...newFills, ...tradeHistory]
      if (newFills.length > 0 && newTradeHistory.length !== allTrades.length) {
        const formattedTradeHistory = formatTradeHistory(newTradeHistory)

        setAllTrades(formattedTradeHistory)
      }
    }
  }, [tradeHistory, eventQueueFills])

  return { tradeHistory: allTrades }
}

export default useTradeHistory
