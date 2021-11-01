import { getTokenBySymbol } from '@blockworks-foundation/mango-client'
import { useEffect, useMemo, useState } from 'react'
import useMangoStore from '../../stores/useMangoStore'
import Loading from '../Loading'
import Select from '../Select'
import { Table, Td, Th, TrBody, TrHead } from '../TableElements'
import { useTranslation } from 'next-i18next'
import { isEmpty } from 'lodash'
import usePagination from '../../hooks/usePagination'
import { roundToDecimal } from '../../utils/'
import Pagination from '../Pagination'

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
  const [hourlyInterestStats, setHourlyInterestStats] = useState<any>({
    USDC: [],
  })
  const [loading, setLoading] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<string>('USDC')
  const {
    paginated,
    setData,
    totalPages,
    nextPage,
    previousPage,
    page,
    firstPage,
    lastPage,
  } = usePagination(hourlyInterestStats[selectedAsset])

  const mangoAccountPk = useMemo(() => {
    return mangoAccount.publicKey.toString()
  }, [mangoAccount])

  const token = useMemo(() => {
    return getTokenBySymbol(groupConfig, selectedAsset)
  }, [selectedAsset])

  useEffect(() => {
    if (!isEmpty(hourlyInterestStats)) {
      setData(hourlyInterestStats[selectedAsset])
    }
  }, [selectedAsset, hourlyInterestStats])

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
      <div className="pb-3.5 text-th-fgd-1 text-base">
        {t('interest-earned')}
      </div>
      {mangoAccount ? (
        <div>
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
                    <div className="flex">
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
                        {stats.total_borrow_interest.toFixed(decimals)} {symbol}
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
          <>
            {!isEmpty(hourlyInterestStats) && !loading ? (
              <>
                <div className="flex items-center justify-between my-4 w-full">
                  <Select
                    value={selectedAsset}
                    onChange={(a) => setSelectedAsset(a)}
                    className="w-24 sm:hidden"
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
                  <div className="hidden sm:flex pb-4 sm:pb-0">
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
                    {paginated.length ? (
                      <Table>
                        <thead>
                          <TrHead>
                            <Th>{t('time')}</Th>
                            <Th>{t('interest')}</Th>
                          </TrHead>
                        </thead>
                        <tbody>
                          {paginated.map((stat, index) => {
                            const date = new Date(stat.time)

                            return (
                              <TrBody index={index} key={stat.time}>
                                <Td>
                                  {date.toLocaleDateString()}{' '}
                                  {date.toLocaleTimeString()}
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
                        No interest earned/paid
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
              <div className="flex justify-center my-8">
                <div>
                  <Loading />
                </div>
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
