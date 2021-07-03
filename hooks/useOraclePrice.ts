import { useCallback, useEffect, useState } from 'react'
import useMangoStore from '../stores/useMangoStore'
import useConnection from './useConnection'
import useInterval from './useInterval'
import useMarket from './useMarket'
import useMarketList from './useMarketList'
import { nativeToUi } from '@blockworks-foundation/mango-client'

const SECONDS = 1000

export default function useOraclePrice() {
  const selectedMangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const { connection } = useConnection()
  const { marketAddress, marketName } = useMarket()
  const { getMarketIndex } = useMarketList()
  const [oraclePrice, setOraclePrice] = useState(null)

  const fetchOraclePrice = useCallback(() => {
    if (selectedMangoGroup) {
      setOraclePrice(null)
      const marketIndex = getMarketIndex(marketAddress)
      selectedMangoGroup.loadCache(connection).then((cache) => {
        console.log(marketName)
        console.log(cache.priceCache, marketIndex)
        const oraclePriceForMarket = nativeToUi(
          cache.priceCache[marketIndex].price.toNumber(),
          3
        )
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
