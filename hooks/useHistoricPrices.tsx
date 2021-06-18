import { useEffect, useState } from 'react'

const useHistoricPrices = () => {
  const [prices, setPrices] = useState<any>(null)

  useEffect(() => {
    const fetchPrices = async () => {
      const response = await fetch(
        `https://mango-transaction-log.herokuapp.com/stats/prices/2oogpTYm1sp6LPZAWD3bp2wsFpnV2kXL1s52yyFhW5vp`
      )
      const prices = await response.json()
      setPrices(prices)
    }
    fetchPrices()
  }, [])

  return { prices }
}

export default useHistoricPrices
