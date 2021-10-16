import { getTokenBySymbol } from '@blockworks-foundation/mango-client'
import { useEffect, useState } from 'react'
import useMangoStore from '../../stores/useMangoStore'
import { Table, Td, Th, TrBody, TrHead } from '../TableElements'

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

  useEffect(() => {
    const fetchInterestStats = async () => {
      const response = await fetch(
        `https://mango-transaction-log.herokuapp.com/v3/stats/total-interest-earned?mango-account=${mangoAccount.publicKey}`
      )
      const parsedResponse: InterestStats = await response.json()

      setInterestStats(Object.entries(parsedResponse))
    }

    fetchInterestStats()
  }, [mangoAccount])

  return (
    <>
      <div className="pb-3.5 text-th-fgd-1 text-base">
        Total Interest Earned/Paid
      </div>
      {mangoAccount ? (
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
                const decimals = getTokenBySymbol(groupConfig, symbol).decimals
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
                      {stats.total_deposit_interest.toFixed(decimals)} {symbol}
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
      ) : (
        <div>Connect wallet</div>
      )}
    </>
  )
}

export default AccountInterest
