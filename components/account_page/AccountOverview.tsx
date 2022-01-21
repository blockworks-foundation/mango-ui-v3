import { useEffect, useMemo, useState } from 'react'
import { ArrowSmUpIcon, ArrowSmDownIcon } from '@heroicons/react/outline'
import { AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import useMangoStore from '../../stores/useMangoStore'
import { formatUsdValue } from '../../utils'
import BalancesTable from '../BalancesTable'
import PositionsTable from '../PerpPositionsTable'
import Switch from '../Switch'
import useLocalStorageState from '../../hooks/useLocalStorageState'
import { ExclamationIcon } from '@heroicons/react/solid'
import { useTranslation } from 'next-i18next'
import ButtonGroup from '../ButtonGroup'
import useDimensions from 'react-cool-dimensions'
import { useTheme } from 'next-themes'
import { numberCompacter } from '../SwapTokenInfo'

dayjs.extend(utc)

const SHOW_ZERO_BALANCE_KEY = 'showZeroAccountBalances-0.2'

const performanceRangePresets = ['24h', '7d', '30d', 'All']

export default function AccountOverview() {
  const { t } = useTranslation('common')
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const [showZeroBalances, setShowZeroBalances] = useLocalStorageState(
    SHOW_ZERO_BALANCE_KEY,
    true
  )
  const [performanceRange, setPerformanceRange] = useState('All')
  const [hourlyPerformanceStats, setHourlyPerformanceStats] = useState<any>([])
  const [chartData, setChartData] = useState([])
  const { observe, width, height } = useDimensions()
  const [mouseData, setMouseData] = useState<string | null>(null)
  const [chartToShow, setChartToShow] = useState('PnL')
  const { theme } = useTheme()

  const handleMouseMove = (coords) => {
    if (coords.activePayload) {
      setMouseData(coords.activePayload[0].payload)
    }
  }

  const handleMouseLeave = () => {
    setMouseData(null)
  }

  const maintHealthRatio = useMemo(() => {
    return mangoAccount
      ? mangoAccount.getHealthRatio(mangoGroup, mangoCache, 'Maint')
      : 100
  }, [mangoAccount, mangoGroup, mangoCache])

  const initHealthRatio = useMemo(() => {
    return mangoAccount
      ? mangoAccount.getHealthRatio(mangoGroup, mangoCache, 'Init')
      : 100
  }, [mangoAccount, mangoGroup, mangoCache])

  const mangoAccountPk = useMemo(() => {
    return mangoAccount.publicKey.toString()
  }, [mangoAccount])

  useEffect(() => {
    const fetchHourlyPerformanceStats = async () => {
      const response = await fetch(
        `https://mango-transaction-log.herokuapp.com/v3/stats/account-performance?mango-account=${mangoAccountPk}`
      )
      const parsedResponse = await response.json()
      const entries: any = Object.entries(parsedResponse)

      const stats = entries
        .map(([key, value]) => {
          return { ...value, time: key }
        })
        .filter((x) => x)
        .reverse()

      setHourlyPerformanceStats(stats)
    }

    fetchHourlyPerformanceStats()
  }, [mangoAccountPk])

  useEffect(() => {
    if (hourlyPerformanceStats) {
      if (performanceRange === 'All') {
        setChartData(hourlyPerformanceStats.slice().reverse())
      }
      if (performanceRange === '30d') {
        const start = new Date(
          // @ts-ignore
          dayjs().utc().hour(0).minute(0).subtract(29, 'day')
        ).getTime()
        const chartData = hourlyPerformanceStats.filter(
          (d) => new Date(d.time).getTime() > start
        )
        setChartData(chartData.reverse())
      }
      if (performanceRange === '7d') {
        const start = new Date(
          // @ts-ignore
          dayjs().utc().hour(0).minute(0).subtract(7, 'day')
        ).getTime()
        const chartData = hourlyPerformanceStats.filter(
          (d) => new Date(d.time).getTime() > start
        )
        setChartData(chartData.reverse())
      }
      if (performanceRange === '24h') {
        const start = new Date(
          // @ts-ignore
          dayjs().utc().hour(0).minute(0).subtract(1, 'day')
        ).getTime()
        const chartData = hourlyPerformanceStats.filter(
          (d) => new Date(d.time).getTime() > start
        )
        setChartData(chartData.reverse())
      }
    }
  }, [hourlyPerformanceStats, performanceRange])

  const pnlChartColor =
    chartToShow === 'PnL' &&
    chartData.length > 0 &&
    chartData[chartData.length - 1]['pnl'] > 0
      ? theme === 'Mango'
        ? '#AFD803'
        : '#5EBF4D'
      : theme === 'Mango'
      ? '#F84638'
      : '#CC2929'

  const equityChangePercentage =
    chartData.length > 0
      ? ((chartData[chartData.length - 1]['account_equity'] -
          chartData[0]['account_equity']) /
          chartData[0]['account_equity']) *
        100
      : null

  // const pnlChangePercentage =
  //   chartData.length > 0
  //     ? ((chartData[chartData.length - 1]['pnl'] - chartData[1]['pnl']) /
  //         chartData[1]['pnl']) *
  //       100
  //     : null

  const formatDateAxis = (date) => {
    if (['All', '30d'].includes(performanceRange)) {
      return dayjs(date).format('D MMM')
    } else if (performanceRange === '7d') {
      return dayjs(date).format('ddd, h:mma')
    } else {
      return dayjs(date).format('h:mma')
    }
  }

  return mangoAccount ? (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4">
        <h2 className="mb-4 sm:mb-0">Summary</h2>
        <div className="w-full sm:w-56">
          <ButtonGroup
            activeValue={performanceRange}
            onChange={(p) => setPerformanceRange(p)}
            values={performanceRangePresets}
          />
        </div>
      </div>
      <div className="grid grid-flow-col grid-cols-1 grid-rows-2 lg:grid-cols-4 lg:grid-rows-1 lg:gap-6 pb-12">
        <div className="border-t border-th-bkg-4 col-span-1 pb-6 lg:pb-0">
          <div className="border-b border-th-bkg-4 p-3 sm:p-4">
            <div className="pb-0.5 text-th-fgd-3 text-xs sm:text-sm">
              {t('equity')}
            </div>
            <div className="font-bold text-th-fgd-1 text-xl sm:text-2xl">
              {chartData.length > 0 ? (
                formatUsdValue(
                  chartData[chartData.length - 1]['account_equity']
                )
              ) : (
                <div className="animate-pulse bg-th-bkg-3 h-8 mt-1 rounded w-48" />
              )}
            </div>
            {equityChangePercentage ? (
              <div
                className={`flex items-center ${
                  equityChangePercentage >= 0 ? 'text-th-green' : 'text-th-red'
                }`}
              >
                {equityChangePercentage >= 0 ? (
                  <ArrowSmUpIcon className="h-4 w-4" />
                ) : (
                  <ArrowSmDownIcon className="h-4 w-4" />
                )}
                <span className="mr-1">
                  {equityChangePercentage.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                  %
                </span>
                <span className="text-th-fgd-4">
                  {performanceRange === 'All'
                    ? '(All-time)'
                    : `(last ${performanceRange})`}
                </span>
              </div>
            ) : (
              <div className="animate-pulse bg-th-bkg-3 h-4 mt-1 rounded w-16" />
            )}
          </div>
          <div className="border-b border-th-bkg-4 p-3 sm:p-4">
            <div className="pb-0.5 text-th-fgd-3 text-xs sm:text-sm">PnL</div>
            <div className="font-bold text-th-fgd-1 text-xl sm:text-2xl">
              {chartData.length > 0 ? (
                formatUsdValue(chartData[chartData.length - 1]['pnl'])
              ) : (
                <div className="animate-pulse bg-th-bkg-3 h-8 mt-1 rounded w-48" />
              )}
            </div>
            {/* {pnlChangePercentage ? (
              <div
                className={`flex items-center ${
                  chartData[chartData.length - 1]['pnl'] >= 0
                    ? 'text-th-green'
                    : 'text-th-red'
                }`}
              >
                {chartData[chartData.length - 1]['pnl'] >= 0 ? (
                  <ArrowSmUpIcon className="h-4 w-4" />
                ) : (
                  <ArrowSmDownIcon className="h-4 w-4" />
                )}
                <span className="mr-1">
                  {pnlChangePercentage.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                  %
                </span>
                <span className="text-th-fgd-4">
                  {performanceRange === 'All'
                    ? '(All-time)'
                    : `(last ${performanceRange})`}
                </span>
              </div>
            ) : (
              <div className="animate-pulse bg-th-bkg-3 h-4 mt-1 rounded w-16" />
            )} */}
          </div>
          <div className="border-b border-th-bkg-4 p-3 sm:p-4">
            <div className="pb-0.5 text-th-fgd-3 text-xs sm:text-sm">
              {t('leverage')}
            </div>
            <div className="font-bold text-th-fgd-1 text-xl sm:text-2xl">
              {mangoAccount.getLeverage(mangoGroup, mangoCache).toFixed(2)}x
            </div>
          </div>
          <div className="p-3 sm:p-4">
            <div className="pb-0.5 text-th-fgd-3 text-xs sm:text-sm">
              {t('health-ratio')}
            </div>
            <div
              className={`font-bold text-th-fgd-1 text-xl sm:text-2xl ${
                maintHealthRatio > 30
                  ? 'text-th-green'
                  : initHealthRatio > 0
                  ? 'text-th-orange'
                  : 'text-th-red'
              }`}
            >
              {maintHealthRatio < 1000 ? maintHealthRatio.toFixed(2) : '>100'}%
            </div>
            {mangoAccount.beingLiquidated ? (
              <div className="pt-0.5 sm:pt-2 text-xs sm:text-sm flex items-center">
                <ExclamationIcon className="flex-shrink-0 h-5 w-5 sm:h-7 sm:w-7 mr-1.5 text-th-red" />
                <span className="text-th-red">{t('being-liquidated')}</span>
              </div>
            ) : null}
          </div>
          <div className="h-1 flex rounded bg-th-bkg-3">
            <div
              style={{
                width: `${maintHealthRatio}%`,
              }}
              className={`flex rounded ${
                maintHealthRatio > 30
                  ? 'bg-th-green'
                  : initHealthRatio > 0
                  ? 'bg-th-orange'
                  : 'bg-th-red'
              }`}
            ></div>
          </div>
        </div>
        <div className="border-t border-th-bkg-4 col-span-3">
          <div className="h-64 mt-4 w-full" ref={observe}>
            <div className="flex justify-between pb-9">
              <div className="">
                <div className="pb-0.5 text-sm text-th-fgd-3">
                  {chartToShow}{' '}
                  <span className="text-th-fgd-4">
                    {performanceRange === 'All'
                      ? '(All-time)'
                      : `(last ${performanceRange})`}
                  </span>
                </div>
                {mouseData ? (
                  <>
                    <div className="font-bold pb-1 text-xl sm:text-2xl text-th-fgd-1">
                      {formatUsdValue(
                        mouseData[
                          chartToShow === 'PnL' ? 'pnl' : 'account_equity'
                        ]
                      )}
                    </div>
                    <div className="text-xs font-normal text-th-fgd-4">
                      {dayjs(mouseData['time']).format('ddd MMM D YYYY, h:mma')}
                    </div>
                  </>
                ) : chartData.length > 0 ? (
                  <>
                    <div className="font-bold pb-1 text-xl sm:text-2xl text-th-fgd-1">
                      {formatUsdValue(
                        chartData[chartData.length - 1][
                          chartToShow === 'PnL' ? 'pnl' : 'account_equity'
                        ]
                      )}
                    </div>
                    <div className="text-xs font-normal text-th-fgd-4">
                      {dayjs(chartData[chartData.length - 1]['time']).format(
                        'ddd MMM D YYYY, h:mma'
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="animate-pulse bg-th-bkg-3 h-8 mt-1 rounded w-48" />
                    <div className="animate-pulse bg-th-bkg-3 h-4 mt-1 rounded w-24" />
                  </>
                )}
              </div>
              <div className="w-36">
                <ButtonGroup
                  activeValue={chartToShow}
                  className="pb-2 pt-2 text-sm"
                  onChange={(v) => setChartToShow(v)}
                  values={['PnL', t('equity')]}
                />
              </div>
            </div>
            {chartData.length > 0 ? (
              <AreaChart
                width={width}
                height={height}
                data={chartData}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <Tooltip
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
                  dataKey={chartToShow === 'PnL' ? 'pnl' : 'account_equity'}
                  stroke={chartToShow === 'PnL' ? pnlChartColor : '#ffba24'}
                  fill={
                    chartToShow === 'PnL'
                      ? chartData[chartData.length - 1]['pnl'] > 0
                        ? 'url(#greenGradientArea)'
                        : 'url(#redGradientArea)'
                      : 'url(#defaultGradientArea)'
                  }
                  fillOpacity={0.3}
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
                <YAxis
                  dataKey={chartToShow === 'PnL' ? 'pnl' : 'account_equity'}
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
              </AreaChart>
            ) : null}
          </div>
        </div>
      </div>
      <div className="pb-12">
        <div className="text-th-fgd-1 text-lg pb-4">{t('perp-positions')}</div>
        <PositionsTable />
      </div>
      <div className="pb-4 text-th-fgd-1 text-lg">
        {t('assets-liabilities')}
      </div>

      <div className="grid grid-flow-col grid-cols-1 grid-rows-2 md:grid-cols-2 md:grid-rows-1 gap-2 sm:gap-4 pb-12">
        <div className="border border-th-bkg-4 p-3 sm:p-4 rounded-md sm:rounded-lg">
          <div className="pb-0.5 text-xs text-th-fgd-3">
            {t('total-assets')}
          </div>
          <div className="flex items-center">
            <div className="text-lg text-th-fgd-1">
              {formatUsdValue(
                +mangoAccount.getAssetsVal(mangoGroup, mangoCache)
              )}
            </div>
          </div>
        </div>
        <div className="border border-th-bkg-4 p-3 sm:p-4 rounded-md sm:rounded-lg">
          <div className="pb-0.5 text-xs text-th-fgd-3">
            {t('total-liabilities')}
          </div>
          <div className="flex items-center">
            <div className="text-lg text-th-fgd-1">
              {formatUsdValue(
                +mangoAccount.getLiabsVal(mangoGroup, mangoCache)
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-between pb-4">
        <div className="text-th-fgd-1 text-lg">Balances</div>
        <Switch
          checked={showZeroBalances}
          className="text-xs"
          onChange={() => setShowZeroBalances(!showZeroBalances)}
        >
          {t('show-zero')}
        </Switch>
      </div>
      <BalancesTable showZeroBalances={showZeroBalances} />
    </>
  ) : null
}
