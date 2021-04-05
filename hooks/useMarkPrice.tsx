import { useEffect } from 'react'
import useMangoStore from '../stores/useMangoStore'
import useInterval from './useInterval'
import useSerumStore from '../stores/useSerumStore'
import useOrderbook from './useOrderbook'
import useConnection from './useConnection'

// const _VERY_SLOW_REFRESH_INTERVAL = 5000 * 1000;

// For things that don't really change
const _SLOW_REFRESH_INTERVAL = 5 * 1000

// For things that change frequently
// const _FAST_REFRESH_INTERVAL = 1000;

export function _useUnfilteredTrades(limit = 10000) {
  console.log('fetching unfiltered trades')

  const market = useMangoStore((state) => state.market.current)
  const { connection } = useConnection()
  const setSerumStore = useSerumStore((state) => state.set)

  useInterval(() => {
    async function fetchFills() {
      if (!market || !connection) {
        return null
      }
      const loadedFills = await market.loadFills(connection, limit)

      setSerumStore((state) => {
        state.fills = loadedFills
      })
    }

    fetchFills()
  }, _SLOW_REFRESH_INTERVAL)
}

export function useTrades() {
  const trades = useSerumStore((state) => state.fills)
  if (!trades) {
    return null
  }
  // Until partial fills are each given their own fill, use maker fills
  return trades
    .filter(({ eventFlags }) => eventFlags.maker)
    .map((trade) => ({
      ...trade,
      side: trade.side === 'buy' ? 'sell' : 'buy',
    }))
}

export default function useMarkPrice() {
  const setMangoStore = useMangoStore((s) => s.set)
  const markPrice = useMangoStore((s) => s.market.markPrice)

  const [orderbook] = useOrderbook()
  const trades = useTrades()

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

    setMangoStore((state) => {
      state.market.markPrice = newMarkPrice
    })
  }, [orderbook, trades])

  return markPrice
}
