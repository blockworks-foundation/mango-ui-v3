import { useEffect, useState } from 'react'
import { IDS, MangoClient } from '@blockworks-foundation/mango-client'
import { PublicKey, Connection } from '@solana/web3.js'
import useConnection from './useConnection'
import { DEFAULT_MANGO_GROUP } from '../utils/mango'

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

  useEffect(() => {
    const fetchStats = async () => {
      const response = await fetch(
        `https://mango-stats.herokuapp.com?mangoGroup=BTC_ETH_SOL_SRM_USDC`
      )
      const stats = await response.json()
      setStats(stats)
    }
    fetchStats()
  }, [])

  useEffect(() => {
    const getLatestStats = async () => {
      const client = new MangoClient()
      const connection = new Connection(
        IDS.cluster_urls[cluster],
        'singleGossip'
      )
      const assets = IDS[cluster].mango_groups?.[DEFAULT_MANGO_GROUP]?.symbols
      const mangoGroupId =
        IDS[cluster].mango_groups?.[DEFAULT_MANGO_GROUP]?.mango_group_pk
      if (!mangoGroupId) return
      const mangoGroupPk = new PublicKey(mangoGroupId)
      const mangoGroup = await client.getMangoGroup(connection, mangoGroupPk)
      const latestStats = Object.keys(assets).map((symbol, index) => {
        const totalDeposits = mangoGroup.getUiTotalDeposit(index)
        const totalBorrows = mangoGroup.getUiTotalBorrow(index)

        return {
          time: new Date(),
          symbol,
          totalDeposits,
          totalBorrows,
          depositInterest: mangoGroup.getDepositRate(index) * 100,
          borrowInterest: mangoGroup.getBorrowRate(index) * 100,
          utilization: totalDeposits > 0.0 ? totalBorrows / totalDeposits : 0.0,
        }
      })
      setLatestStats(latestStats)
    }

    getLatestStats()
  }, [cluster])

  return { latestStats, stats }
}

export default useMangoStats
