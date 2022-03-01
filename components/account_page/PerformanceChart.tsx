import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { cloneDeep } from 'lodash'
import dayjs from 'dayjs'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
} from 'recharts'
import { InformationCircleIcon } from '@heroicons/react/outline'
import useDimensions from 'react-cool-dimensions'
import { useTranslation } from 'next-i18next'

import ButtonGroup from '../ButtonGroup'
import { formatUsdValue } from '../../utils'
import { numberCompacter } from '../SwapTokenInfo'
import Checkbox from '../Checkbox'
import Tooltip from '../Tooltip'

type PerformanceChart = {
  hourlyPerformanceStats: any[]
  performanceRange: '24hr' | '7d' | '30d' | '3m'
}

const defaultData = [
  { account_equity: 0, pnl: 0, time: '2022-01-01T00:00:00.000Z' },
  { account_equity: 0, pnl: 0, time: '2023-01-01T00:00:00.000Z' },
]

const PerformanceChart = ({
  hourlyPerformanceStats,
  performanceRange,
  accountValue,
}) => {
  const { theme } = useTheme()
  const { t } = useTranslation('common')
  const { observe, width, height } = useDimensions()

  const [chartData, setChartData] = useState([])
  const [mouseData, setMouseData] = useState<string | null>(null)
  const [chartToShow, setChartToShow] = useState('Value')
  const [showSpotPnl, setShowSpotPnl] = useState(true)
  const [showPerpPnl, setShowPerpPnl] = useState(true)

  useEffect(() => {
    if (hourlyPerformanceStats.length > 0) {
      if (performanceRange === '3m') {
        setChartData(hourlyPerformanceStats.slice().reverse())
      }
      if (performanceRange === '30d') {
        const start = new Date(
          // @ts-ignore
          dayjs().utc().hour(0).minute(0).subtract(29, 'day')
        ).getTime()
        const chartData = cloneDeep(hourlyPerformanceStats).filter(
          (d) => new Date(d.time).getTime() > start
        )
        const pnlStart = chartData[chartData.length - 1].pnl
        const perpPnlStart = chartData[chartData.length - 1].perp_pnl
        for (let i = 0; i < chartData.length; i++) {
          if (i === chartData.length - 1) {
            chartData[i].pnl = 0
            chartData[i].perp_pnl = 0
          } else {
            chartData[i].pnl = chartData[i].pnl - pnlStart
            chartData[i].perp_pnl = chartData[i].perp_pnl - perpPnlStart
          }
        }
        setChartData(chartData.reverse())
      }
      if (performanceRange === '7d') {
        const start = new Date(
          // @ts-ignore
          dayjs().utc().hour(0).minute(0).subtract(7, 'day')
        ).getTime()
        const chartData = cloneDeep(hourlyPerformanceStats).filter(
          (d) => new Date(d.time).getTime() > start
        )
        const pnlStart = chartData[chartData.length - 1].pnl
        const perpPnlStart = chartData[chartData.length - 1].perp_pnl
        for (let i = 0; i < chartData.length; i++) {
          if (i === chartData.length - 1) {
            chartData[i].pnl = 0
            chartData[i].perp_pnl = 0
          } else {
            chartData[i].pnl = chartData[i].pnl - pnlStart
            chartData[i].perp_pnl = chartData[i].perp_pnl - perpPnlStart
          }
        }
        setChartData(chartData.reverse())
      }
      if (performanceRange === '24h') {
        const start = new Date(
          // @ts-ignore
          dayjs().utc().hour(0).minute(0).subtract(1, 'day')
        ).getTime()
        const chartData = cloneDeep(hourlyPerformanceStats).filter(
          (d) => new Date(d.time).getTime() > start
        )
        const pnlStart = chartData[chartData.length - 1].pnl
        const perpPnlStart = chartData[chartData.length - 1].perp_pnl
        for (let i = 0; i < chartData.length; i++) {
          if (i === chartData.length - 1) {
            chartData[i].pnl = 0
            chartData[i].perp_pnl = 0
          } else {
            chartData[i].pnl = chartData[i].pnl - pnlStart
            chartData[i].perp_pnl = chartData[i].perp_pnl - perpPnlStart
          }
        }
        setChartData(chartData.reverse())
      }
    } else {
      setChartData([])
    }
  }, [hourlyPerformanceStats, performanceRange])

  useEffect(() => {
    if (chartData.length > 0) {
      for (const stat of chartData) {
        stat.spot_pnl = stat.pnl - stat.perp_pnl
      }
    }
  }, [chartData])

  const handleMouseMove = (coords) => {
    if (coords.activePayload) {
      setMouseData(coords.activePayload[0].payload)
    }
  }

  const handleMouseLeave = () => {
    setMouseData(null)
  }

  const renderPnlChartTitle = () => {
    if (showPerpPnl && showSpotPnl) {
      return t('pnl')
    }
    if (!showSpotPnl) {
      return `${t('perp')} PnL`
    }
    if (!showPerpPnl) {
      return `${t('spot')} PnL`
    }
  }

  const formatDateAxis = (date) => {
    if (['3m', '30d'].includes(performanceRange)) {
      return dayjs(date).format('D MMM')
    } else if (performanceRange === '7d') {
      return dayjs(date).format('ddd, h:mma')
    } else {
      return dayjs(date).format('h:mma')
    }
  }

  const pnlChartDataKey = () => {
    if (!showPerpPnl && showSpotPnl) {
      return 'spot_pnl'
    } else if (!showSpotPnl && showPerpPnl) {
      return 'perp_pnl'
    } else {
      return 'pnl'
    }
  }

  const pnlChartColor =
    chartToShow === 'PnL' &&
    chartData.length > 0 &&
    chartData[chartData.length - 1][pnlChartDataKey()] > 0
      ? theme === 'Mango'
        ? '#AFD803'
        : '#5EBF4D'
      : theme === 'Mango'
      ? '#F84638'
      : '#CC2929'

  console.log('chartData', chartData)

  return (
    <div className="h-64 mt-4 w-full" ref={observe}>
      <div className="flex justify-between pb-9">
        <div>
          <div className="flex items-center pb-0.5">
            <div className="text-sm text-th-fgd-3">
              {chartToShow === 'Value'
                ? t('account-value')
                : renderPnlChartTitle()}{' '}
              <span className="text-th-fgd-4">
                {`(${t('timeframe-desc', {
                  timeframe: performanceRange,
                })})`}
              </span>
            </div>
            <Tooltip content={t('delayed-info')}>
              <InformationCircleIcon className="cursor-help h-5 ml-1.5 text-th-fgd-3 w-5" />
            </Tooltip>
          </div>
          {mouseData ? (
            <>
              <div className="font-bold pb-1 text-xl text-th-fgd-3">
                {formatUsdValue(
                  mouseData[
                    chartToShow === 'PnL' ? pnlChartDataKey() : 'account_equity'
                  ]
                )}
              </div>
              <div className="text-xs font-normal text-th-fgd-4">
                {dayjs(mouseData['time']).format('ddd MMM D YYYY, h:mma')}
              </div>
            </>
          ) : chartData.length === 0 ? (
            <>
              <div className="font-bold pb-1 text-xl text-th-fgd-3">
                {formatUsdValue(0.0)}
              </div>
              <div className="text-xs font-normal text-th-fgd-4">
                {dayjs().format('ddd MMM D YYYY, h:mma')}
              </div>
            </>
          ) : chartData.length > 0 ? (
            <>
              <div className="font-bold pb-1 text-xl text-th-fgd-3">
                {chartToShow === 'PnL'
                  ? formatUsdValue(
                      chartData[chartData.length - 1][pnlChartDataKey()]
                    )
                  : formatUsdValue(accountValue)}
              </div>
              <div className="text-xs font-normal text-th-fgd-4">
                {chartToShow === 'PnL'
                  ? dayjs(chartData[chartData.length - 1]['time']).format(
                      'ddd MMM D YYYY, h:mma'
                    )
                  : dayjs().format('ddd MMM D YYYY, h:mma')}
              </div>
            </>
          ) : (
            <>
              <div className="animate-pulse bg-th-bkg-3 h-8 mt-1 rounded w-48" />
              <div className="animate-pulse bg-th-bkg-3 h-4 mt-1 rounded w-24" />
            </>
          )}
        </div>
        <div className="flex flex-col items-end">
          <div className="w-36">
            <ButtonGroup
              activeValue={chartToShow}
              className="pb-2 pt-2 text-sm"
              onChange={(v) => setChartToShow(v)}
              values={[t('value'), 'PnL']}
            />
          </div>

          {chartToShow === 'PnL' ? (
            <div className="flex pt-4 space-x-3">
              <Checkbox
                checked={showSpotPnl}
                disabled={!showPerpPnl}
                onChange={(e) => setShowSpotPnl(e.target.checked)}
              >
                {t('include-spot')}
              </Checkbox>
              <Checkbox
                checked={showPerpPnl}
                disabled={!showSpotPnl}
                onChange={(e) => setShowPerpPnl(e.target.checked)}
              >
                {t('include-perp')}
              </Checkbox>
            </div>
          ) : null}
        </div>
      </div>
      {chartData.length > 0 ? (
        <AreaChart
          width={width}
          height={height}
          data={chartData?.length ? chartData : defaultData}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <ChartTooltip
            cursor={{
              strokeOpacity: 0,
            }}
            content={<></>}
          />

          <defs>
            <linearGradient
              id="defaultGradientArea"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#ffba24" stopOpacity={0.9} />
              <stop offset="80%" stopColor="#ffba24" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="greenGradientArea" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={theme === 'Mango' ? '#AFD803' : '#5EBF4D'}
                stopOpacity={0.9}
              />
              <stop
                offset="80%"
                stopColor={theme === 'Mango' ? '#AFD803' : '#5EBF4D'}
                stopOpacity={0}
              />
            </linearGradient>
            <linearGradient id="redGradientArea" x1="0" y1="1" x2="0" y2="0">
              <stop
                offset="0%"
                stopColor={theme === 'Mango' ? '#F84638' : '#CC2929'}
                stopOpacity={0.9}
              />
              <stop
                offset="80%"
                stopColor={theme === 'Mango' ? '#F84638' : '#CC2929'}
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <Area
            isAnimationActive={true}
            type="monotone"
            dataKey={
              chartToShow === 'PnL' ? pnlChartDataKey() : 'account_equity'
            }
            stroke={chartToShow === 'PnL' ? pnlChartColor : '#ffba24'}
            fill={
              chartToShow === 'PnL'
                ? chartData[chartData.length - 1][pnlChartDataKey()] > 0
                  ? 'url(#greenGradientArea)'
                  : 'url(#redGradientArea)'
                : 'url(#defaultGradientArea)'
            }
            fillOpacity={0.3}
          />

          <YAxis
            dataKey={
              chartToShow === 'PnL' ? pnlChartDataKey() : 'account_equity'
            }
            type="number"
            domain={['dataMin', 'dataMax']}
            axisLine={false}
            dx={-10}
            tick={{
              fill:
                theme === 'Light'
                  ? 'rgba(0,0,0,0.4)'
                  : 'rgba(255,255,255,0.35)',
              fontSize: 10,
            }}
            tickLine={false}
            tickFormatter={(v) => numberCompacter.format(v)}
          />
          <XAxis
            dataKey="time"
            axisLine={false}
            dy={10}
            minTickGap={20}
            tick={{
              fill:
                theme === 'Light'
                  ? 'rgba(0,0,0,0.4)'
                  : 'rgba(255,255,255,0.35)',
              fontSize: 10,
            }}
            tickLine={false}
            tickFormatter={(v) => formatDateAxis(v)}
          />
        </AreaChart>
      ) : null}
    </div>
  )
}

export default PerformanceChart
