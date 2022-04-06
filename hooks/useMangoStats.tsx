import { useEffect, useState } from 'react'
import { I80F48 } from '@blockworks-foundation/mango-client'
import useMangoStore from '../stores/useMangoStore'
import { tokenPrecision } from '../utils'

const useMangoStats = () => {
  const [stats, setStats] = useState([
    {
      name: '',
      hourly: '',
      depositInterest: 0,
      borrowInterest: 0,
      totalDeposits: 0,
      totalBorrows: 0,
      baseOraclePrice: 0,
      utilization: '0',
    },
  ])
  const [perpStats, setPerpStats] = useState([
    {
      name: '',
      hourly: '',
      oldestLongFunding: 0,
      oldestShortFunding: 0,
      latestLongFunding: 0,
      latestShortFunding: 0,
      openInterest: 0,
      baseOraclePrice: 0,
    },
  ])
  const [latestStats, setLatestStats] = useState<any[]>([])
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoGroupName = useMangoStore((s) => s.selectedMangoGroup.name)
  const connection = useMangoStore((s) => s.connection.current)
  const config = useMangoStore((s) => s.selectedMangoGroup.config)

  useEffect(() => {
    const fetchHistoricalStats = async () => {
      const response = await fetch(
        `https://mango-transaction-log.herokuapp.com/v3/stats/spot_stats_hourly?mango-group=${mangoGroupName}`
      )
      const stats = await response.json()
      setStats(stats)
    }
    fetchHistoricalStats()
  }, [mangoGroupName])

  useEffect(() => {
    const fetchHistoricalPerpStats = async () => {
      const response = await fetch(
        `https://mango-transaction-log.herokuapp.com/v3/stats/perp_stats_hourly?mango-group=${mangoGroupName}`
      )
      const stats = await response.json()
      setPerpStats(stats)
    }
    fetchHistoricalPerpStats()
  }, [mangoGroupName])

  useEffect(() => {
    const getLatestStats = async () => {
      if (mangoGroup) {
        const rootBanks = await mangoGroup.loadRootBanks(connection)
        if (!config) return
        const latestStats = config.tokens.map((token) => {
          const rootBank = rootBanks.find((bank) => {
            if (!bank) {
              return false
            }
            return bank.publicKey.toBase58() == token.rootKey.toBase58()
          })
          if (!rootBank) {
            return
          }
          const totalDeposits = rootBank.getUiTotalDeposit(mangoGroup)
          const totalBorrows = rootBank.getUiTotalBorrow(mangoGroup)

          return {
            time: new Date(),
            name: token.symbol,
            totalDeposits: totalDeposits.toFixed(
              tokenPrecision[token.symbol] || 2
            ),
            totalBorrows: totalBorrows.toFixed(
              tokenPrecision[token.symbol] || 2
            ),
            depositInterest: rootBank
              .getDepositRate(mangoGroup)
              .mul(I80F48.fromNumber(100)),
            borrowInterest: rootBank
              .getBorrowRate(mangoGroup)
              .mul(I80F48.fromNumber(100)),
            utilization: totalDeposits.gt(I80F48.fromNumber(0))
              ? totalBorrows.div(totalDeposits)
              : I80F48.fromNumber(0),
          }
        })
        setLatestStats(latestStats)
      }
    }

    getLatestStats()
  }, [mangoGroup])

  return { latestStats, stats, perpStats }
}

export default useMangoStats
