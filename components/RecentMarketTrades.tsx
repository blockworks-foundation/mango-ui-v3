import { useState } from 'react'
// import styled from '@emotion/styled'
import xw from 'xwind'
import { getDecimalCount } from '../utils'
import { ChartTradeType } from '../@types/types'
import FloatingElement from './FloatingElement'
import useMarkets from '../hooks/useMarkets'
import useInterval from '../hooks/useInterval'
import ChartApi from '../utils/chartDataConnector'
import { ElementTitle } from './styles'

export default function PublicTrades() {
  const { baseCurrency, quoteCurrency, market, marketAddress } = useMarkets()
  const [trades, setTrades] = useState([])

  useInterval(async () => {
    const trades = await ChartApi.getRecentTrades(marketAddress)
    setTrades(trades)
  }, 5000)

  return (
    <FloatingElement>
      <ElementTitle>Recent Market Trades</ElementTitle>
      <div css={xw`grid grid-cols-3 text-gray-500 font-light mb-2`}>
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
