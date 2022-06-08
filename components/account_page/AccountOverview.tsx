import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { ExclamationIcon } from '@heroicons/react/solid'
import { useTranslation } from 'next-i18next'

import useMangoStore, { PerpPosition } from '../../stores/useMangoStore'
import { formatUsdValue } from '../../utils'
import BalancesTable from '../BalancesTable'
import Switch from '../Switch'
import useLocalStorageState from '../../hooks/useLocalStorageState'
import PerformanceChart from './PerformanceChart'
import PositionsTable from '../PerpPositionsTable'
import LongShortChart from './LongShortChart'
import Tooltip from 'components/Tooltip'
import { CalendarIcon, InformationCircleIcon } from '@heroicons/react/outline'
import { ZERO_BN } from '@blockworks-foundation/mango-client'

dayjs.extend(utc)

const SHOW_ZERO_BALANCE_KEY = 'showZeroAccountBalances-0.2'

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
  const spotBalances = useMangoStore((s) => s.selectedMangoAccount.spotBalances)
  const perpPositions = useMangoStore(
    (s) => s.selectedMangoAccount.perpPositions
  )
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const [showZeroBalances, setShowZeroBalances] = useLocalStorageState(
    SHOW_ZERO_BALANCE_KEY,
    true
  )

  const [pnl, setPnl] = useState(0)
  const [hourlyPerformanceStats, setHourlyPerformanceStats] = useState([])

  useEffect(() => {
    const pubKey = mangoAccount?.publicKey?.toString()
    const fetchData = async () => {
      if (!pubKey) {
        return
      }
      const stats = await fetchHourlyPerformanceStats(pubKey, 30)

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
  }, [mangoAccount, mangoGroup, mangoCache])

  const { longData, shortData, longExposure, shortExposure } = useMemo(() => {
    if (!spotBalances || !perpPositions) {
      return {}
    }

    const DUST_THRESHOLD = 0.05
    const netUnsettledPositionsValue = perpPositions.reduce(
      (a, c) => a + (c?.unsettledPnl ?? 0),
      0
    )

    const longData: any = []
    const shortData: any = []

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
    const dif = longExposure - shortExposure
    if (dif > 0) {
      shortData.push({ symbol: 'spacer', value: dif })
    }

    return { longData, shortData, longExposure, shortExposure }
  }, [spotBalances, perpPositions])

  return mangoAccount ? (
    <>
      <div className="grid grid-cols-12 md:gap-x-6">
        <div className="col-span-12 border-y border-th-bkg-4 p-3 sm:p-4 md:col-span-6 xl:col-span-3">
          <div className="pb-0.5 text-xs text-th-fgd-3 sm:text-sm">
            {t('account-value')}
          </div>
          <div className="text-xl font-bold text-th-fgd-1 sm:text-3xl">
            {formatUsdValue(mangoAccountValue)}
          </div>
        </div>
        <div className="col-span-12 border-b border-th-bkg-4 p-3 sm:p-4 md:col-span-6 md:border-t xl:col-span-3">
          <div className="flex items-center justify-between">
            <div className="flex w-full items-center justify-between pb-0.5 text-xs text-th-fgd-3 sm:text-sm">
              {t('pnl')}{' '}
              {hourlyPerformanceStats?.length ? (
                <div className="flex items-center text-xs text-th-fgd-4">
                  <CalendarIcon className="mr-1 h-4 w-4" />
                  {dayjs(hourlyPerformanceStats[0]['time']).format(
                    'MMM D, h:mma'
                  )}
                </div>
              ) : null}
            </div>
          </div>
          <div className="text-xl font-bold text-th-fgd-1 sm:text-3xl">
            {formatUsdValue(pnl)}
          </div>
        </div>
        <div className="col-span-12 border-th-bkg-4 px-3 pt-3 sm:px-4 sm:pt-4 md:col-span-6 xl:col-span-3 xl:border-t">
          <div className="pb-0.5 text-xs text-th-fgd-3 sm:text-sm">
            {t('health-ratio')}
          </div>
          <div className={`text-xl font-bold text-th-fgd-1 sm:text-3xl`}>
            {maintHealthRatio < 100 ? maintHealthRatio.toFixed(2) : '>100'}%
          </div>
          {mangoAccount.beingLiquidated ? (
            <div className="flex items-center pt-0.5 text-xs sm:pt-2 sm:text-sm">
              <ExclamationIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-th-red sm:h-7 sm:w-7" />
              <span className="text-th-red">{t('being-liquidated')}</span>
            </div>
          ) : null}
          <div className="-mx-3 mt-3 flex h-1 rounded bg-th-bkg-3 sm:-mx-4 sm:mt-4">
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
        <div className="col-span-12 border-b border-th-bkg-4 p-3 sm:p-4 md:col-span-6 xl:col-span-3 xl:border-t">
          <div className="pb-0.5 text-xs text-th-fgd-3 sm:text-sm">
            {t('leverage')}
          </div>
          {mangoGroup && mangoCache ? (
            <div className="text-xl font-bold text-th-fgd-1 sm:text-3xl">
              {mangoAccount.getLeverage(mangoGroup, mangoCache).toFixed(2)}x
            </div>
          ) : null}
        </div>
        <div className="relative col-span-12 mb-4 mt-8 h-[460px] rounded-md border border-th-bkg-4 p-4 sm:h-[400px] md:p-6 lg:col-span-6 lg:mb-0">
          <PerformanceChart
            hourlyPerformanceStats={hourlyPerformanceStats}
            accountValue={mangoAccountValue}
            chartToShow="Value"
          />
        </div>
        <div className="relative col-span-12 h-[460px] rounded-md border border-th-bkg-4 p-4 sm:h-[400px] md:p-6 lg:col-span-6 lg:mt-8">
          <PerformanceChart
            hourlyPerformanceStats={hourlyPerformanceStats}
            accountValue={mangoAccountValue}
            chartToShow="PnL"
          />
        </div>
      </div>
      <div className="my-8">
        <h2 className="mb-4">{t('portfolio-balance')}</h2>
        <div className="grid grid-flow-col grid-cols-1 grid-rows-2 md:grid-cols-2 md:grid-rows-1 md:gap-6">
          <div className="border-t border-th-bkg-4 p-3 sm:p-4 md:border-b">
            <div className="flex items-center justify-between">
              <div>
                <Tooltip content={t('total-long-tooltip')}>
                  <div className="flex items-center space-x-1.5 pb-0.5">
                    <div className="text-th-fgd-3">{t('total-long')}</div>
                    <InformationCircleIcon className="h-5 w-5 text-th-fgd-3" />
                  </div>
                </Tooltip>
                {mangoGroup && mangoCache ? (
                  <div className="text-xl font-bold text-th-fgd-1 md:text-3xl">
                    {formatUsdValue(+longExposure)}
                  </div>
                ) : null}
              </div>
              <LongShortChart type="long" chartData={longData} />
            </div>
          </div>
          <div className="border-b border-t border-th-bkg-4 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <Tooltip content={t('total-short-tooltip')}>
                  <div className="flex items-center space-x-1.5 pb-0.5">
                    <div className="text-th-fgd-3">{t('total-short')}</div>
                    <InformationCircleIcon className="h-5 w-5 text-th-fgd-3" />
                  </div>
                </Tooltip>
                {mangoGroup && mangoCache ? (
                  <div className="text-xl font-bold text-th-fgd-1 md:text-3xl">
                    {formatUsdValue(+shortExposure)}
                  </div>
                ) : null}
              </div>
              <LongShortChart type="short" chartData={shortData} />
            </div>
          </div>
        </div>
      </div>
      <div className="pb-8">
        <h2 className="mb-4">{t('perp-positions')}</h2>
        <PositionsTable />
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
