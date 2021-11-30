import { useEffect } from 'react'
import { AccountInfo } from '@solana/web3.js'
import useMangoStore from '../stores/useMangoStore'
import useInterval from './useInterval'
import { Orderbook as SpotOrderBook, Market } from '@project-serum/serum'
import {
  BookSide,
  BookSideLayout,
  PerpMarket,
} from '@blockworks-foundation/mango-client'

const SECONDS = 1000
const _SLOW_REFRESH_INTERVAL = 20 * SECONDS

function decodeBook(market, accInfo: AccountInfo<Buffer>): number[][] {
  if (market && accInfo?.data) {
    const depth = 40
    if (market instanceof Market) {
      const book = SpotOrderBook.decode(market, accInfo.data)
      return book.getL2(depth).map(([price, size]) => [price, size])
    } else if (market instanceof PerpMarket) {
      const book = new BookSide(
        null,
        market,
        BookSideLayout.decode(accInfo.data)
      )
      return book.getL2(depth).map(([price, size]) => [price, size])
    }
  } else {
    return []
  }
}

const useHydrateStore = () => {
  const setMangoStore = useMangoStore((s) => s.set)
  const actions = useMangoStore((s) => s.actions)
  const markets = useMangoStore((s) => s.selectedMangoGroup.markets)
  const market = useMangoStore((state) => state.selectedMarket.current)
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const selectedMarket = useMangoStore((s) => s.selectedMarket.current)
  const connection = useMangoStore((s) => s.connection.current)

  useEffect(() => {
    actions.fetchMangoGroup()
  }, [actions])

  useInterval(() => {
    actions.fetchMangoGroup()
  }, 120 * SECONDS)

  useInterval(() => {
    actions.fetchMangoGroupCache()
  }, 30 * SECONDS)

  useEffect(() => {
    const market = markets[marketConfig.publicKey.toString()]
    setMangoStore((state) => {
      state.selectedMarket.current = market
      state.selectedMarket.orderBook.bids = decodeBook(
        market,
        state.accountInfos[marketConfig.bidsKey.toString()]
      )
      state.selectedMarket.orderBook.asks = decodeBook(
        market,
        state.accountInfos[marketConfig.asksKey.toString()]
      )
    })
  }, [marketConfig])

  // hydrate orderbook with all markets in mango group
  useEffect(() => {
    let previousBidInfo: AccountInfo<Buffer> | null = null
    let previousAskInfo: AccountInfo<Buffer> | null = null
    if (!marketConfig || !market) return

    const bidSubscriptionId = connection.onAccountChange(
      marketConfig.bidsKey,
      (info, context) => {
        const lastSlot = useMangoStore.getState().connection.slot
        if (
          (!previousBidInfo ||
            !previousBidInfo.data.equals(info.data) ||
            previousBidInfo.lamports !== info.lamports) &&
          context.slot > lastSlot
        ) {
          previousBidInfo = info
          setMangoStore((state) => {
            state.accountInfos[marketConfig.bidsKey.toString()] = info
            state.selectedMarket.orderBook.bids = decodeBook(market, info)
          })
        }
      }
    )
    const askSubscriptionId = connection.onAccountChange(
      marketConfig.asksKey,
      (info, context) => {
        const lastSlot = useMangoStore.getState().connection.slot
        if (
          (!previousAskInfo ||
            !previousAskInfo.data.equals(info.data) ||
            previousAskInfo.lamports !== info.lamports) &&
          context.slot > lastSlot
        ) {
          previousAskInfo = info
          setMangoStore((state) => {
            state.accountInfos[marketConfig.asksKey.toString()] = info
            state.selectedMarket.orderBook.asks = decodeBook(market, info)
          })
        }
      }
    )

    return () => {
      connection.removeAccountChangeListener(bidSubscriptionId)
      connection.removeAccountChangeListener(askSubscriptionId)
    }
  }, [marketConfig, market, connection, setMangoStore])

  // fetch filled trades for selected market
  useInterval(() => {
    actions.loadMarketFills()
  }, _SLOW_REFRESH_INTERVAL)

  useEffect(() => {
    actions.loadMarketFills()
  }, [selectedMarket])
}

export default useHydrateStore
