import { useEffect, useState } from 'react'
import { I80F48 } from '@blockworks-foundation/mango-client'
import useConnection from './useConnection'
import useMangoStore from '../stores/useMangoStore'
import useMangoGroupConfig from './useMangoGroupConfig'

const useMangoStats = () => {
  const [stats, setStats] = useState([
    {
      symbol: '',
      hourly: '',
      depositInterest: 0,
      borrowInterest: 0,
      totalDeposits: 0,
      totalBorrows: 0,
      utilization: '0',
    },
  ])
  const [latestStats, setLatestStats] = useState<any[]>([])
  const { cluster } = useConnection()
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoGroupName = useMangoStore((s) => s.selectedMangoGroup.name)
  const connection = useMangoStore((s) => s.connection.current);
  const config = useMangoGroupConfig();

  useEffect(() => {
    const fetchStats = async () => {
      const response = await fetch(
        `http://localhost:8000/v3?mangoGroup=${mangoGroupName}`
      )
      const stats = await response.json()
      setStats(stats)
    }
    fetchStats()
  }, [])

  useEffect(() => {
    const getLatestStats = async () => {
      if (mangoGroup) {
        const rootBanks = await mangoGroup.loadRootBanks(connection);
        const latestStats = config.tokens.map((token) => {
          const rootBank = rootBanks.find((bank) => {
            if (!bank) {
              return false;
          
            }
            return bank.publicKey.toBase58() == token.rootKey.toBase58();
          })
          const totalDeposits = rootBank.getUiTotalDeposit(mangoGroup);
          const totalBorrows = rootBank.getUiTotalBorrow(mangoGroup);

          return {
            time: new Date(),
            symbol: token.symbol,
            totalDeposits: totalDeposits,
            totalBorrows: totalBorrows,
            depositInterest: rootBank.getDepositRate(mangoGroup).mul(I80F48.fromNumber(100)),
            borrowInterest: rootBank.getBorrowRate(mangoGroup).mul(I80F48.fromNumber(100)),
            utilization: totalDeposits > I80F48.fromNumber(0) ? totalBorrows.div(totalDeposits) : I80F48.fromNumber(0),
          }
        });
        setLatestStats(latestStats)
      }      
    }

    getLatestStats()
  }, [cluster])

  return { latestStats, stats }
}

export default useMangoStats
