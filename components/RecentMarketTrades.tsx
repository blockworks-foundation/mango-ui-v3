import { useCallback, useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts'
import dayjs from 'dayjs'
import { ChartBarIcon, XIcon } from '@heroicons/react/solid'
import useDimensions from 'react-cool-dimensions'
import { ChartTradeType } from '../@types/types'
import useInterval from '../hooks/useInterval'
import ChartApi from '../utils/chartDataConnector'
import { ElementTitle } from './styles'
import { getDecimalCount, isEqual, numberCompactFormatter } from '../utils'
import useMangoStore from '../stores/useMangoStore'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from './TradePageGrid'
import { ExpandableRow } from './TableElements'

export default function RecentMarketTrades() {
  const mangoConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const market = useMangoStore((s) => s.selectedMarket.current)
  const { screenWidth } = useViewport()
  const isMobile = screenWidth ? screenWidth < breakpoints.sm : false
  const [trades, setTrades] = useState([])
  const [showChart, setShowChart] = useState(false)
  const { observe, width, height } = useDimensions()
  const { theme } = useTheme()

  const fetchTradesForChart = useCallback(async () => {
    if (!marketConfig) return

    const newTrades = await ChartApi.getRecentTrades(
      marketConfig.publicKey.toString()
    )
    if (!newTrades) return null
    if (newTrades.length && trades.length === 0) {
      setTrades(newTrades)
    } else if (
      newTrades?.length &&
      !isEqual(newTrades[0], trades[0], Object.keys(newTrades[0]))
    ) {
      setTrades(newTrades)
    }
  }, [marketConfig, trades])

  useEffect(() => {
    fetchTradesForChart()
  }, [fetchTradesForChart])

  useInterval(async () => {
    fetchTradesForChart()
  }, 5000)

  const ChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-th-bkg-3 p-2 rounded text-th-fgd-3">
          <span className="">{dayjs(label).format('h:mma')}</span>
          <span className="mx-1.5 text-th-fgd-4">|</span>
          <span>
            {`${numberCompactFormatter.format(payload[0].value)}${
              marketConfig.baseSymbol
            }`}
          </span>
        </div>
      )
    }

    return null
  }

  return !isMobile ? (
    <div>
      <div className="flex items-center justify-between pb-3">
        <div className="h-8 w-8" />
        <ElementTitle noMarignBottom>Recent Trades</ElementTitle>
        <button
          onClick={() => setShowChart(!showChart)}
          className="flex items-center justify-center rounded-full bg-th-bkg-3 w-8 h-8 hover:text-th-primary focus:outline-none"
        >
          {showChart ? (
            <XIcon className="w-5 h-5" />
          ) : (
            <ChartBarIcon className="w-4 h-4" />
          )}
        </button>
      </div>
      {showChart ? (
        <div
          className="border border-th-bkg-4 relative mb-4 px-3 pb-2 pt-3 rounded-md"
          ref={observe}
          style={{ height: '144px' }}
        >
          <BarChart width={width} height={height} data={trades}>
            <Tooltip
              cursor={{
                fill: '#fff',
                opacity: 0.2,
              }}
              content={<ChartTooltip />}
            />
            <defs>
              <linearGradient id="gradientBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF9C24" stopOpacity={1} />
                <stop offset="100%" stopColor="#FF9C24" stopOpacity={0.5} />
              </linearGradient>
            </defs>
            <Bar
              isAnimationActive={false}
              type="monotone"
              dataKey="size"
              fill="url(#gradientBar)"
            />
            <XAxis
              dataKey="time"
              axisLine={false}
              hide={trades.length > 0 ? false : true}
              dy={10}
              minTickGap={20}
              reversed
              tick={{
                fill:
                  theme === 'Light'
                    ? 'rgba(0,0,0,0.4)'
                    : 'rgba(255,255,255,0.6)',
                fontSize: 10,
              }}
              tickLine={false}
              tickFormatter={(v) => dayjs(v).format('h:mma')}
            />
            <YAxis
              dataKey="size"
              axisLine={false}
              hide={trades.length > 0 ? false : true}
              dx={-10}
              tick={{
                fill:
                  theme === 'Light'
                    ? 'rgba(0,0,0,0.4)'
                    : 'rgba(255,255,255,0.6)',
                fontSize: 10,
              }}
              tickLine={false}
              tickFormatter={(v) => numberCompactFormatter.format(v)}
              type="number"
              width={40}
            />
          </BarChart>
        </div>
      ) : null}
      <div className={`grid grid-cols-3 text-th-fgd-4 mb-2 text-xs`}>
        <div>Price ({mangoConfig.quoteSymbol}) </div>
        <div className={`text-right`}>Size ({marketConfig.baseSymbol})</div>
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
                  : ''}
              </div>
              <div className={`text-right`}>
                {market?.minOrderSize && !isNaN(trade.size)
                  ? Number(trade.size).toFixed(
                      getDecimalCount(market.minOrderSize)
                    )
                  : ''}
              </div>
              <div className={`text-right text-th-fgd-4`}>
                {trade.time && new Date(trade.time).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  ) : (
    <ExpandableRow
      buttonTemplate={
        <div className="col-span-11 text-left">
          <div className="mb-0.5 text-fgd-1">Recent Trades</div>
        </div>
      }
      index={0}
      panelTemplate={
        !!trades.length && (
          <div className="col-span-2">
            {trades.map((trade: ChartTradeType, i: number) => (
              <div key={i} className={`leading-5 grid grid-cols-3 text-xs`}>
                <div
                  className={`${
                    trade.side === 'buy' ? `text-th-green` : `text-th-red`
                  }`}
                >
                  {market?.tickSize && !isNaN(trade.price)
                    ? Number(trade.price).toFixed(
                        getDecimalCount(market.tickSize)
                      )
                    : ''}
                </div>
                <div className={`text-right`}>
                  {market?.minOrderSize && !isNaN(trade.size)
                    ? Number(trade.size).toFixed(
                        getDecimalCount(market.minOrderSize)
                      )
                    : ''}
                </div>
                <div className={`text-right text-th-fgd-4`}>
                  {trade.time && new Date(trade.time).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )
      }
      rounded
    />
  )
}
