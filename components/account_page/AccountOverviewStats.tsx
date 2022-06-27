import { useState, useEffect, useMemo } from 'react'
import { useTheme } from 'next-themes'
import cloneDeep from 'lodash/cloneDeep'
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
import { ZERO_BN } from '@blockworks-foundation/mango-client'
import ButtonGroup from '../ButtonGroup'
import { formatUsdValue } from '../../utils'
import { numberCompacter } from '../SwapTokenInfo'
import Checkbox from '../Checkbox'
import Tooltip from '../Tooltip'
import useMangoStore, { PerpPosition } from 'stores/useMangoStore'
import LongShortChart from './LongShortChart'
import HealthHeart from 'components/HealthHeart'

type AccountOverviewStats = {
  hourlyPerformanceStats: any[]
  performanceRange: '24hr' | '7d' | '30d' | '3m'
}

const defaultData = [
  { account_equity: 0, pnl: 0, time: '2022-01-01T00:00:00.000Z' },
  { account_equity: 0, pnl: 0, time: '2023-01-01T00:00:00.000Z' },
]

const performanceRangePresets = [
  { label: '24h', value: 1 },
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '3m', value: 90 },
]
const performanceRangePresetLabels = performanceRangePresets.map((x) => x.label)

const AccountOverviewStats = ({ hourlyPerformanceStats, accountValue }) => {
  const { theme } = useTheme()
  const { t } = useTranslation('common')
  const { observe, width, height } = useDimensions()
  const [chartToShow, setChartToShow] = useState<string>('Value')
  const [chartData, setChartData] = useState<any[]>([])
  const [mouseData, setMouseData] = useState<string | null>(null)
  const [performanceRange, setPerformanceRange] = useState('30d')
  const [showSpotPnl, setShowSpotPnl] = useState(true)
  const [showPerpPnl, setShowPerpPnl] = useState(true)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const spotBalances = useMangoStore((s) => s.selectedMangoAccount.spotBalances)
  const perpPositions = useMangoStore(
    (s) => s.selectedMangoAccount.perpPositions
  )

  const maintHealthRatio = useMemo(() => {
    return mangoAccount && mangoGroup && mangoCache
      ? mangoAccount.getHealthRatio(mangoGroup, mangoCache, 'Maint')
      : 100
  }, [mangoAccount, mangoGroup, mangoCache])

  const { longData, shortData, longExposure, shortExposure } = useMemo(() => {
    const longData: any = []
    const shortData: any = []

    if (!spotBalances || !perpPositions) {
      longData.push({ symbol: 'spacer', value: 1 })
      shortData.push({ symbol: 'spacer', value: 1 })
      // return {}
    }

    const DUST_THRESHOLD = 0.05
    const netUnsettledPositionsValue = perpPositions.reduce(
      (a, c) => a + (c?.unsettledPnl ?? 0),
      0
    )

    for (const { net, symbol, value } of spotBalances) {
      let amount = Number(net)
      let totValue = Number(value)
      if (symbol === 'USDC') {
        amount += netUnsettledPositionsValue
        totValue += netUnsettledPositionsValue
      }
      if (totValue > DUST_THRESHOLD) {
        longData.push({
          asset: symbol,
          amount: amount,
          symbol: symbol,
          value: totValue,
        })
      }
      if (-totValue > DUST_THRESHOLD) {
        shortData.push({
          asset: symbol,
          amount: Math.abs(amount),
          symbol: symbol,
          value: Math.abs(totValue),
        })
      }
    }
    for (const {
      marketConfig,
      basePosition,
      notionalSize,
      perpAccount,
    } of perpPositions.filter((p) => !!p) as PerpPosition[]) {
      if (notionalSize < DUST_THRESHOLD) continue

      if (perpAccount.basePosition.gt(ZERO_BN)) {
        longData.push({
          asset: marketConfig.name,
          amount: basePosition,
          symbol: marketConfig.baseSymbol,
          value: notionalSize,
        })
      } else {
        shortData.push({
          asset: marketConfig.name,
          amount: Math.abs(basePosition),
          symbol: marketConfig.baseSymbol,
          value: notionalSize,
        })
      }
    }
    const longExposure = longData.reduce((a, c) => a + c.value, 0)
    const shortExposure = shortData.reduce((a, c) => a + c.value, 0)
    if (shortExposure === 0) {
      shortData.push({ symbol: 'spacer', value: 1 })
    }
    if (longExposure === 0) {
      longData.push({ symbol: 'spacer', value: 1 })
    }
    const dif = longExposure - shortExposure
    if (dif > 0) {
      shortData.push({ symbol: 'spacer', value: dif })
    }

    return { longData, shortData, longExposure, shortExposure }
  }, [spotBalances, perpPositions])

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
      return `${t('perp')} ${t('pnl')}`
    }
    if (!showPerpPnl) {
      return `${t('spot')} ${t('pnl')}`
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

  return (
    <div className="grid grid-cols-12 lg:gap-6">
      <div className="order-2 col-span-12 lg:order-1 lg:col-span-4">
        <div className="px-3 pb-4 xl:pb-6">
          <div className="flex items-center pb-1.5">
            <div className="text-sm text-th-fgd-3">
              {chartToShow === 'Value'
                ? t('account-value')
                : renderPnlChartTitle()}{' '}
            </div>
          </div>
          {mouseData ? (
            <>
              <div className="pb-1 text-2xl font-bold text-th-fgd-1 sm:text-3xl">
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
              <div className="pb-1 text-2xl font-bold text-th-fgd-1 sm:text-3xl">
                {chartToShow === 'PnL' ? '--' : formatUsdValue(accountValue)}
              </div>
              <div className="text-xs font-normal text-th-fgd-4">
                {dayjs().format('ddd MMM D YYYY, h:mma')}
              </div>
            </>
          ) : chartData.length > 0 ? (
            <>
              <div className="pb-1 text-2xl font-bold text-th-fgd-1 sm:text-3xl">
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
              <div className="mt-1 h-8 w-48 animate-pulse rounded bg-th-bkg-3" />
              <div className="mt-1 h-4 w-24 animate-pulse rounded bg-th-bkg-3" />
            </>
          )}
        </div>
        <div className="flex flex-col divide-y divide-th-bkg-3 border-y border-th-bkg-3 md:flex-row md:divide-y-0 md:p-3 lg:flex-col lg:divide-y lg:p-0 xl:flex-row xl:divide-y-0 xl:p-5">
          <div className="flex w-full items-center justify-between space-x-2 p-3 md:w-1/2 md:p-0 lg:w-full lg:p-3 xl:w-1/2 xl:p-0">
            <div>
              <Tooltip
                content={
                  <div>
                    {t('tooltip-account-liquidated')}{' '}
                    <a
                      href="https://docs.mango.markets/mango/health-overview"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('learn-more')}
                    </a>
                  </div>
                }
              >
                <div className="flex items-center space-x-1.5 pb-0.5">
                  <div className="text-th-fgd-3">{t('health')}</div>
                  <InformationCircleIcon className="h-5 w-5 flex-shrink-0 cursor-help text-th-fgd-3" />
                </div>
              </Tooltip>
              <div className={`text-lg font-bold text-th-fgd-1`}>
                {maintHealthRatio < 100 ? maintHealthRatio.toFixed(2) : '>100'}%
              </div>
            </div>
            <HealthHeart size={40} health={Number(maintHealthRatio)} />
          </div>
          <div className="w-full p-3 md:w-1/2 md:p-0 md:px-4 md:pl-4 lg:w-full lg:p-3 xl:w-1/2 xl:p-0 xl:pl-4">
            <div className="pb-0.5 text-th-fgd-3">{t('leverage')}</div>
            {mangoGroup && mangoCache ? (
              <div className={`text-lg font-bold text-th-fgd-1`}>
                {mangoAccount?.getLeverage(mangoGroup, mangoCache).toFixed(2)}x
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col divide-y divide-th-bkg-3 border-b border-th-bkg-3 md:flex-row md:divide-y-0 md:p-3 lg:flex-col lg:divide-y lg:p-0 xl:flex-row xl:divide-y-0 xl:p-5">
          <div className="flex w-full items-center justify-between p-3 md:p-0 lg:p-3 xl:w-1/2 xl:p-0 ">
            <div>
              <Tooltip content={t('total-long-tooltip')}>
                <div className="flex items-center space-x-1.5 pb-0.5">
                  <div className="text-th-fgd-3">{t('long-exposure')}</div>
                  <InformationCircleIcon className="h-5 w-5 flex-shrink-0 cursor-help text-th-fgd-3" />
                </div>
              </Tooltip>
              {mangoGroup && mangoCache ? (
                <div className="text-lg font-bold text-th-fgd-1">
                  {formatUsdValue(+longExposure)}
                </div>
              ) : null}
            </div>
            <LongShortChart chartData={longData} />
          </div>
          <div className="flex w-full items-center justify-between p-3 md:p-0 md:pl-4 lg:p-3 xl:w-1/2 xl:p-0 xl:pl-4">
            <div>
              <Tooltip content={t('total-short-tooltip')}>
                <div className="flex items-center space-x-1.5 pb-0.5">
                  <div className="text-th-fgd-3">{t('short-exposure')}</div>
                  <InformationCircleIcon className="h-5 w-5 flex-shrink-0 cursor-help text-th-fgd-3" />
                </div>
              </Tooltip>
              {mangoGroup && mangoCache ? (
                <div className="text-lg font-bold text-th-fgd-1">
                  {formatUsdValue(+shortExposure)}
                </div>
              ) : null}
            </div>
            <LongShortChart chartData={shortData} />
          </div>
        </div>
      </div>
      <div className="order-1 col-span-12 px-4 pb-6 lg:order-2 lg:col-span-8 lg:pb-0 xl:px-6">
        <div className="mb-4 flex justify-between space-x-2 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3">
            <div className="mb-3 w-28 sm:mb-0">
              <ButtonGroup
                activeValue={chartToShow}
                className="h-8"
                onChange={(c) => setChartToShow(c)}
                values={['Value', 'PnL']}
              />
            </div>
            {chartToShow === 'PnL' && chartData.length ? (
              <div className="flex space-x-3">
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
          <div className="w-40">
            <ButtonGroup
              activeValue={performanceRange}
              className="h-8"
              onChange={(p) => setPerformanceRange(p)}
              values={performanceRangePresetLabels}
            />
          </div>
        </div>
        {chartData.length > 0 ? (
          <div className="h-48 md:h-64 lg:h-[340px] xl:h-[225px]" ref={observe}>
            <AreaChart
              width={width}
              height={height + 12}
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
                <linearGradient
                  id="greenGradientArea"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
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
                <linearGradient
                  id="redGradientArea"
                  x1="0"
                  y1="1"
                  x2="0"
                  y2="0"
                >
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
          </div>
        ) : (
          <div className="flex h-48 w-full items-center justify-center rounded-md bg-th-bkg-3 md:h-64 lg:h-[410px] xl:h-[270px]">
            <p className="mb-0">{t('no-chart')}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AccountOverviewStats
