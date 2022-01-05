import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import useMangoStore from '../../stores/useMangoStore'
import { Table, Td, Th, TrBody, TrHead } from '../TableElements'
import { useTranslation } from 'next-i18next'
import { isEmpty } from 'lodash'
import usePagination from '../../hooks/usePagination'
import {
  numberCompactFormatter,
} from '../../utils/'
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

const AccountInterest = () => {
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
    return mangoAccount.publicKey.toString()
  }, [mangoAccount])

  const exportInterestDataToCSV = () => {

    const dataToExport = hourlyPerformanceStats.map((row) => {
        const timestamp = new Date(row.time)
        return {
        timestamp: `${timestamp.toLocaleDateString()} ${timestamp.toLocaleTimeString()}`,
        account_equity: row.account_equity,
        pnl: row.pnl
        }
    })

    const title = `${
      mangoAccount.name || mangoAccount.publicKey
    }-Performance-${new Date().toLocaleDateString()}`
    const headers = [
      'Timestamp',
      'Account Equity',
      'PNL'
    ]

    exportDataToCSV(dataToExport, title, headers, t)
  }

  useEffect(() => {
    if (!isEmpty(hourlyPerformanceStats)) {
      setData(hourlyPerformanceStats)
    }
  }, [hourlyPerformanceStats])

  useEffect(() => {

    const fetchHourlyInterestStats = async () => {
      setLoading(true)
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
    
      setLoading(false)
      setHourlyPerformanceStats(stats)
    }

    const getStats = async () => {
      fetchHourlyInterestStats()
    }
    getStats()
  }, [mangoAccountPk])

  useEffect(() => {
    if (hourlyPerformanceStats) {
      const start = new Date(
        // @ts-ignore
        dayjs().utc().hour(0).minute(0).subtract(29, 'day')
      ).getTime()

      const filtered = hourlyPerformanceStats.filter(
        (d) => new Date(d.time).getTime() > start
      )

      setChartData(filtered.reverse())
    }
  }, [hourlyPerformanceStats])

  const increaseYAxisWidth = !!chartData.find((data) => data.value < 0.001)

  return (
    <>
      <div className="flex items-center justify-between pb-4">
        <div className="text-th-fgd-1 text-lg">{t('account-performance')}</div>
        <div className="flex items-center">
          <Button
            className={`float-right text-xs h-8 pt-0 pb-0 pl-3 pr-3`}
            onClick={exportInterestDataToCSV}
          >
            <div className={`flex items-center whitespace-nowrap`}>
              <SaveIcon className={`h-4 w-4 mr-1.5`} />
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
                  <div className="flex flex-col sm:flex-row space-x-0 sm:space-x-4 w-full">
                    <div
                      className="border border-th-bkg-4 relative mb-6 p-4 rounded-md w-full sm:w-1/2"
                      style={{ height: '330px' }}
                    >
                      <Chart
                        hideRangeFilters
                        title={t('account-equity-chart-title')}
                        xAxis="time"
                        yAxis="account_equity"
                        data={chartData}
                        labelFormat={(x) => x && x.toFixed(6 + 1)}
                        tickFormat={handleDustTicks}
                        type="area"
                        yAxisWidth={increaseYAxisWidth ? 70 : 50}
                      />
                    </div>
                    <div
                      className="border border-th-bkg-4 relative mb-6 p-4 rounded-md w-full sm:w-1/2"
                      style={{ height: '330px' }}
                    >
                      <Chart
                        hideRangeFilters
                        title={t('account-pnl-chart-title')}
                        xAxis="time"
                        yAxis="pnl"
                        data={chartData}
                        labelFormat={(x) => x && x.toFixed(6 + 1)}
                        tickFormat={handleDustTicks}
                        type="area"
                        yAxisWidth={increaseYAxisWidth ? 70 : 50}
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
                          {paginatedData.map((stat, index) => {
                            // @ts-ignore
                            const utc = dayjs.utc(stat.time).format()
                            return (
                              <TrBody index={index} key={stat.time}>
                                <Td>{dayjs(utc).format('DD/MM/YY, h:mma')}</Td>
                                <Td>
                                  {stat.account_equity.toFixed(
                                        6 + 1
                                      )}
                                </Td>
                                <Td>
                                  {stat.pnl.toFixed(
                                        6 + 1
                                      )}
                                </Td>
                              </TrBody>
                            )
                          })}
                        </tbody>
                      </Table>
                    ) : (
                      <div className="flex justify-center w-full bg-th-bkg-3 py-4 text-th-fgd-3">
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
              <div className="pt-8 space-y-2">
                <div className="animate-pulse bg-th-bkg-3 h-12 rounded-md w-full" />
                <div className="animate-pulse bg-th-bkg-3 h-12 rounded-md w-full" />
                <div className="animate-pulse bg-th-bkg-3 h-12 rounded-md w-full" />
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

export default AccountInterest
