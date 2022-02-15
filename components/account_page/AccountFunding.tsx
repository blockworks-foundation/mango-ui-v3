import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import useMangoStore from '../../stores/useMangoStore'
import { Table, Td, Th, TrBody, TrHead } from '../TableElements'
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
      await fetchFundingStats()
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
        <div className="text-th-fgd-1 text-lg">{t('total-funding')}</div>
        <div className="flex items-center">
          <Button
            className={`float-right text-xs h-8 pt-0 pb-0 pl-3 pr-3`}
            onClick={exportFundingDataToCSV}
          >
            <div className={`flex items-center whitespace-nowrap`}>
              <SaveIcon className={`h-4 w-4 mr-1.5`} />
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
              <div className="animate-pulse bg-th-bkg-3 h-12 rounded-md w-full" />
              <div className="animate-pulse bg-th-bkg-3 h-12 rounded-md w-full" />
              <div className="animate-pulse bg-th-bkg-3 h-12 rounded-md w-full" />
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
                              ? `${stats.total_funding?.toFixed(6)}`
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
                <div className="flex items-center justify-between pb-4 pt-6 w-full">
                  <div className="text-th-fgd-1 text-lg">{t('history')}</div>
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
                          className={`bg-th-bkg-1 relative rounded-md w-full px-3 py-3 cursor-pointer default-transition flex hover:bg-th-bkg-3 focus:outline-none`}
                        >
                          <div className="flex items-center justify-between w-full">
                            {token}
                          </div>
                        </Select.Option>
                      ))}
                    </div>
                  </Select>
                  <div className="hidden sm:flex pb-4 sm:pb-0">
                    {Object.keys(hourlyFunding).map((token: string) => (
                      <div
                        className={`px-2 py-1 ml-2 rounded-md cursor-pointer default-transition bg-th-bkg-3
                          ${
                            selectedAsset === token
                              ? `ring-1 ring-inset ring-th-primary text-th-primary`
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
                  <div className="flex flex-col sm:flex-row space-x-0 sm:space-x-4 w-full">
                    {chartData.find((d) => d.funding !== 0) ? (
                      <div
                        className="border border-th-bkg-4 relative mb-6 p-4 rounded-md w-full"
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
                                  {dayjs(utc).format('DD/MM/YY, h:mma')}
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
                      <div className="flex justify-center w-full bg-th-bkg-3 py-4 text-th-fgd-3">
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

export default AccountFunding
