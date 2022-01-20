import { getTokenBySymbol } from '@blockworks-foundation/mango-client'
import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
// import { CurrencyDollarIcon } from '@heroicons/react/outline'
import useMangoStore from '../../stores/useMangoStore'
import Select from '../Select'
import { Table, Td, Th, TrBody, TrHead } from '../TableElements'
import { useTranslation } from 'next-i18next'
import { isEmpty } from 'lodash'
import usePagination from '../../hooks/usePagination'
import {
  // formatUsdValue,
  numberCompactFormatter,
  roundToDecimal,
} from '../../utils/'
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
  v < 0.000001
    ? v === 0
      ? 0
      : v.toExponential()
    : numberCompactFormatter.format(v)

const handleUsdDustTicks = (v) =>
  v < 0.000001
    ? v === 0
      ? '$0'
      : `$${v.toExponential()}`
    : `$${numberCompactFormatter.format(v)}`

const AccountInterest = () => {
  const { t } = useTranslation('common')
  const connected = useMangoStore((s) => s.wallet.connected)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const groupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const [interestStats, setInterestStats] = useState<any>([])
  const [hourlyInterestStats, setHourlyInterestStats] = useState<any>({})
  // const [totalInterestValue, setTotalInterestValue] = useState(null)
  const [loadHourlyStats, setLoadHourlyStats] = useState(false)
  const [loadTotalStats, setLoadTotalStats] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<string>('')
  const [chartData, setChartData] = useState([])
  const [showHours, setShowHours] = useState(false)
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
    if (connected) {
      return mangoAccount.publicKey.toString()
    }
  }, [connected, mangoAccount])

  const token = useMemo(() => {
    if (selectedAsset) {
      return getTokenBySymbol(groupConfig, selectedAsset)
    }
  }, [selectedAsset])

  const exportInterestDataToCSV = () => {
    const assets = Object.keys(hourlyInterestStats)
    let dataToExport = []

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
      mangoAccount.name || mangoAccount.publicKey
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
    const hideDust = []
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
      await fetchInterestStats()
      fetchHourlyInterestStats()
    }
    getStats()
  }, [mangoAccountPk, hideInterestDust])

  // For net interest value to be useful we would need to filter on the dates of the user's financial year and convert the USD value below to the user's home currency.

  // useEffect(() => {
  //   console.log(Object.entries(hourlyInterestStats).flat(Infinity))
  //   const totalInterestValue = Object.entries(hourlyInterestStats)
  //     .flat(Infinity)
  //     .reduce((a: number, c: any) => {
  //       if (c.time) {
  //         return (
  //           a + (c.deposit_interest * c.price - c.borrow_interest * c.price)
  //         )
  //       } else return a
  //     }, 0)
  //   setTotalInterestValue(totalInterestValue)
  // }, [hourlyInterestStats])

  useEffect(() => {
    if (hourlyInterestStats[selectedAsset]) {
      const start = new Date(
        // @ts-ignore
        dayjs().utc().hour(0).minute(0).subtract(29, 'day')
      ).getTime()

      const filtered = hourlyInterestStats[selectedAsset].filter(
        (d) => new Date(d.time).getTime() > start
      )

      const dailyInterest = []

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
        } else {
          dailyInterest.push({
            // @ts-ignore
            time: new Date(d.time).getTime(),
            interest:
              d.borrow_interest > 0
                ? d.borrow_interest * -1
                : d.deposit_interest,
            value:
              d.borrow_interest > 0
                ? d.borrow_interest * d.price * -1
                : d.deposit_interest * d.price,
          })
        }
      })

      if (dailyInterest.length === 1) {
        const chartInterest = []
        filtered.forEach((a) => {
          chartInterest.push({
            time: new Date(a.time).getTime(),
            interest:
              a.borrow_interest > 0
                ? a.borrow_interest * -1
                : a.deposit_interest,
            value:
              a.borrow_interest > 0
                ? a.borrow_interest * a.price * -1
                : a.deposit_interest * a.price,
          })
        })
        setShowHours(true)
        setChartData(chartInterest.reverse())
      } else {
        setShowHours(false)
        setChartData(dailyInterest.reverse())
      }
    }
  }, [hourlyInterestStats, selectedAsset])

  const increaseYAxisWidth = !!chartData.find((data) => data.value < 0.001)

  return (
    <>
      <div className="flex items-center justify-between pb-4">
        <div className="text-th-fgd-1 text-lg">{t('interest-earned')}</div>
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
          <Switch
            checked={hideInterestDust}
            className="ml-2 text-xs"
            onChange={() => sethideInterestDust(!hideInterestDust)}
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
                  <TrBody index={0}>
                    <td colSpan={4}>
                      <div className="bg-th-bkg-3 flex rounded-md text-th-fgd-3">
                        <div className="mx-auto py-4">{t('no-interest')}</div>
                      </div>
                    </td>
                  </TrBody>
                ) : (
                  interestStats.map(([symbol, stats], index) => {
                    const decimals = getTokenBySymbol(
                      groupConfig,
                      symbol
                    ).decimals
                    return (
                      <TrBody index={index} key={symbol}>
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
            <div className="bg-th-bkg-3 flex rounded-md text-th-fgd-3">
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
                      <div className="flex items-center justify-between text-fgd-1 w-full">
                        <div className="flex items-center text-fgd-1">
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
                    index={index}
                    panelTemplate={
                      <>
                        <div className="grid grid-cols-2 grid-flow-row gap-4">
                          <div className="text-left">
                            <div className="pb-0.5 text-th-fgd-3 text-xs">
                              {t('total-deposit-interest')}
                            </div>
                            {stats.total_deposit_interest.toFixed(decimals)}{' '}
                            {symbol}
                          </div>
                          <div className="text-left">
                            <div className="pb-0.5 text-th-fgd-3 text-xs">
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
          {/* {totalInterestValue > 0 ? (
            <div className="border border-th-bkg-4 mt-8 p-3 sm:p-4 rounded-md sm:rounded-lg">
              <div className="font-bold pb-0.5 text-th-fgd-1 text-xs sm:text-sm">
                {t('net-interest-value')}
              </div>
              <div className="pb-0.5 sm:pb-2 text-th-fgd-3 text-xs">
                {t('net-interest-value-desc')}
              </div>
              <div className="flex items-center">
                <CurrencyDollarIcon className="flex-shrink-0 h-5 w-5 sm:h-7 sm:w-7 mr-1.5 text-th-primary" />
                <div className="font-bold text-th-fgd-1 text-xl sm:text-2xl">
                  {formatUsdValue(totalInterestValue)}
                </div>
              </div>
            </div>
          ) : null} */}
          <>
            {!isEmpty(hourlyInterestStats) && !loadHourlyStats ? (
              <>
                <div className="flex items-center justify-between pb-4 pt-8 w-full">
                  <div className="text-th-fgd-1 text-lg">{t('history')}</div>
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
                          className={`bg-th-bkg-1 relative rounded-md w-full px-3 py-3 cursor-pointer default-transition flex hover:bg-th-bkg-3 focus:outline-none`}
                        >
                          <div className="flex items-center justify-between w-full">
                            {token}
                          </div>
                        </Select.Option>
                      ))}
                    </div>
                  </Select>
                  <div className="hidden md:flex pb-4 sm:pb-0">
                    {Object.keys(hourlyInterestStats).map((token: string) => (
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
                        {token}
                      </div>
                    ))}
                  </div>
                </div>
                {selectedAsset && chartData.length > 0 ? (
                  <div className="flex flex-col sm:flex-row space-x-0 sm:space-x-4 w-full">
                    <div
                      className="border border-th-bkg-4 relative mb-6 p-4 rounded-md w-full sm:w-1/2"
                      style={{ height: '330px' }}
                    >
                      <Chart
                        daysRange={showHours ? 1 : 30}
                        hideRangeFilters
                        title={t('interest-chart-title', {
                          symbol: selectedAsset,
                        })}
                        xAxis="time"
                        yAxis="interest"
                        data={chartData}
                        labelFormat={(x) => x && x?.toFixed(token.decimals + 1)}
                        tickFormat={handleDustTicks}
                        type="bar"
                        yAxisWidth={increaseYAxisWidth ? 70 : 50}
                      />
                    </div>
                    <div
                      className="border border-th-bkg-4 relative mb-6 p-4 rounded-md w-full sm:w-1/2"
                      style={{ height: '330px' }}
                    >
                      <Chart
                        hideRangeFilters
                        title={t('interest-chart-value-title', {
                          symbol: selectedAsset,
                        })}
                        xAxis="time"
                        yAxis="value"
                        data={chartData}
                        labelFormat={(x) =>
                          x && x < 0
                            ? `-$${Math.abs(x)?.toFixed(token.decimals + 1)}`
                            : `$${x?.toFixed(token.decimals + 1)}`
                        }
                        tickFormat={handleUsdDustTicks}
                        type="bar"
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
                            <Th>{t('interest')}</Th>
                            <Th>{t('value')}</Th>
                          </TrHead>
                        </thead>
                        <tbody>
                          {paginatedData.map((stat, index) => {
                            // @ts-ignore
                            const utc = dayjs.utc(stat.time).format()
                            return (
                              <TrBody index={index} key={stat.time}>
                                <Td className="w-1/3">
                                  {dayjs(utc).format('DD/MM/YY, h:mma')}
                                </Td>
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
                                <Td className="w-1/3">
                                  {stat.borrow_interest > 0
                                    ? `-$${(
                                        stat.borrow_interest * stat.price
                                      ).toFixed(token.decimals + 1)}`
                                    : `$${(
                                        stat.deposit_interest * stat.price
                                      ).toFixed(token.decimals + 1)}`}
                                </Td>
                              </TrBody>
                            )
                          })}
                        </tbody>
                      </Table>
                    ) : (
                      <div className="flex justify-center w-full bg-th-bkg-3 py-4 text-th-fgd-3">
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
