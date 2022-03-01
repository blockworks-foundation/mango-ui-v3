import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { ExclamationIcon } from '@heroicons/react/solid'
import { useTranslation } from 'next-i18next'

import useMangoStore from '../../stores/useMangoStore'
import { formatUsdValue } from '../../utils'
import BalancesTable from '../BalancesTable'
import Switch from '../Switch'
import useLocalStorageState from '../../hooks/useLocalStorageState'
import ButtonGroup from '../ButtonGroup'
import PerformanceChart from './PerformanceChart'
import PositionsTable from '../PerpPositionsTable'

dayjs.extend(utc)

const SHOW_ZERO_BALANCE_KEY = 'showZeroAccountBalances-0.2'

const performanceRangePresets = [
  { label: '24h', value: 1 },
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '3m', value: 90 },
]
const performanceRangePresetLabels = performanceRangePresets.map((x) => x.label)

const fetchHourlyPerformanceStats = async (mangoAccountPk: string) => {
  const range =
    performanceRangePresets[performanceRangePresets.length - 1].value
  const response = await fetch(
    `https://mango-transaction-log.herokuapp.com/v3/stats/account-performance-detailed?mango-account=${mangoAccountPk}&start-date=${dayjs()
      .subtract(range, 'day')
      .format('YYYY-MM-DD')}`
  )
  const parsedResponse = await response.json()
  const entries: any = Object.entries(parsedResponse)

  const stats = entries
    .map(([key, value]) => {
      return { ...value, time: key }
    })
    .filter((x) => x)
    .reverse()

  return stats
}

export default function AccountOverview() {
  const { t } = useTranslation('common')
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const [showZeroBalances, setShowZeroBalances] = useLocalStorageState(
    SHOW_ZERO_BALANCE_KEY,
    true
  )

  const [pnl, setPnl] = useState(0)
  const [performanceRange, setPerformanceRange] = useState('30d')
  const [hourlyPerformanceStats, setHourlyPerformanceStats] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      const stats = await fetchHourlyPerformanceStats(
        mangoAccount.publicKey.toString()
      )

      setPnl(stats?.length ? stats?.[0]?.['pnl'] : 0)
      setHourlyPerformanceStats(stats)
    }
    fetchData()
  }, [mangoAccount.publicKey])

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

  const mangoAccountValue = useMemo(() => {
    return +mangoAccount.computeValue(mangoGroup, mangoCache)
  }, [mangoAccount])

  return mangoAccount ? (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4">
        <h2 className="mb-4 sm:mb-0">{t('summary')}</h2>
        <div className="w-full sm:w-56">
          <ButtonGroup
            activeValue={performanceRange}
            onChange={(p) => setPerformanceRange(p)}
            values={performanceRangePresetLabels}
          />
        </div>
      </div>
      <div className="flex flex-col lg:flex-row lg:space-x-6 pb-8 lg:pb-12">
        <div className="border-t border-th-bkg-4 pb-6 lg:pb-0 w-full lg:w-1/4">
          <div className="border-b border-th-bkg-4 p-3 sm:p-4">
            <div className="pb-0.5 text-th-fgd-3 text-xs sm:text-sm">
              {t('account-value')}
            </div>
            <div className="font-bold text-th-fgd-3 text-xl sm:text-2xl">
              {formatUsdValue(mangoAccountValue)}
            </div>
          </div>
          <div className="border-b border-th-bkg-4 p-3 sm:p-4">
            <div className="pb-0.5 text-th-fgd-3 text-xs sm:text-sm">
              {t('pnl')}{' '}
              {hourlyPerformanceStats?.length ? (
                <span className="text-th-fgd-4 text-xxs">
                  (
                  {dayjs(hourlyPerformanceStats[0]['time']).format(
                    'MMM D YYYY, h:mma'
                  )}
                  )
                </span>
              ) : null}
            </div>
            <div className="font-bold text-th-fgd-3 text-xl sm:text-2xl">
              {formatUsdValue(pnl)}
            </div>
          </div>
          <div className="border-b border-th-bkg-4 p-3 sm:p-4">
            <div className="pb-0.5 text-th-fgd-3 text-xs sm:text-sm">
              {t('leverage')}
            </div>
            <div className="font-bold text-th-fgd-3 text-xl sm:text-2xl">
              {mangoAccount.getLeverage(mangoGroup, mangoCache).toFixed(2)}x
            </div>
          </div>
          <div className="p-3 sm:p-4">
            <div className="pb-0.5 text-th-fgd-3 text-xs sm:text-sm">
              {t('health-ratio')}
            </div>
            <div className={`font-bold text-th-fgd-3 text-xl sm:text-2xl`}>
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
        <div className="border-t border-th-bkg-4 h-80 lg:h-auto w-full lg:w-3/4">
          <PerformanceChart
            hourlyPerformanceStats={hourlyPerformanceStats}
            performanceRange={performanceRange}
            accountValue={mangoAccountValue}
          />
        </div>
      </div>
      <div className="pb-8">
        <h2 className="mb-4">{t('perp-positions')}</h2>
        <PositionsTable />
      </div>
      <h2 className="mb-4">{t('assets-liabilities')}</h2>

      <div className="grid grid-flow-col grid-cols-1 grid-rows-2 md:grid-cols-2 md:grid-rows-1 gap-2 sm:gap-4 pb-8 lg:pb-12">
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
        <h2>{t('balances')}</h2>
        <Switch
          checked={showZeroBalances}
          className="text-xs"
          onChange={() => setShowZeroBalances(!showZeroBalances)}
        >
          {t('show-zero')}
        </Switch>
      </div>
      <BalancesTable showZeroBalances={showZeroBalances} showDepositWithdraw />
    </>
  ) : null
}
