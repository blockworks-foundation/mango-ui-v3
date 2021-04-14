// import { useEffect, useRef } from 'react'
import { Orderbook } from '@project-serum/serum'
import useMangoStore from '../stores/useMangoStore'
import useMarketList from './useMarketList'

const getOrderBookAccounts = (market, accountInfos) => {
  const bidData = accountInfos[market._decoded.bids.toString()]?.data
  const askData = accountInfos[market._decoded.asks.toString()]?.data

  return {
    bidOrderBook:
      market && bidData ? Orderbook.decode(market, Buffer.from(bidData)) : null,
    askOrderBook:
      market && askData ? Orderbook.decode(market, Buffer.from(askData)) : null,
  }
}

export function useOpenOrders() {
  const markets = useMangoStore((s) => s.selectedMangoGroup.markets)
  const marginAccount = useMangoStore((s) => s.selectedMarginAccount.current)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const accountInfos = useMangoStore((s) => s.accountInfos)
  const { marketList } = useMarketList()

  if (!mangoGroup || !marginAccount || !accountInfos) return null

  const openOrders = Object.entries(markets).map(([address, market]) => {
    const marketIndex = mangoGroup.getMarketIndex(market)
    const openOrdersAccount = marginAccount.openOrdersAccounts[marketIndex]
    const marketName = marketList.find(
      (mkt) => mkt.address.toString() === address
    ).name

    if (!openOrdersAccount) return []

    const { bidOrderBook, askOrderBook } = getOrderBookAccounts(
      market,
      accountInfos
    )

    const openOrdersForMarket = [...bidOrderBook, ...askOrderBook].filter((o) =>
      o.openOrdersAddress.equals(openOrdersAccount.address)
    )

    return openOrdersForMarket.map((order) => ({
      ...order,
      marketName,
      market,
    }))
  })

  return openOrders.flat()
}
