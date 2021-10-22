import { useEffect, useMemo, useState } from 'react'
import useMangoStore from '../../stores/useMangoStore'
// import Chart from '../Chart'
// import Loading from '../Loading'
// import Select from '../Select'
import { Table, Td, Th, TrBody, TrHead } from '../TableElements'
// import { isEmpty } from 'lodash'
import { useTranslation } from 'next-i18next'

const AccountFunding = () => {
  const { t } = useTranslation('common')
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const [fundingStats, setFundingStats] = useState<any>([])
  // const [hourlyFunding, setHourlyFunding] = useState<any>(null)
  // const [selectedAsset, setSelectedAsset] = useState<string>('BTC')
  // const [loading, setLoading] = useState(false)

  const mangoAccountPk = useMemo(() => {
    return mangoAccount.publicKey.toString()
  }, [mangoAccount])

  useEffect(() => {
    const fetchFundingStats = async () => {
      const response = await fetch(
        `https://mango-transaction-log.herokuapp.com/v3/stats/total-funding?mango-account=${mangoAccountPk}`
      )
      const parsedResponse = await response.json()

      setFundingStats(Object.entries(parsedResponse))
    }

    // const fetchHourlyFundingStats = async () => {
    //   setLoading(true)
    //   const response = await fetch(
    //     `https://mango-transaction-log.herokuapp.com/v3/stats/hourly-funding?mango-account=${mangoAccountPk}`
    //   )
    //   const parsedResponse = await response.json()

    //   const assets = Object.keys(parsedResponse)

    //   const stats = {}
    //   for (const asset of assets) {
    //     const x = Object.entries(parsedResponse[asset])
    //     stats[asset] = x.map(([key, value]) => {
    //       // @ts-ignore
    //       return { ...value, time: key }
    //     })
    //   }
    //   setLoading(false)
    //   setHourlyFunding(stats)
    // }

    fetchFundingStats()
    // fetchHourlyFundingStats()
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

          {/* <>
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
                        {token}
                      </div>
                    ))}
                  </div>
                </div>
                {hourlyFunding[selectedAsset].length ? (
                  <div
                    className="border border-th-bkg-4 relative md:mb-0 p-4 rounded-md"
                    style={{ height: '330px' }}
                  >
                    <Chart
                      title={t('hourly-funding')}
                      xAxis="time"
                      yAxis="total_funding"
                      data={hourlyFunding[selectedAsset]}
                      labelFormat={(x) => x.toFixed(6)}
                      type="area"
                    />
                  </div>
                ) : null}
              </>
            ) : loading ? (
              <div className="flex justify-center my-8">
                <div>
                  <Loading />
                </div>
              </div>
            ) : null}
          </> */}
        </div>
      ) : (
        <div>{t('connect-wallet')}</div>
      )}
    </>
  )
}

export default AccountFunding
