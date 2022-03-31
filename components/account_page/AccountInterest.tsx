import { getTokenBySymbol } from '@blockworks-foundation/mango-client'
import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import useMangoStore from '../../stores/useMangoStore'
import Select from '../Select'
import {
  Table,
  TableDateDisplay,
  Td,
  Th,
  TrBody,
  TrHead,
} from '../TableElements'
import { useTranslation } from 'next-i18next'
import isEmpty from 'lodash/isEmpty'
import usePagination from '../../hooks/usePagination'
import { numberCompactFormatter, roundToDecimal } from '../../utils/'
import Pagination from '../Pagination'
import { useViewport } from '../../hooks/useViewport'
import { breakpoints } from '../TradePageGrid'
import { ExpandableRow } from '../TableElements'
import MobileTableHeader from '../mobile/MobileTableHeader'
import Chart from '../Chart'
import Switch from '../Switch'
import useLocalStorageState from '../../hooks/useLocalStorageState'

const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)
import { exportDataToCSV } from '../../utils/export'
import { SaveIcon } from '@heroicons/react/outline'
import Button from '../Button'

interface InterestStats {
  [key: string]: {
    total_borrow_interest: number
    total_deposit_interest: number
  }
}

export const handleDustTicks = (v) =>
  Math.abs(v) < 0.0000099
    ? v === 0
      ? 0
      : v.toExponential()
    : numberCompactFormatter.format(v)

const handleUsdDustTicks = (v) =>
  Math.abs(v) < 0.0000099
    ? v === 0
      ? '$0'
      : `$${v.toExponential()}`
    : `$${numberCompactFormatter.format(v)}`

const AccountInterest = () => {
  const { t } = useTranslation('common')
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const groupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const [interestStats, setInterestStats] = useState<any>([])
  const [hourlyInterestStats, setHourlyInterestStats] = useState<any>({})
  const [loadHourlyStats, setLoadHourlyStats] = useState(false)
  const [loadTotalStats, setLoadTotalStats] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<string>('')
  const [chartData, setChartData] = useState<any[]>([])
  const {
    paginatedData,
    setData,
    totalPages,
    nextPage,
    previousPage,
    page,
    firstPage,
    lastPage,
  } = usePagination(hourlyInterestStats[selectedAsset] || [])
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.md : false
  const [hideInterestDust, sethideInterestDust] = useLocalStorageState(
    'hideInterestDust',
    false
  )

  const mangoAccountPk = useMemo(() => {
    if (mangoAccount) {
      return mangoAccount.publicKey.toString()
    }
  }, [mangoAccount])

  const token = useMemo(() => {
    if (selectedAsset) {
      return getTokenBySymbol(groupConfig, selectedAsset)
    }
  }, [selectedAsset])

  const exportInterestDataToCSV = () => {
    const assets = Object.keys(hourlyInterestStats)
    let dataToExport: any[] = []

    for (const asset of assets) {
      dataToExport = [
        ...dataToExport,
        ...hourlyInterestStats[asset].map((interest) => {
          const timestamp = new Date(interest.time)
          return {
            timestamp: `${timestamp.toLocaleDateString()} ${timestamp.toLocaleTimeString()}`,
            asset: asset,
            deposit_interest: interest.deposit_interest,
            borrow_interest: interest.borrow_interest,
          }
        }),
      ]
    }

    const title = `${
      mangoAccount?.name || mangoAccount?.publicKey
    }-Interest-${new Date().toLocaleDateString()}`
    const headers = [
      'Timestamp',
      'Asset',
      'Deposit Interest',
      'Borrow Interest',
    ]

    exportDataToCSV(dataToExport, title, headers, t)
  }

  useEffect(() => {
    if (!isEmpty(hourlyInterestStats)) {
      setData(hourlyInterestStats[selectedAsset] || [])
    }
  }, [selectedAsset, hourlyInterestStats])

  useEffect(() => {
    if (!selectedAsset && Object.keys(hourlyInterestStats).length > 0) {
      setSelectedAsset(Object.keys(hourlyInterestStats)[0])
    }
  }, [hourlyInterestStats])

  useEffect(() => {
    const hideDust: any[] = []
    const fetchInterestStats = async () => {
      setLoadTotalStats(true)
      const response = await fetch(
        `https://mango-transaction-log.herokuapp.com/v3/stats/total-interest-earned?mango-account=${mangoAccountPk}`
      )
      const parsedResponse: InterestStats = await response.json()

      if (hideInterestDust) {
        Object.entries(parsedResponse).forEach((r) => {
          const tokens = groupConfig.tokens
          const token = tokens.find((t) => t.symbol === r[0])
          if (!token || !mangoGroup || !mangoCache) {
            return
          }
          const tokenIndex = mangoGroup.getTokenIndex(token.mintKey)
          const price = mangoGroup.getPrice(tokenIndex, mangoCache).toNumber()
          const interest =
            r[1].total_deposit_interest > 0
              ? r[1].total_deposit_interest
              : r[1].total_borrow_interest
          if (price * interest > 1) {
            hideDust.push(r)
          }
        })
        setLoadTotalStats(false)
        setInterestStats(hideDust)
      } else {
        const stats = Object.entries(parsedResponse)
        const filterMicroBalances = stats.filter(([symbol, stats]) => {
          const decimals = getTokenBySymbol(groupConfig, symbol).decimals
          const smallestValue = Math.pow(10, (decimals + 1) * -1)
          return (
            stats.total_borrow_interest > smallestValue ||
            stats.total_deposit_interest > smallestValue
          )
        })
        setLoadTotalStats(false)
        setInterestStats(filterMicroBalances)
      }
    }

    const fetchHourlyInterestStats = async () => {
      setLoadHourlyStats(true)
      const response = await fetch(
        `https://mango-transaction-log.herokuapp.com/v3/stats/hourly-interest-prices?mango-account=${mangoAccountPk}`
      )
      const parsedResponse = await response.json()
      let assets
      if (hideInterestDust) {
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
        const token = getTokenBySymbol(groupConfig, asset)

        stats[asset] = x
          .map(([key, value, price]) => {
            const borrows = roundToDecimal(
              value.borrow_interest,
              token.decimals + 1
            )
            const deposits = roundToDecimal(
              value.deposit_interest,
              token.decimals + 1
            )
            if (borrows > 0 || deposits > 0) {
              return { ...value, time: key, ...price }
            } else {
              return null
            }
          })
          .filter((x) => x)
          .reverse()
        if (stats[asset].length === 0) {
          delete stats[asset]
        }
      }
      setLoadHourlyStats(false)
      setHourlyInterestStats(stats)
    }

    const getStats = async () => {
      fetchInterestStats()
      fetchHourlyInterestStats()
    }
    getStats()
  }, [mangoAccountPk, hideInterestDust])

  useEffect(() => {
    if (hourlyInterestStats[selectedAsset]) {
      const start = new Date(
        // @ts-ignore
        dayjs().utc().hour(0).minute(0).subtract(29, 'day')
      ).getTime()

      const filtered = hourlyInterestStats[selectedAsset].filter(
        (d) => new Date(d.time).getTime() > start
      )

      const dailyInterest: any[] = []

      for (let i = 0; i < 30; i++) {
        dailyInterest.push({
          interest: 0,
          value: 0,
          time: new Date(
            // @ts-ignore
            dayjs().utc().hour(0).minute(0).subtract(i, 'day')
          ).getTime(),
        })
      }

      filtered.forEach((d) => {
        const found = dailyInterest.find(
          (x) =>
            dayjs(x.time).format('DD-MMM') === dayjs(d.time).format('DD-MMM')
        )
        if (found) {
          const newInterest =
            d.borrow_interest > 0 ? d.borrow_interest * -1 : d.deposit_interest
          const newValue =
            d.borrow_interest > 0
              ? d.borrow_interest * -1 * d.price
              : d.deposit_interest * d.price
          found.interest = found.interest + newInterest
          found.value = found.value + newValue
        }
      })
      setChartData(dailyInterest.reverse())
    }
  }, [hourlyInterestStats, selectedAsset])

  const increaseYAxisWidth = !!chartData.find((data) => data.value < 0.001)

  return (
    <>
      <div className="flex flex-col pb-4 sm:flex-row sm:items-center sm:space-x-3">
        <div className="flex w-full items-center justify-between pb-4 sm:pb-0">
          <h2>{t('interest-earned')}</h2>
          <Switch
            checked={hideInterestDust}
            className="ml-2 text-xs"
            onChange={() => sethideInterestDust(!hideInterestDust)}
          >
            {t('hide-dust')}
          </Switch>
        </div>
        <Button
          className={`h-8 pt-0 pb-0 pl-3 pr-3 text-xs`}
          onClick={exportInterestDataToCSV}
        >
          <div className={`flex items-center justify-center whitespace-nowrap`}>
            <SaveIcon className={`mr-1.5 h-4 w-4`} />
            {t('export-data')}
          </div>
        </Button>
      </div>
      {mangoAccount ? (
        <div>
          {loadTotalStats ? (
            <div className="space-y-2">
              <div className="h-12 w-full animate-pulse rounded-md bg-th-bkg-3" />
              <div className="h-12 w-full animate-pulse rounded-md bg-th-bkg-3" />
              <div className="h-12 w-full animate-pulse rounded-md bg-th-bkg-3" />
            </div>
          ) : !isMobile ? (
            <Table>
              <thead>
                <TrHead>
                  <Th>{t('token')}</Th>
                  <Th>{t('total-deposit-interest')}</Th>
                  <Th>{t('total-borrow-interest')}</Th>
                  <Th>{t('net')}</Th>
                </TrHead>
              </thead>
              <tbody>
                {interestStats.length === 0 ? (
                  <TrBody>
                    <td colSpan={4}>
                      <div className="flex rounded-md bg-th-bkg-3 text-th-fgd-3">
                        <div className="mx-auto py-4">{t('no-interest')}</div>
                      </div>
                    </td>
                  </TrBody>
                ) : (
                  interestStats.map(([symbol, stats]) => {
                    const decimals = getTokenBySymbol(
                      groupConfig,
                      symbol
                    ).decimals
                    return (
                      <TrBody key={symbol}>
                        <Td>
                          <div className="flex items-center">
                            <img
                              alt=""
                              width="20"
                              height="20"
                              src={`/assets/icons/${symbol.toLowerCase()}.svg`}
                              className={`mr-2.5`}
                            />

                            {symbol}
                          </div>
                        </Td>
                        <Td>
                          {stats.total_deposit_interest.toFixed(decimals)}{' '}
                          {symbol}
                        </Td>
                        <Td>
                          {stats.total_borrow_interest.toFixed(decimals)}{' '}
                          {symbol}
                        </Td>
                        <Td>
                          {(
                            stats.total_deposit_interest -
                            stats.total_borrow_interest
                          ).toFixed(decimals)}{' '}
                          {symbol}
                        </Td>
                      </TrBody>
                    )
                  })
                )}
              </tbody>
            </Table>
          ) : interestStats.length === 0 ? (
            <div className="flex rounded-md bg-th-bkg-3 text-th-fgd-3">
              <div className="mx-auto py-4">{t('no-interest')}</div>
            </div>
          ) : (
            <>
              <MobileTableHeader
                colOneHeader={t('token')}
                colTwoHeader={t('net')}
              />
              {interestStats.map(([symbol, stats], index) => {
                const decimals = getTokenBySymbol(groupConfig, symbol).decimals
                return (
                  <ExpandableRow
                    buttonTemplate={
                      <div className="text-fgd-1 flex w-full items-center justify-between">
                        <div className="text-fgd-1 flex items-center">
                          <img
                            alt=""
                            width="20"
                            height="20"
                            src={`/assets/icons/${symbol.toLowerCase()}.svg`}
                            className={`mr-2.5`}
                          />

                          {symbol}
                        </div>
                        <div className="text-fgd-1 text-right">
                          {(
                            stats.total_deposit_interest -
                            stats.total_borrow_interest
                          ).toFixed(decimals)}{' '}
                          {symbol}
                        </div>
                      </div>
                    }
                    key={`${symbol}${index}`}
                    panelTemplate={
                      <>
                        <div className="grid grid-flow-row grid-cols-2 gap-4">
                          <div className="text-left">
                            <div className="pb-0.5 text-xs text-th-fgd-3">
                              {t('total-deposit-interest')}
                            </div>
                            {stats.total_deposit_interest.toFixed(decimals)}{' '}
                            {symbol}
                          </div>
                          <div className="text-left">
                            <div className="pb-0.5 text-xs text-th-fgd-3">
                              {t('total-borrow-interest')}
                            </div>
                            {stats.total_borrow_interest.toFixed(decimals)}{' '}
                            {symbol}
                          </div>
                        </div>
                      </>
                    }
                  />
                )
              })}
            </>
          )}
          <>
            {!isEmpty(hourlyInterestStats) && !loadHourlyStats ? (
              <>
                <div className="flex w-full items-center justify-between pb-4 pt-8">
                  <h2>{t('history')}</h2>
                  <Select
                    value={selectedAsset}
                    onChange={(a) => setSelectedAsset(a)}
                    className="w-24 md:hidden"
                  >
                    <div className="space-y-2">
                      {Object.keys(hourlyInterestStats).map((token: string) => (
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
                  <div className="hidden pb-4 sm:pb-0 md:flex">
                    {Object.keys(hourlyInterestStats).map((token: string) => (
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
                        {token}
                      </div>
                    ))}
                  </div>
                </div>
                {selectedAsset && chartData.length > 0 ? (
                  <div className="flex w-full flex-col space-x-0 sm:flex-row sm:space-x-4">
                    {chartData.find((d) => d.interest !== 0) ? (
                      <div
                        className="relative mb-6 w-full rounded-md border border-th-bkg-4 p-4 sm:w-1/2"
                        style={{ height: '330px' }}
                      >
                        <Chart
                          hideRangeFilters
                          title={t('interest-chart-title', {
                            symbol: selectedAsset,
                          })}
                          xAxis="time"
                          yAxis="interest"
                          data={chartData}
                          labelFormat={(x) => {
                            return x === 0
                              ? 0
                              : token
                              ? x.toFixed(token.decimals + 1)
                              : null
                          }}
                          tickFormat={handleDustTicks}
                          titleValue={chartData.reduce(
                            (a, c) => a + c.interest,
                            0
                          )}
                          type="bar"
                          useMulticoloredBars
                          yAxisWidth={increaseYAxisWidth ? 70 : 50}
                          zeroLine
                        />
                      </div>
                    ) : null}
                    {chartData.find((d) => d.value !== 0) ? (
                      <div
                        className="relative mb-6 w-full rounded-md border border-th-bkg-4 p-4 sm:w-1/2"
                        style={{ height: '330px' }}
                      >
                        {token ? (
                          <Chart
                            hideRangeFilters
                            title={t('interest-chart-value-title', {
                              symbol: selectedAsset,
                            })}
                            xAxis="time"
                            yAxis="value"
                            data={chartData}
                            labelFormat={(x) =>
                              x === 0
                                ? 0
                                : x < 0
                                ? `-$${Math.abs(x)?.toFixed(
                                    token.decimals + 1
                                  )}`
                                : `$${x?.toFixed(token.decimals + 1)}`
                            }
                            tickFormat={handleUsdDustTicks}
                            titleValue={chartData.reduce(
                              (a, c) => a + c.value,
                              0
                            )}
                            type="bar"
                            useMulticoloredBars
                            yAxisWidth={increaseYAxisWidth ? 70 : 50}
                            zeroLine
                          />
                        ) : null}
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
                            <Th>{t('interest')}</Th>
                            <Th>{t('value')}</Th>
                          </TrHead>
                        </thead>
                        <tbody>
                          {paginatedData.map((stat) => {
                            // @ts-ignore
                            const utc = dayjs.utc(stat.time).format()
                            return (
                              <TrBody key={stat.time}>
                                <Td className="w-1/3">
                                  <TableDateDisplay date={utc} />
                                </Td>
                                {token ? (
                                  <Td className="w-1/3">
                                    {stat.borrow_interest > 0
                                      ? `-${stat.borrow_interest.toFixed(
                                          token.decimals + 1
                                        )}`
                                      : stat.deposit_interest.toFixed(
                                          token.decimals + 1
                                        )}{' '}
                                    {selectedAsset}
                                  </Td>
                                ) : null}
                                {token ? (
                                  <Td className="w-1/3">
                                    {stat.borrow_interest > 0
                                      ? `-$${(
                                          stat.borrow_interest * stat.price
                                        ).toFixed(token.decimals + 1)}`
                                      : `$${(
                                          stat.deposit_interest * stat.price
                                        ).toFixed(token.decimals + 1)}`}
                                  </Td>
                                ) : null}
                              </TrBody>
                            )
                          })}
                        </tbody>
                      </Table>
                    ) : (
                      <div className="flex w-full justify-center bg-th-bkg-3 py-4 text-th-fgd-3">
                        {t('no-interest')}
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

export default AccountInterest
