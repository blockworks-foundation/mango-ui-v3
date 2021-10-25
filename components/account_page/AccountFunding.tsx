import { useEffect, useMemo, useState } from 'react'
import useMangoStore from '../../stores/useMangoStore'
import { Table, Td, Th, TrBody, TrHead } from '../TableElements'
import { isEmpty } from 'lodash'
import { useTranslation } from 'next-i18next'
import Select from '../Select'
import Loading from '../Loading'
import Pagination from '../Pagination'
import usePagination from '../../hooks/usePagination'
import { roundToDecimal } from '../../utils'

const QUOTE_DECIMALS = 6

const AccountFunding = () => {
  const { t } = useTranslation('common')
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const [fundingStats, setFundingStats] = useState<any>([])
  const [hourlyFunding, setHourlyFunding] = useState<any>([])
  const [selectedAsset, setSelectedAsset] = useState<string>('BTC')
  const [loading, setLoading] = useState(false)
  const {
    paginated,
    setData,
    totalPages,
    nextPage,
    previousPage,
    page,
    firstPage,
    lastPage,
  } = usePagination(hourlyFunding[selectedAsset])

  const mangoAccountPk = useMemo(() => {
    return mangoAccount.publicKey.toString()
  }, [mangoAccount])

  useEffect(() => {
    if (!isEmpty(hourlyFunding)) {
      setData(hourlyFunding[selectedAsset])
    }
  }, [selectedAsset, hourlyFunding])

  useEffect(() => {
    const fetchFundingStats = async () => {
      const response = await fetch(
        `https://mango-transaction-log.herokuapp.com/v3/stats/total-funding?mango-account=${mangoAccountPk}`
      )
      const parsedResponse = await response.json()

      setFundingStats(Object.entries(parsedResponse))
    }

    const fetchHourlyFundingStats = async () => {
      setLoading(true)
      const response = await fetch(
        `https://mango-transaction-log.herokuapp.com/v3/stats/hourly-funding?mango-account=${mangoAccountPk}`
      )
      const parsedResponse = await response.json()
      const assets = Object.keys(parsedResponse)

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
      console.log('stats', stats)

      setLoading(false)
      setHourlyFunding(stats)
    }

    fetchFundingStats()
    fetchHourlyFundingStats()
  }, [mangoAccountPk])

  return (
    <>
      <div className="pb-3.5 text-th-fgd-1 text-base">
        {t('total-funding-stats')}
      </div>
      {mangoAccount ? (
        <div>
          <Table>
            <thead>
              <TrHead>
                <Th>{t('token')}</Th>
                <Th>{t('total-funding')}</Th>
              </TrHead>
            </thead>
            <tbody>
              {fundingStats.length === 0 ? (
                <TrBody index={0}>
                  <td colSpan={4}>
                    <div className="flex">
                      <div className="mx-auto py-4">{t('no-funding')}</div>
                    </div>
                  </td>
                </TrBody>
              ) : (
                fundingStats.map(([symbol, stats], index) => {
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
                          {symbol}-PERP
                        </div>
                      </Td>
                      <Td>
                        <div
                          className={`${
                            stats.total_funding >= 0
                              ? 'text-th-green'
                              : 'text-th-red'
                          }`}
                        >
                          ${stats.total_funding.toFixed(6)}
                        </div>
                      </Td>
                    </TrBody>
                  )
                })
              )}
            </tbody>
          </Table>

          <>
            {!isEmpty(hourlyFunding) && !loading ? (
              <>
                <div className="flex items-center justify-between my-4 w-full">
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
                <div>
                  <div>
                    {paginated.length ? (
                      <Table>
                        <thead>
                          <TrHead>
                            <Th>{t('time')}</Th>
                            <Th>{t('funding')}</Th>
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
                      <div className="flex justify-center w-full bg-th-bkg-3 py-4">
                        No funding earned/paid
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

export default AccountFunding
