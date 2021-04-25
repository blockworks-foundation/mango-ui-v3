import { useCallback, useEffect, useState } from 'react'
import { getDecimalCount } from '../utils'
import { ChartTradeType } from '../@types/types'
import FloatingElement from './FloatingElement'
import useMarket from '../hooks/useMarket'
import useInterval from '../hooks/useInterval'
import ChartApi from '../utils/chartDataConnector'
import { ElementTitle } from './styles'
import { isEqual } from '../utils/index'

export default function PublicTrades() {
  const { baseCurrency, quoteCurrency, market, marketAddress } = useMarket()
  const [trades, setTrades] = useState([])

  const fetchTradesForChart = useCallback(async () => {
    const newTrades = await ChartApi.getRecentTrades(marketAddress)
    if (trades.length === 0) {
      setTrades(newTrades)
    } else if (
      newTrades &&
      !isEqual(newTrades[0], trades[0], Object.keys(newTrades[0]))
    ) {
      setTrades(newTrades)
    }
  }, [marketAddress, trades])

  useEffect(() => {
    fetchTradesForChart()
  }, [fetchTradesForChart])

  useInterval(async () => {
    fetchTradesForChart()
  }, 5000)

  return (
    <FloatingElement>
      <ElementTitle>Recent Trades</ElementTitle>
      <div className={`grid grid-cols-3 text-th-fgd-4 mb-2`}>
        <div>Price ({quoteCurrency}) </div>
        <div className={`text-right`}>Size ({baseCurrency})</div>
        <div className={`text-right`}>Time</div>
      </div>
      {!!trades.length && (
        <div>
          {trades.map((trade: ChartTradeType, i: number) => (
            <div key={i} className={`leading-7 grid grid-cols-3`}>
              <div
                className={`${
                  trade.side === 'buy' ? `text-th-green` : `text-th-red`
                }`}
              >
                {market?.tickSize && !isNaN(trade.price)
                  ? Number(trade.price).toFixed(
                      getDecimalCount(market.tickSize)
                    )
                  : trade.price}
              </div>
              <div className={`text-right`}>
                {market?.minOrderSize && !isNaN(trade.size)
                  ? Number(trade.size).toFixed(
                      getDecimalCount(market.minOrderSize)
                    )
                  : trade.size}
              </div>
              <div className={`text-right text-th-fgd-3`}>
                {trade.time && new Date(trade.time).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </FloatingElement>
  )
}
