import { useEffect, useState } from 'react'
import useMangoStore from '../stores/useMangoStore'
import useConnection from './useConnection'
import useMarket from './useMarket'
import useMarketList from './useMarketList'

export default function useOraclePrice() {
  const selectedMangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const { connection } = useConnection()
  const { marketAddress } = useMarket()
  const { getMarketIndex } = useMarketList()
  const [oraclePrice, setOraclePrice] = useState(null)

  useEffect(() => {
    if (selectedMangoGroup) {
      const marketIndex = getMarketIndex(marketAddress)
      selectedMangoGroup.getPrices(connection).then((prices) => {
        const oraclePriceForMarket = prices[marketIndex]
        setOraclePrice(oraclePriceForMarket)
        console.log('yoooo', marketAddress, marketIndex, oraclePriceForMarket)
      })
    }
  }, [selectedMangoGroup, marketAddress])
  console.log('oracle prices', oraclePrice)

  return oraclePrice
}
