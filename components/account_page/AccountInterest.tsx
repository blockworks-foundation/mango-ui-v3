import { getTokenBySymbol } from '@blockworks-foundation/mango-client'
import { useEffect, useMemo, useState } from 'react'
import useMangoStore from '../../stores/useMangoStore'
import Chart from '../Chart'
import Loading from '../Loading'
import Select from '../Select'
import { Table, Td, Th, TrBody, TrHead } from '../TableElements'
import { isEmpty } from 'lodash'

interface InterestStats {
  [key: string]: {
    total_borrow_interest: number
    total_deposit_interest: number
  }
}

const AccountInterest = () => {
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const groupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const [interestStats, setInterestStats] = useState<any>([])
  const [hourlyInterestStats, setHourlyInterestStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<string>('USDC')

  const mangoAccountPk = useMemo(() => {
    return mangoAccount.publicKey.toString()
  }, [mangoAccount])

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
        const x = Object.entries(parsedResponse[asset])
        stats[asset] = x.map(([key, value]) => {
          // @ts-ignore
          return { ...value, time: key }
        })
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
        Total Interest Earned/Paid
      </div>
      {mangoAccount ? (
        <div>
          <Table>
            <thead>
              <TrHead>
                <Th>Token</Th>
                <Th>Total Deposit Interest</Th>
                <Th>Total Borrow Interest</Th>
                <Th>Net</Th>
              </TrHead>
            </thead>
            <tbody>
              {interestStats.length === 0 ? (
                <TrBody index={0}>
                  <td colSpan={4}>
                    <div className="flex">
                      <div className="mx-auto py-4">No interest earned</div>
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

                <div className="grid grid-flow-col grid-cols-1 grid-rows-4 gap-2 sm:gap-4">
                  <div
                    className="border border-th-bkg-4 relative md:mb-0 p-4 rounded-md"
                    style={{ height: '330px' }}
                  >
                    <Chart
                      title="Hourly Deposit Interest"
                      xAxis="time"
                      yAxis="deposit_interest"
                      data={hourlyInterestStats[selectedAsset]}
                      labelFormat={(x) => x.toFixed(6)}
                      type="area"
                    />
                  </div>
                  <div
                    className="border border-th-bkg-4 relative p-4 rounded-md"
                    style={{ height: '330px' }}
                  >
                    <Chart
                      title="Hourly Borrow Interest"
                      xAxis="time"
                      yAxis="borrow_interest"
                      data={hourlyInterestStats[selectedAsset]}
                      labelFormat={(x) => x.toFixed(6)}
                      type="area"
                    />
                  </div>
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
        <div>Connect wallet</div>
      )}
    </>
  )
}

export default AccountInterest
