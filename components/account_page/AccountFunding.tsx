import { useEffect, useMemo, useState } from 'react'
import useMangoStore from '../../stores/useMangoStore'
import { Table, Td, Th, TrBody, TrHead } from '../TableElements'

interface fundingStats {
  [key: string]: {
    total_borrow_interest: number
    total_deposit_interest: number
  }
}

const AccountFunding = () => {
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const [fundingStats, setFundingStats] = useState<any>([])
  const mangoAccountPk = useMemo(() => {
    return mangoAccount.publicKey.toString()
  }, [mangoAccount])
  console.log('fundingStats', fundingStats)

  useEffect(() => {
    const fetchFundingStats = async () => {
      const response = await fetch(
        `https://mango-transaction-log.herokuapp.com/v3/stats/total-funding?mango-account=${mangoAccountPk}`
      )
      const parsedResponse: fundingStats = await response.json()

      setFundingStats(Object.entries(parsedResponse))
    }

    fetchFundingStats()
  }, [mangoAccountPk])

  return (
    <>
      <div className="pb-3.5 text-th-fgd-1 text-base">
        Total Funding Earned/Paid
      </div>
      {mangoAccount ? (
        <Table>
          <thead>
            <TrHead>
              <Th>Token</Th>
              <Th>Total Funding</Th>
            </TrHead>
          </thead>
          <tbody>
            {fundingStats.length === 0 ? (
              <TrBody index={0}>
                <td colSpan={4}>
                  <div className="flex">
                    <div className="mx-auto py-4">No funding earned/paid</div>
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
      ) : (
        <div>Connect wallet</div>
      )}
    </>
  )
}

export default AccountFunding
