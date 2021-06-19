import { PerpOrder, BookSide, BookSideLayout, getMarketByPublicKey, MarketConfig, PerpMarket, MerpsAccount as MarginAccount } from '@blockworks-foundation/mango-client'
import { Market, Orderbook } from '@project-serum/serum'
import { Order } from '@project-serum/serum/lib/market'
import useMangoStore from '../stores/useMangoStore'

type OrderInfo = {
  order: Order | PerpOrder,
  market: { account: Market | PerpMarket, config: MarketConfig }}

function parseSpotOrders(market: Market, config: MarketConfig, marginAccount: MarginAccount, accountInfos) {
  const openOrders = marginAccount.spotOpenOrdersAccounts[config.marketIndex];
  if (!openOrders)
    return [];

  const bidData = accountInfos[market['_decoded'].bids.toBase58()]?.data
  const askData = accountInfos[market['_decoded'].asks.toBase58()]?.data

  const bidOrderBook = market && bidData ? Orderbook.decode(market, bidData) : []
  const askOrderBook = market && askData ? Orderbook.decode(market, askData) : []

  const openOrdersForMarket = [...bidOrderBook, ...askOrderBook].filter((o) =>
      o.openOrdersAddress.equals(openOrders.address)
  )

  return openOrdersForMarket.map<OrderInfo>((order) => ({
      order,
      market: { account: market, config: config },
    }))
}

function parsePerpOpenOrders(market: PerpMarket, config: MarketConfig, marginAccount: MarginAccount, accountInfos) {
  const bidData = accountInfos[market.bids.toBase58()]?.data
  const askData = accountInfos[market.asks.toBase58()]?.data

  const bidOrderBook = market && bidData ? new BookSide(market.bids, market, BookSideLayout.decode(bidData)) : [] 
  const askOrderBook = market && askData ? new BookSide(market.asks, market, BookSideLayout.decode(askData)) : [] 

  const openOrdersForMarket = [...bidOrderBook, ...askOrderBook].filter((o) =>
      o.owner.equals(marginAccount.publicKey)
  )

  return openOrdersForMarket.map<OrderInfo>((order) => ({
    order,
    market: { account: market, config: config },
  }));
}

export function useOpenOrders() {
  const markets = useMangoStore((s) => s.selectedMangoGroup.markets)
  const marginAccount = useMangoStore((s) => s.selectedMarginAccount.current)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const groupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const accountInfos = useMangoStore((s) => s.accountInfos)

  if (!mangoGroup || !marginAccount || !accountInfos) return null

  const openOrders = Object.entries(markets).map(([address, market]) => {    
    const marketConfig = getMarketByPublicKey(groupConfig, address)
    if (market instanceof Market) {
      return parseSpotOrders(market, marketConfig, marginAccount, accountInfos);
    } else if (market instanceof PerpMarket) {
      return parsePerpOpenOrders(market, marketConfig, marginAccount, accountInfos);
    }
  })

  return openOrders.flat()
}
