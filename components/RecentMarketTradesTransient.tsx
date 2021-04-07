import { useCallback, useEffect, useRef } from 'react'
import xw from 'xwind'
import { getDecimalCount } from '../utils'
import { ChartTradeType } from '../@types/types'
import FloatingElement from './FloatingElement'
import useMarket from '../hooks/useMarket'
import useInterval from '../hooks/useInterval'
import ChartApi from '../utils/chartDataConnector'
import { ElementTitle } from './styles'
import useSerumStore from '../stores/useSerumStore'

export default function PublicTrades() {
  const { baseCurrency, quoteCurrency, market, marketAddress } = useMarket()
  const setSerumStore = useSerumStore((s) => s.set)

  const fetchTrades = useCallback(async () => {
    const trades = await ChartApi.getRecentTrades(marketAddress)
    setSerumStore((state) => {
      state.chartApiTrades = trades
    })
  }, [marketAddress])

  // fetch trades on load
  useEffect(() => {
    fetchTrades()
  }, [])

  // refresh trades on interval
  useInterval(async () => {
    fetchTrades()
  }, 5000)

  const tradesRef = useRef(useSerumStore.getState().chartApiTrades)
  const trades = tradesRef.current
  useEffect(
    () =>
      useSerumStore.subscribe(
        (trades) => (tradesRef.current = trades as any[]),
        (state) => state.chartApiTrades
      ),
    []
  )

  return (
    <FloatingElement>
      <ElementTitle>Recent Market Trades</ElementTitle>
      <div css={xw`grid grid-cols-3 text-gray-500 mb-2`}>
        <div>Price ({quoteCurrency}) </div>
        <div css={xw`text-right`}>Size ({baseCurrency})</div>
        <div css={xw`text-right`}>Time</div>
      </div>
      {!!trades.length && (
        <div>
          {trades.map((trade: ChartTradeType, i: number) => (
            <div key={i} css={xw`mb-2 font-light grid grid-cols-3`}>
              <div
                style={{
                  color: trade.side === 'buy' ? '#AFD803' : '#E54033',
                }}
              >
                {market?.tickSize && !isNaN(trade.price)
                  ? Number(trade.price).toFixed(
                      getDecimalCount(market.tickSize)
                    )
                  : trade.price}
              </div>
              <div css={xw`text-right`}>
                {market?.minOrderSize && !isNaN(trade.size)
                  ? Number(trade.size).toFixed(
                      getDecimalCount(market.minOrderSize)
                    )
                  : trade.size}
              </div>
              <div css={xw`text-right text-gray-500`}>
                {trade.time && new Date(trade.time).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </FloatingElement>
  )
}
