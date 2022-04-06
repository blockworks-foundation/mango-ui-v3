import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import useMangoStore from '../../stores/useMangoStore'
import { Table, Td, Th, TrBody, TrHead } from '../TableElements'
import { useTranslation } from 'next-i18next'
import isEmpty from 'lodash/isEmpty'
import usePagination from '../../hooks/usePagination'
import { numberCompactFormatter } from '../../utils/'
import Pagination from '../Pagination'
import Chart from '../Chart'

const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)
import { exportDataToCSV } from '../../utils/export'
import { SaveIcon } from '@heroicons/react/outline'
import Button from '../Button'

export const handleDustTicks = (v) =>
  v < 0.000001
    ? v === 0
      ? 0
      : v.toExponential()
    : numberCompactFormatter.format(v)

const AccountPerformance = () => {
  const { t } = useTranslation('common')
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const [hourlyPerformanceStats, setHourlyPerformanceStats] = useState<any>([])
  const [loading, setLoading] = useState(false)
  const [chartData, setChartData] = useState([])
  const {
    paginatedData,
    setData,
    totalPages,
    nextPage,
    previousPage,
    page,
    firstPage,
    lastPage,
  } = usePagination(hourlyPerformanceStats)

  const mangoAccountPk = useMemo(() => {
    if (mangoAccount) {
      return mangoAccount.publicKey.toString()
    }
  }, [mangoAccount])

  const exportPerformanceDataToCSV = () => {
    const dataToExport = hourlyPerformanceStats.map((row) => {
      const timestamp = new Date(row.time)
      return {
        timestamp: `${timestamp.toLocaleDateString()} ${timestamp.toLocaleTimeString()}`,
        account_equity: row.account_equity,
        pnl: row.pnl,
      }
    })

    const title = `${
      mangoAccount?.name || mangoAccount?.publicKey
    }-Performance-${new Date().toLocaleDateString()}`
    const headers = ['Timestamp', 'Account Equity', 'PNL']

    exportDataToCSV(dataToExport, title, headers, t)
  }

  useEffect(() => {
    if (!isEmpty(hourlyPerformanceStats)) {
      setData(hourlyPerformanceStats)
    }
  }, [hourlyPerformanceStats])

  useEffect(() => {
    const fetchHourlyPerformanceStats = async () => {
      setLoading(true)
      const response = await fetch(
        `https://mango-transaction-log.herokuapp.com/v3/stats/account-performance?mango-account=${mangoAccountPk}`
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

      setLoading(false)
      setHourlyPerformanceStats(stats)
    }

    fetchHourlyPerformanceStats()
  }, [mangoAccountPk])

  useEffect(() => {
    if (hourlyPerformanceStats) {
      setChartData(hourlyPerformanceStats.slice().reverse())
    }
  }, [hourlyPerformanceStats])

  const increaseYAxisWidth = !!chartData.find((data: any) => data.value < 0.001)

  return (
    <>
      <div className="flex items-center justify-between pb-4">
        <h2>{t('account-performance')}</h2>
        <div className="flex items-center">
          <Button
            className={`float-right h-8 pt-0 pb-0 pl-3 pr-3 text-xs`}
            onClick={exportPerformanceDataToCSV}
          >
            <div className={`flex items-center whitespace-nowrap`}>
              <SaveIcon className={`mr-1.5 h-4 w-4`} />
              {t('export-data')}
            </div>
          </Button>
        </div>
      </div>
      {mangoAccount ? (
        <div>
          <>
            {!isEmpty(hourlyPerformanceStats) && !loading ? (
              <>
                {chartData.length > 0 ? (
                  <div className="flex w-full flex-col space-x-0 sm:flex-row sm:space-x-4">
                    <div
                      className="relative mb-6 w-full rounded-md border border-th-bkg-4 p-4 sm:w-1/2"
                      style={{ height: '330px' }}
                    >
                      <Chart
                        title={t('account-equity-chart-title')}
                        xAxis="time"
                        yAxis="account_equity"
                        data={chartData}
                        labelFormat={(x) => x && x.toFixed(6 + 1)}
                        tickFormat={handleDustTicks}
                        type="area"
                        yAxisWidth={increaseYAxisWidth ? 70 : 50}
                        showAll
                      />
                    </div>
                    <div
                      className="relative mb-6 w-full rounded-md border border-th-bkg-4 p-4 sm:w-1/2"
                      style={{ height: '330px' }}
                    >
                      <Chart
                        title={t('account-pnl-chart-title')}
                        xAxis="time"
                        yAxis="pnl"
                        data={chartData}
                        labelFormat={(x) => x && x.toFixed(6 + 1)}
                        tickFormat={handleDustTicks}
                        type="area"
                        yAxisWidth={increaseYAxisWidth ? 70 : 50}
                        showAll
                      />
                    </div>
                  </div>
                ) : null}
                <div>
                  <div>
                    {paginatedData.length ? (
                      <Table>
                        <thead>
                          <TrHead>
                            <Th>{t('time')}</Th>
                            <Th>{t('account-equity')}</Th>
                            <Th>{t('account-pnl')}</Th>
                          </TrHead>
                        </thead>
                        <tbody>
                          {paginatedData.map((stat) => {
                            // @ts-ignore
                            const utc = dayjs.utc(stat.time).format()
                            return (
                              <TrBody key={stat.time}>
                                <Td>{dayjs(utc).format('DD/MM/YY, h:mma')}</Td>
                                <Td>{stat.account_equity.toFixed(6 + 1)}</Td>
                                <Td>{stat.pnl.toFixed(6 + 1)}</Td>
                              </TrBody>
                            )
                          })}
                        </tbody>
                      </Table>
                    ) : (
                      <div className="flex w-full justify-center bg-th-bkg-3 py-4 text-th-fgd-3">
                        {t('no-performance-history')}
                      </div>
                    )}
                  </div>
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    nextPage={nextPage}
                    lastPage={lastPage}
                    firstPage={firstPage}
                    previousPage={previousPage}
                  />
                </div>
              </>
            ) : loading ? (
              <div className="space-y-2 pt-8">
                <div className="h-12 w-full animate-pulse rounded-md bg-th-bkg-3" />
                <div className="h-12 w-full animate-pulse rounded-md bg-th-bkg-3" />
                <div className="h-12 w-full animate-pulse rounded-md bg-th-bkg-3" />
              </div>
            ) : null}
          </>
        </div>
      ) : (
        <div>{t('connect-wallet')}</div>
      )}
    </>
  )
}

export default AccountPerformance
