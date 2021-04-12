import { useState } from 'react'
// import styled from '@emotion/styled'
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

  useInterval(async () => {
    const newTrades = await ChartApi.getRecentTrades(marketAddress)
    if (trades.length === 0) {
      setTrades(newTrades)
    } else if (!isEqual(newTrades[0], trades[0], Object.keys(newTrades[0]))) {
      setTrades(newTrades)
    }
  }, 5000)

  return (
    <FloatingElement>
      <ElementTitle>Recent Market Trades</ElementTitle>
      <div className={`grid grid-cols-3 text-th-fgd-4 mb-2`}>
        <div>Price ({quoteCurrency}) </div>
        <div className={`text-right`}>Size ({baseCurrency})</div>
        <div className={`text-right`}>Time</div>
      </div>
      {!!trades.length && (
        <div>
          {trades.map((trade: ChartTradeType, i: number) => (
            <div key={i} className={`mb-2 font-light grid grid-cols-3`}>
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
              <div className={`text-right`}>
                {market?.minOrderSize && !isNaN(trade.size)
                  ? Number(trade.size).toFixed(
                      getDecimalCount(market.minOrderSize)
                    )
                  : trade.size}
              </div>
              <div className={`text-right text-gray-500`}>
                {trade.time && new Date(trade.time).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </FloatingElement>
  )
}
