import { useEffect, useMemo } from 'react'
import {
  PerpOrder,
  BookSide,
  BookSideLayout,
  getMarketByPublicKey,
  MarketConfig,
  PerpMarket,
  MangoAccount,
  I80F48,
} from '@blockworks-foundation/mango-client'
import { Market, Orderbook } from '@project-serum/serum'
import { Order } from '@project-serum/serum/lib/market'
import { PerpTriggerOrder } from '../@types/types'
import {
  accountInfosSelector,
  mangoGroupConfigSelector,
  mangoGroupSelector,
  marketsSelector,
} from '../stores/selectors'
import useMangoStore from '../stores/useMangoStore'
import useMangoAccount from './useMangoAccount'

type OrderInfo = {
  order: Order | PerpOrder | PerpTriggerOrder
  market: { account: Market | PerpMarket; config: MarketConfig }
}

function parseSpotOrders(
  market: Market,
  config: MarketConfig,
  mangoAccount: MangoAccount,
  accountInfos
) {
  const openOrders = mangoAccount.spotOpenOrdersAccounts[config.marketIndex]
  if (!openOrders) return []

  const bidData = accountInfos[market['_decoded'].bids.toBase58()]?.data
  const askData = accountInfos[market['_decoded'].asks.toBase58()]?.data

  const bidOrderBook =
    market && bidData ? Orderbook.decode(market, bidData) : []
  const askOrderBook =
    market && askData ? Orderbook.decode(market, askData) : []

  const openOrdersForMarket = [...bidOrderBook, ...askOrderBook].filter((o) =>
    o.openOrdersAddress.equals(openOrders.address)
  )

  return openOrdersForMarket.map<OrderInfo>((order) => ({
    order,
    market: { account: market, config: config },
  }))
}

function parsePerpOpenOrders(
  market: PerpMarket,
  config: MarketConfig,
  mangoAccount: MangoAccount,
  accountInfos
) {
  const bidData = accountInfos[market.bids.toBase58()]?.data
  const askData = accountInfos[market.asks.toBase58()]?.data

  const bidOrderBook =
    market && bidData
      ? new BookSide(market.bids, market, BookSideLayout.decode(bidData))
      : []
  const askOrderBook =
    market && askData
      ? new BookSide(market.asks, market, BookSideLayout.decode(askData))
      : []

  const openOrdersForMarket = [...bidOrderBook, ...askOrderBook].filter((o) =>
    o.owner.equals(mangoAccount.publicKey)
  )

  const advancedOrdersForMarket = mangoAccount.advancedOrders
    .map((o, i) => {
      const pto = o.perpTrigger
      if (pto.isActive && pto.marketIndex == config.marketIndex) {
        return {
          ...o,
          orderId: i,
          marketIndex: pto.marketIndex,
          orderType: pto.orderType,
          side: pto.side,
          price: market.priceLotsToNumber(pto.price),
          size: market.baseLotsToNumber(pto.quantity),
          triggerCondition: pto.triggerCondition,
          triggerPrice: pto.triggerPrice.mul(
            I80F48.fromNumber(
              Math.pow(10, market.baseDecimals - market.quoteDecimals)
            )
          ),
        }
      } else {
        return undefined
      }
    })
    .filter((o) => !!o)

  return openOrdersForMarket
    .concat(advancedOrdersForMarket)
    .map<OrderInfo>((order) => ({
      order,
      market: { account: market, config: config },
    }))
}

export function useOpenOrders() {
  const markets = useMangoStore(marketsSelector)
  const { mangoAccount } = useMangoAccount()
  const mangoGroup = useMangoStore(mangoGroupSelector)
  const groupConfig = useMangoStore(mangoGroupConfigSelector)
  const accountInfos = useMangoStore(accountInfosSelector)
  const setMangoStore = useMangoStore((s) => s.set)

  const openOrders = useMemo(() => {
    if (!mangoGroup || !mangoAccount || !accountInfos) return []

    const openOrders = Object.entries(markets).map(([address, market]) => {
      const marketConfig = getMarketByPublicKey(groupConfig, address)
      if (market instanceof Market) {
        return parseSpotOrders(market, marketConfig, mangoAccount, accountInfos)
      } else if (market instanceof PerpMarket) {
        return parsePerpOpenOrders(
          market,
          marketConfig,
          mangoAccount,
          accountInfos
        )
      }
    })

    return openOrders.flat()
  }, [markets, accountInfos, mangoAccount])

  useEffect(() => {
    if (mangoGroup && mangoAccount) {
      setMangoStore((state) => {
        state.selectedMangoAccount.openOrders = openOrders
        state.selectedMangoAccount.totalOpenOrders = openOrders.length
      })
    }
  })
}
