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

export const fetchHourlyPerformanceStats = async (
  mangoAccountPk: string,
  range: number
) => {
  const response = await fetch(
    `https://mango-transaction-log.herokuapp.com/v3/stats/account-performance-detailed?mango-account=${mangoAccountPk}&start-date=${dayjs()
      .subtract(range, 'day')
      .format('YYYY-MM-DD')}`
  )
  const parsedResponse = await response.json()
  const entries: any = Object.entries(parsedResponse).sort((a, b) =>
    b[0].localeCompare(a[0])
  )

  const stats = entries
    .map(([key, value]) => {
      return { ...value, time: key }
    })
    .filter((x) => x)

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
    const pubKey = mangoAccount?.publicKey?.toString()
    const fetchData = async () => {
      if (!pubKey) {
        return
      }
      const stats = await fetchHourlyPerformanceStats(
        pubKey,
        performanceRangePresets[performanceRangePresets.length - 1].value
      )

      setPnl(stats?.length ? stats?.[0]?.['pnl'] : 0)
      setHourlyPerformanceStats(stats)
    }
    if (pubKey) {
      fetchData()
    }
  }, [mangoAccount?.publicKey])

  const maintHealthRatio = useMemo(() => {
    return mangoAccount && mangoGroup && mangoCache
      ? mangoAccount.getHealthRatio(mangoGroup, mangoCache, 'Maint')
      : 100
  }, [mangoAccount, mangoGroup, mangoCache])

  const initHealthRatio = useMemo(() => {
    return mangoAccount && mangoGroup && mangoCache
      ? mangoAccount.getHealthRatio(mangoGroup, mangoCache, 'Init')
      : 100
  }, [mangoAccount, mangoGroup, mangoCache])

  const mangoAccountValue = useMemo(() => {
    return mangoAccount && mangoGroup && mangoCache
      ? +mangoAccount.computeValue(mangoGroup, mangoCache)
      : 0
  }, [mangoAccount])

  return mangoAccount ? (
    <>
      <div className="flex flex-col pb-8 md:flex-row md:space-x-6 md:pb-12">
        <div className="w-full pb-8 md:w-1/3 md:pb-0 lg:w-1/4">
          <h2 className="mb-4">{t('summary')}</h2>
          <div className="border-y border-th-bkg-4 p-3 sm:p-4">
            <div className="pb-0.5 text-xs text-th-fgd-3 sm:text-sm">
              {t('account-value')}
            </div>
            <div className="text-xl font-bold text-th-fgd-1 sm:text-2xl">
              {formatUsdValue(mangoAccountValue)}
            </div>
          </div>
          <div className="border-b border-th-bkg-4 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="pb-0.5 text-xs text-th-fgd-3 sm:text-sm">
                {t('pnl')}{' '}
                {hourlyPerformanceStats?.length ? (
                  <div className="text-xs text-th-fgd-4">
                    {dayjs(hourlyPerformanceStats[0]['time']).format(
                      'MMM D YYYY, h:mma'
                    )}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="text-xl font-bold text-th-fgd-1 sm:text-2xl">
              {formatUsdValue(pnl)}
            </div>
          </div>
          <div className="border-b border-th-bkg-4 p-3 sm:p-4">
            <div className="pb-0.5 text-xs text-th-fgd-3 sm:text-sm">
              {t('leverage')}
            </div>
            {mangoGroup && mangoCache ? (
              <div className="text-xl font-bold text-th-fgd-1 sm:text-2xl">
                {mangoAccount.getLeverage(mangoGroup, mangoCache).toFixed(2)}x
              </div>
            ) : null}
          </div>
          <div className="p-3 sm:p-4">
            <div className="pb-0.5 text-xs text-th-fgd-3 sm:text-sm">
              {t('health-ratio')}
            </div>
            <div className={`text-xl font-bold text-th-fgd-1 sm:text-2xl`}>
              {maintHealthRatio < 1000 ? maintHealthRatio.toFixed(2) : '>100'}%
            </div>
            {mangoAccount.beingLiquidated ? (
              <div className="flex items-center pt-0.5 text-xs sm:pt-2 sm:text-sm">
                <ExclamationIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-th-red sm:h-7 sm:w-7" />
                <span className="text-th-red">{t('being-liquidated')}</span>
              </div>
            ) : null}
          </div>
          <div className="flex h-1 rounded bg-th-bkg-3">
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
        <div className="h-80 w-full md:h-auto md:w-2/3 lg:w-3/4">
          <div className="mb-4 ml-auto md:w-56">
            <ButtonGroup
              activeValue={performanceRange}
              onChange={(p) => setPerformanceRange(p)}
              values={performanceRangePresetLabels}
            />
          </div>
          <div className="md:border-t md:border-th-bkg-4">
            <PerformanceChart
              hourlyPerformanceStats={hourlyPerformanceStats}
              performanceRange={performanceRange}
              accountValue={mangoAccountValue}
            />
          </div>
        </div>
      </div>
      <div className="pb-8 pt-20 md:pt-0">
        <h2 className="mb-4">{t('perp-positions')}</h2>
        <PositionsTable />
      </div>
      <h2 className="mb-4">{t('assets-liabilities')}</h2>

      <div className="grid grid-flow-col grid-cols-1 grid-rows-2 pb-8 md:grid-cols-2 md:grid-rows-1 md:gap-4 md:pb-12">
        <div className="border-t border-th-bkg-4 p-3 sm:p-4 md:border-b">
          <div className="pb-0.5 text-th-fgd-3">{t('total-assets')}</div>
          <div className="flex items-center">
            {mangoGroup && mangoCache ? (
              <div className="text-xl font-bold text-th-fgd-1 md:text-2xl">
                {formatUsdValue(
                  +mangoAccount.getAssetsVal(mangoGroup, mangoCache)
                )}
              </div>
            ) : null}
          </div>
        </div>
        <div className="border-b border-t border-th-bkg-4 p-3 sm:p-4">
          <div className="pb-0.5 text-th-fgd-3">{t('total-liabilities')}</div>
          <div className="flex items-center">
            {mangoGroup && mangoCache ? (
              <div className="text-xl font-bold text-th-fgd-1 md:text-2xl">
                {formatUsdValue(
                  +mangoAccount.getLiabsVal(mangoGroup, mangoCache)
                )}
              </div>
            ) : null}
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
