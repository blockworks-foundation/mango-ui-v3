import { useCallback, useEffect, useState } from 'react'
import useMangoStore from '../stores/useMangoStore'
import useConnection from './useConnection'
import useInterval from './useInterval'
import useMarket from './useMarket'
import useMarketList from './useMarketList'

const SECONDS = 1000

export default function useOraclePrice() {
  const selectedMangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const { connection } = useConnection()
  const { marketAddress } = useMarket()
  const { getMarketIndex } = useMarketList()
  const [oraclePrice, setOraclePrice] = useState(null)

  const fetchOraclePrice = useCallback(() => {
    if (selectedMangoGroup) {
      const marketIndex = getMarketIndex(marketAddress)
      selectedMangoGroup.getPrices(connection).then((prices) => {
        const oraclePriceForMarket = prices[marketIndex]
        setOraclePrice(oraclePriceForMarket)
      })
    }
  }, [selectedMangoGroup, marketAddress])

  useEffect(() => {
    fetchOraclePrice()
  }, [fetchOraclePrice])

  useInterval(() => {
    fetchOraclePrice()
  }, 20 * SECONDS)

  return oraclePrice
}
