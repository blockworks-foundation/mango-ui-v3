import { useEffect, useRef } from 'react'
import useMangoStore from '../stores/useMangoStore'
import useSerumStore from '../stores/useSerumStore'
import useMarket from './useMarket'

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
      }
    })
    .sort(byTimestamp)
}

const useFills = () => {
  const fillsRef = useRef(useSerumStore.getState().fills)
  const fills = fillsRef.current
  useEffect(
    () =>
      useSerumStore.subscribe(
        (fills) => (fillsRef.current = fills as []),
        (state) => state.fills
      ),
    []
  )

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
