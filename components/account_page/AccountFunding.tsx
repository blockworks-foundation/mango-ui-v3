import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import useMangoStore from '../../stores/useMangoStore'
import {
  Table,
  TableDateDisplay,
  Td,
  Th,
  TrBody,
  TrHead,
} from '../TableElements'
import { isEmpty } from 'lodash'
import { useTranslation } from 'next-i18next'
import Select from '../Select'
import Pagination from '../Pagination'
import usePagination from '../../hooks/usePagination'
import { roundToDecimal } from '../../utils'
import Chart from '../Chart'
import Switch from '../Switch'
import useLocalStorageState from '../../hooks/useLocalStorageState'
import { handleDustTicks } from './AccountInterest'

const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)
import { exportDataToCSV } from '../../utils/export'
import Button from '../Button'
import { SaveIcon } from '@heroicons/react/outline'

const QUOTE_DECIMALS = 6

const AccountFunding = () => {
  const { t } = useTranslation('common')
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const [fundingStats, setFundingStats] = useState<any>([])
  const [hourlyFunding, setHourlyFunding] = useState<any>([])
  const [selectedAsset, setSelectedAsset] = useState<string>('')
  const [loadHourlyStats, setLoadHourlyStats] = useState(false)
  const [loadTotalStats, setLoadTotalStats] = useState(false)
  const {
    paginatedData,
    setData,
    totalPages,
    nextPage,
    previousPage,
    page,
    firstPage,
    lastPage,
  } = usePagination(hourlyFunding[selectedAsset] || [])
  const [hideFundingDust, setHideFundingDust] = useLocalStorageState(
    'hideFundingDust',
    false
  )
  const [chartData, setChartData] = useState([])

  const mangoAccountPk = useMemo(() => {
    return mangoAccount.publicKey.toString()
  }, [mangoAccount])

  const exportFundingDataToCSV = () => {
    const assets = Object.keys(hourlyFunding)
    let dataToExport = []

    for (const asset of assets) {
      dataToExport = [
        ...dataToExport,
        ...hourlyFunding[asset].map((funding) => {
          const timestamp = new Date(funding.time)
          return {
            timestamp: `${timestamp.toLocaleDateString()} ${timestamp.toLocaleTimeString()}`,
            asset: asset,
            amount: funding.total_funding,
          }
        }),
      ]
    }

    const title = `${
      mangoAccount.name || mangoAccount.publicKey
    }-Funding-${new Date().toLocaleDateString()}`
    const columns = ['Timestamp', 'Asset', 'Amount']

    exportDataToCSV(dataToExport, title, columns, t)
  }

  useEffect(() => {
    if (!isEmpty(hourlyFunding)) {
      setData(hourlyFunding[selectedAsset] || [])
    }
  }, [selectedAsset, hourlyFunding])

  useEffect(() => {
    const hideDust = []
    const fetchFundingStats = async () => {
      setLoadTotalStats(true)
      const response = await fetch(
        `https://mango-transaction-log.herokuapp.com/v3/stats/total-funding?mango-account=${mangoAccountPk}`
      )
      const parsedResponse = await response.json()

      if (hideFundingDust) {
        Object.entries(parsedResponse).forEach((r: any) => {
          const funding = r[1].total_funding
          if (Math.abs(funding) > 1) {
            hideDust.push(r)
          }
        })
        setLoadTotalStats(false)
        setFundingStats(hideDust)
      } else {
        setLoadTotalStats(false)
        setFundingStats(Object.entries(parsedResponse))
      }
    }

    const fetchHourlyFundingStats = async () => {
      setLoadHourlyStats(true)
      const response = await fetch(
        `https://mango-transaction-log.herokuapp.com/v3/stats/hourly-funding?mango-account=${mangoAccountPk}`
      )
      const parsedResponse = await response.json()

      let assets
      if (hideFundingDust) {
        const assetsToShow = hideDust.map((a) => a[0])
        assets = Object.keys(parsedResponse).filter((a) =>
          assetsToShow.includes(a)
        )
        setSelectedAsset(assetsToShow[0])
      } else {
        assets = Object.keys(parsedResponse)
      }

      const stats = {}
      for (const asset of assets) {
        const x: any = Object.entries(parsedResponse[asset])

        stats[asset] = x
          .map(([key, value]) => {
            const funding = roundToDecimal(
              value.total_funding,
              QUOTE_DECIMALS + 1
            )
            if (funding !== 0) {
              return { ...value, time: key }
            } else {
              return null
            }
          })
          .filter((x) => x)
          .reverse()
      }

      setLoadHourlyStats(false)
      setHourlyFunding(stats)
    }

    const getStats = async () => {
      fetchFundingStats()
      fetchHourlyFundingStats()
    }
    getStats()
  }, [mangoAccountPk, hideFundingDust])

  useEffect(() => {
    if (hourlyFunding[selectedAsset]) {
      const start = new Date(
        // @ts-ignore
        dayjs().utc().hour(0).minute(0).subtract(29, 'day')
      ).getTime()

      const filtered = hourlyFunding[selectedAsset].filter(
        (d) => new Date(d.time).getTime() > start
      )

      const dailyFunding = []

      for (let i = 0; i < 30; i++) {
        dailyFunding.push({
          funding: 0,
          time: new Date(
            // @ts-ignore
            dayjs().utc().hour(0).minute(0).subtract(i, 'day')
          ).getTime(),
        })
      }

      filtered.forEach((d) => {
        const found = dailyFunding.find(
          (x) =>
            dayjs(x.time).format('DD-MMM') === dayjs(d.time).format('DD-MMM')
        )
        if (found) {
          const newFunding = d.total_funding
          found.funding = found.funding + newFunding
        }
      })

      setChartData(dailyFunding.reverse())
    }
  }, [hourlyFunding, selectedAsset])

  useEffect(() => {
    if (!selectedAsset && Object.keys(hourlyFunding).length > 0) {
      setSelectedAsset(Object.keys(hourlyFunding)[0])
    }
  }, [hourlyFunding])

  return (
    <>
      <div className="flex items-center justify-between pb-4">
        <h2>{t('total-funding')}</h2>
        <div className="flex items-center">
          <Button
            className={`float-right h-8 pt-0 pb-0 pl-3 pr-3 text-xs`}
            onClick={exportFundingDataToCSV}
          >
            <div className={`flex items-center whitespace-nowrap`}>
              <SaveIcon className={`mr-1.5 h-4 w-4`} />
              {t('export-data')}
            </div>
          </Button>
          <Switch
            checked={hideFundingDust}
            className="ml-2 text-xs"
            onChange={() => setHideFundingDust(!hideFundingDust)}
          >
            {t('hide-dust')}
          </Switch>
        </div>
      </div>
      {mangoAccount ? (
        <div>
          {loadTotalStats ? (
            <div className="space-y-2">
              <div className="h-12 w-full animate-pulse rounded-md bg-th-bkg-3" />
              <div className="h-12 w-full animate-pulse rounded-md bg-th-bkg-3" />
              <div className="h-12 w-full animate-pulse rounded-md bg-th-bkg-3" />
            </div>
          ) : (
            <Table>
              <thead>
                <TrHead>
                  <Th>{t('token')}</Th>
                  <Th>{t('total-funding')} (USDC)</Th>
                </TrHead>
              </thead>
              <tbody>
                {fundingStats.length === 0 ? (
                  <TrBody>
                    <td colSpan={4}>
                      <div className="flex">
                        <div className="mx-auto py-4 text-th-fgd-3">
                          {t('no-funding')}
                        </div>
                      </div>
                    </td>
                  </TrBody>
                ) : (
                  fundingStats.map(([symbol, stats]) => {
                    return (
                      <TrBody key={symbol}>
                        <Td className="w-1/2">
                          <div className="flex items-center">
                            <img
                              alt=""
                              width="20"
                              height="20"
                              src={`/assets/icons/${symbol.toLowerCase()}.svg`}
                              className={`mr-2.5`}
                            />
                            {symbol}-PERP
                          </div>
                        </Td>
                        <Td className="w-1/2">
                          <div
                            className={`${
                              stats.total_funding > 0
                                ? 'text-th-green'
                                : stats.total_funding < 0
                                ? 'text-th-red'
                                : 'text-th-fgd-3'
                            }`}
                          >
                            {stats.total_funding
                              ? `${stats.total_funding?.toLocaleString(
                                  undefined,
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )}`
                              : '-'}
                          </div>
                        </Td>
                      </TrBody>
                    )
                  })
                )}
              </tbody>
            </Table>
          )}

          <>
            {!isEmpty(hourlyFunding) && !loadHourlyStats ? (
              <>
                <div className="flex w-full items-center justify-between pb-4 pt-6">
                  <h2>{t('history')}</h2>
                  <Select
                    value={selectedAsset}
                    onChange={(a) => setSelectedAsset(a)}
                    className="w-24 sm:hidden"
                  >
                    <div className="space-y-2">
                      {Object.keys(hourlyFunding).map((token: string) => (
                        <Select.Option
                          key={token}
                          value={token}
                          className={`default-transition relative flex w-full cursor-pointer rounded-md bg-th-bkg-1 px-3 py-3 hover:bg-th-bkg-3 focus:outline-none`}
                        >
                          <div className="flex w-full items-center justify-between">
                            {token}
                          </div>
                        </Select.Option>
                      ))}
                    </div>
                  </Select>
                  <div className="hidden pb-4 sm:flex sm:pb-0">
                    {Object.keys(hourlyFunding).map((token: string) => (
                      <div
                        className={`default-transition ml-2 cursor-pointer rounded-md bg-th-bkg-3 px-2 py-1
                          ${
                            selectedAsset === token
                              ? `text-th-primary ring-1 ring-inset ring-th-primary`
                              : `text-th-fgd-1 opacity-50 hover:opacity-100`
                          }
                        `}
                        onClick={() => setSelectedAsset(token)}
                        key={token}
                      >
                        {token}-PERP
                      </div>
                    ))}
                  </div>
                </div>
                {selectedAsset && chartData.length > 0 ? (
                  <div className="flex w-full flex-col space-x-0 sm:flex-row sm:space-x-4">
                    {chartData.find((d) => d.funding !== 0) ? (
                      <div
                        className="relative mb-6 w-full rounded-md border border-th-bkg-4 p-4"
                        style={{ height: '330px' }}
                      >
                        <Chart
                          hideRangeFilters
                          title={t('funding-chart-title')}
                          xAxis="time"
                          yAxis="funding"
                          data={chartData}
                          labelFormat={(x) =>
                            x &&
                            `${x?.toLocaleString(undefined, {
                              maximumFractionDigits: 6,
                            })} USDC`
                          }
                          tickFormat={handleDustTicks}
                          titleValue={chartData.reduce(
                            (a, c) => a + c.funding,
                            0
                          )}
                          type="bar"
                          useMulticoloredBars
                          yAxisWidth={70}
                          zeroLine
                        />
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <div>
                  <div>
                    {paginatedData.length ? (
                      <Table>
                        <thead>
                          <TrHead>
                            <Th>{t('time')}</Th>
                            <Th>{t('funding')} (USDC)</Th>
                          </TrHead>
                        </thead>
                        <tbody>
                          {paginatedData.map((stat) => {
                            // @ts-ignore
                            const utc = dayjs.utc(stat.time).format()

                            return (
                              <TrBody key={stat.time}>
                                <Td className="w-1/2">
                                  <TableDateDisplay date={utc} />
                                </Td>
                                <Td className="w-1/2">
                                  {stat.total_funding.toFixed(
                                    QUOTE_DECIMALS + 1
                                  )}
                                </Td>
                              </TrBody>
                            )
                          })}
                        </tbody>
                      </Table>
                    ) : (
                      <div className="flex w-full justify-center bg-th-bkg-3 py-4 text-th-fgd-3">
                        {t('no-funding')}
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
            ) : loadHourlyStats ? (
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

export default AccountFunding
