import { useEffect, useRef } from 'react'
import useConnection from './useConnection'
import useMarket from './useMarket'
import useMarginAccount from './useMarginAcccount'

export function useOpenOrders() {
  const { market } = useMarket()
  const { marginAccount, mangoGroup } = useMarginAccount()
  const { bidOrderbook, askOrderbook } = useOrderbookAccounts()
  const { cluster } = useConnection()

  if (!market || !mangoGroup || !marginAccount) return null

  const marketIndex = mangoGroup.getMarketIndex(market)
  const openOrdersAccount = marginAccount.openOrdersAccounts[marketIndex]

  if (!openOrdersAccount || !bidOrderbook || !askOrderbook) {
    return null
  }

  const spotMarketFromIDs = Object.entries(IDS[cluster].spot_markets).find(
    ([symbol, address]) => {
      return market.address.toString() === address
    }
  )

  const marketName = spotMarketFromIDs ? spotMarketFromIDs[0] : ''

  return market
    .filterForOpenOrders(bidOrderbook, askOrderbook, [openOrdersAccount])
    .map((order) => ({ ...order, marketName, market }))
}
