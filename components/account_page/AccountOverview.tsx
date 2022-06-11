import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { useTranslation } from 'next-i18next'

import useMangoStore from '../../stores/useMangoStore'
import BalancesTable from '../BalancesTable'
import Switch from '../Switch'
import useLocalStorageState from '../../hooks/useLocalStorageState'
import PositionsTable from '../PerpPositionsTable'
import AccountOverviewStats from './AccountOverviewStats'

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
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const [showZeroBalances, setShowZeroBalances] = useLocalStorageState(
    SHOW_ZERO_BALANCE_KEY,
    true
  )

  const [hourlyPerformanceStats, setHourlyPerformanceStats] = useState([])

  useEffect(() => {
    const pubKey = mangoAccount?.publicKey?.toString()
    const fetchData = async () => {
      if (!pubKey) {
        return
      }
      const stats = await fetchHourlyPerformanceStats(pubKey, 30)
      setHourlyPerformanceStats(stats)
    }
    if (pubKey) {
      fetchData()
    }
  }, [mangoAccount?.publicKey])

  const mangoAccountValue = useMemo(() => {
    return mangoAccount && mangoGroup && mangoCache
      ? +mangoAccount.computeValue(mangoGroup, mangoCache)
      : 0
  }, [mangoAccount, mangoGroup, mangoCache])

  return mangoAccount ? (
    <>
      <div className="grid grid-cols-12 md:gap-x-6">
        <div className="relative col-span-12 h-[690px] lg:h-[538px] xl:h-[410px]">
          <AccountOverviewStats
            hourlyPerformanceStats={hourlyPerformanceStats}
            accountValue={mangoAccountValue}
          />
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
