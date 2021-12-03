import { getTokenBySymbol } from '@blockworks-foundation/mango-client'
import { useEffect, useMemo, useState } from 'react'
import useMangoStore from '../../stores/useMangoStore'
import Select from '../Select'
import { Table, Td, Th, TrBody, TrHead } from '../TableElements'
import { useTranslation } from 'next-i18next'
import { isEmpty } from 'lodash'
import usePagination from '../../hooks/usePagination'
import { roundToDecimal } from '../../utils/'
import Pagination from '../Pagination'
import { useViewport } from '../../hooks/useViewport'
import { breakpoints } from '../TradePageGrid'
import { ExpandableRow } from '../TableElements'
import MobileTableHeader from '../mobile/MobileTableHeader'
import { exportDataToCSV } from '../../utils/export'
import { SaveIcon } from '@heroicons/react/outline'
import Button from '../Button'

interface InterestStats {
  [key: string]: {
    total_borrow_interest: number
    total_deposit_interest: number
  }
}

const AccountInterest = () => {
  const { t } = useTranslation('common')
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const groupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const [interestStats, setInterestStats] = useState<any>([])
  const [hourlyInterestStats, setHourlyInterestStats] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<string>('')
  const {
    paginatedData,
    setData,
    totalPages,
    nextPage,
    previousPage,
    page,
    firstPage,
    lastPage,
  } = usePagination(hourlyInterestStats[selectedAsset])
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.md : false

  const mangoAccountPk = useMemo(() => {
    return mangoAccount.publicKey.toString()
  }, [mangoAccount])

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
          return {
            timestamp: interest.time,
            asset: asset,
            deposit_interest: interest.deposit_interest,
            borrow_interest: interest.borrow_interest,
          }
        }),
      ]
    }

    const title = 'Mango Markets - Interest History - ' + new Date().toString()
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
      setData(hourlyInterestStats[selectedAsset])
    }
  }, [selectedAsset, hourlyInterestStats])

  useEffect(() => {
    if (!selectedAsset && Object.keys(hourlyInterestStats).length > 0) {
      setSelectedAsset(Object.keys(hourlyInterestStats)[0])
    }
  }, [hourlyInterestStats])

  useEffect(() => {
    const fetchInterestStats = async () => {
      const response = await fetch(
        `https://mango-transaction-log.herokuapp.com/v3/stats/total-interest-earned?mango-account=${mangoAccountPk}`
      )
      const parsedResponse: InterestStats = await response.json()

      setInterestStats(Object.entries(parsedResponse))
    }

    const fetchHourlyInterestStats = async () => {
      setLoading(true)
      const response = await fetch(
        `https://mango-transaction-log.herokuapp.com/v3/stats/hourly-interest?mango-account=${mangoAccountPk}`
      )
      const parsedResponse = await response.json()
      const assets = Object.keys(parsedResponse)

      const stats = {}
      for (const asset of assets) {
        const x: any = Object.entries(parsedResponse[asset])
        const token = getTokenBySymbol(groupConfig, asset)

        stats[asset] = x
          .map(([key, value]) => {
            const borrows = roundToDecimal(
              value.borrow_interest,
              token.decimals + 1
            )
            const deposits = roundToDecimal(
              value.deposit_interest,
              token.decimals + 1
            )
            if (borrows > 0 || deposits > 0) {
              return { ...value, time: key }
            } else {
              return null
            }
          })
          .filter((x) => x)
          .reverse()
      }
      setLoading(false)
      setHourlyInterestStats(stats)
    }

    fetchHourlyInterestStats()
    fetchInterestStats()
  }, [mangoAccountPk])

  return (
    <>
      <div className="pb-4 text-th-fgd-1 text-lg">
        {t('interest-earned')}
        <Button
          className={`float-right text-xs h-8 pt-0 pb-0 pl-3 pr-3`}
          onClick={exportInterestDataToCSV}
        >
          <div className={`flex items-center`}>
            <SaveIcon className={`h-4 w-4 mr-1.5`} />
            {t('export-data')}
          </div>
        </Button>
      </div>{' '}
      {mangoAccount ? (
        <div>
          {!isMobile ? (
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
          <>
            {!isEmpty(hourlyInterestStats) && !loading ? (
              <>
                <div className="flex items-center justify-between pb-4 pt-6 w-full">
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
                <div>
                  <div>
                    {paginatedData.length ? (
                      <Table>
                        <thead>
                          <TrHead>
                            <Th>{t('time')}</Th>
                            <Th>{t('interest')}</Th>
                          </TrHead>
                        </thead>
                        <tbody>
                          {paginatedData.map((stat, index) => {
                            const date = new Date(stat.time)

                            return (
                              <TrBody index={index} key={stat.time}>
                                <Td>
                                  <div>{date.toLocaleDateString()}</div>
                                  <div className="text-xs text-th-fgd-3">
                                    {date.toLocaleTimeString()}
                                  </div>
                                </Td>
                                <Td>
                                  {stat.borrow_interest > 0
                                    ? `-${stat.borrow_interest.toFixed(
                                        token.decimals + 1
                                      )}`
                                    : stat.deposit_interest.toFixed(
                                        token.decimals + 1
                                      )}{' '}
                                  {selectedAsset}
                                </Td>
                              </TrBody>
                            )
                          })}
                        </tbody>
                      </Table>
                    ) : (
                      <div className="flex justify-center w-full bg-th-bkg-3 py-4">
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
