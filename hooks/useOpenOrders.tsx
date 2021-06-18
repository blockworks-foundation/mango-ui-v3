import { Orderbook } from '@project-serum/serum'
import { PublicKey } from '@solana/web3.js'
import useMangoStore from '../stores/useMangoStore'

const getOrderBookAccounts = (market, accountInfos) => {
  const bidData = accountInfos[market._decoded.bids.toString()]?.data
  const askData = accountInfos[market._decoded.asks.toString()]?.data

  return {
    bidOrderBook:
      market && bidData ? Orderbook.decode(market, Buffer.from(bidData)) : [],
    askOrderBook:
      market && askData ? Orderbook.decode(market, Buffer.from(askData)) : [],
  }
}

export function useOpenOrders() {
  const markets = useMangoStore((s) => s.selectedMangoGroup.markets)
  const marginAccount = useMangoStore((s) => s.selectedMarginAccount.current)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoGroupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const accountInfos = useMangoStore((s) => s.accountInfos)

  if (!mangoGroup || !marginAccount || !accountInfos) return null

  const openOrders = Object.entries(markets).map(([address, market]) => {
    const marketIndex = mangoGroup.getSpotMarketIndex(new PublicKey(address))
    const openOrdersAccount = marginAccount.spotOpenOrdersAccounts[marketIndex]

    const marketName = mangoGroupConfig.spot_markets.find(
      (mkt) => mkt.key.toString() === address
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
