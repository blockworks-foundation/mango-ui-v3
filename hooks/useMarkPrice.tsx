import { useEffect } from 'react'
import useMangoStore from '../stores/useMangoStore'

export default function useMarkPrice() {
  const setMangoStore = useMangoStore((s) => s.set)
  const markPrice = useMangoStore((s) => s.selectedMarket.markPrice)
  const orderbook = useMangoStore((s) => s.selectedMarket.orderBook)
  const fills = useMangoStore((state) => state.selectedMarket.fills)

  const trades = fills
    .filter((trade) => trade?.eventFlags?.maker || trade?.maker)
    .map((trade) => ({
      ...trade,
      side: trade.side === 'buy' ? 'sell' : 'buy',
    }))

  useEffect(() => {
    const bb = orderbook?.bids?.length > 0 && Number(orderbook.bids[0][0])
    const ba = orderbook?.asks?.length > 0 && Number(orderbook.asks[0][0])
    const last = trades && trades.length > 0 && trades[0].price

    const newMarkPrice =
      bb && ba
        ? last
          ? [bb, ba, last].sort((a, b) => a - b)[1]
          : (bb + ba) / 2
        : null
    if (newMarkPrice !== markPrice) {
      setMangoStore((state) => {
        state.selectedMarket.markPrice = newMarkPrice
      })
    }
  }, [orderbook, trades])

  return markPrice
}
