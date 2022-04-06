import { useEffect } from 'react'
import { AccountInfo, PublicKey } from '@solana/web3.js'
import useMangoStore, { programId, SECONDS } from '../stores/useMangoStore'
import useInterval from './useInterval'
import { Market, Orderbook as SpotOrderBook } from '@project-serum/serum'
import {
  BookSide,
  BookSideLayout,
  MangoAccountLayout,
  PerpMarket,
  ReferrerMemory,
  ReferrerMemoryLayout,
} from '@blockworks-foundation/mango-client'
import {
  actionsSelector,
  connectionSelector,
  mangoAccountSelector,
  marketConfigSelector,
  marketSelector,
  marketsSelector,
} from '../stores/selectors'

function decodeBookL2(market, accInfo: AccountInfo<Buffer>): number[][] {
  if (market && accInfo?.data) {
    const depth = 40
    if (market instanceof Market) {
      const book = SpotOrderBook.decode(market, accInfo.data)
      return book.getL2(depth).map(([price, size]) => [price, size])
    } else if (market instanceof PerpMarket) {
      // FIXME: Review the null being passed here
      const book = new BookSide(
        // @ts-ignore
        null,
        market,
        BookSideLayout.decode(accInfo.data)
      )
      return book.getL2Ui(depth)
    }
  }
  return []
}

export function decodeBook(
  market,
  accInfo: AccountInfo<Buffer>
): BookSide | SpotOrderBook | undefined {
  if (market && accInfo?.data) {
    if (market instanceof Market) {
      return SpotOrderBook.decode(market, accInfo.data)
    } else if (market instanceof PerpMarket) {
      // FIXME: Review the null being passed here
      // @ts-ignore
      return new BookSide(null, market, BookSideLayout.decode(accInfo.data))
    }
  }
}

const useHydrateStore = () => {
  const setMangoStore = useMangoStore((s) => s.set)
  const actions = useMangoStore(actionsSelector)
  const markets = useMangoStore(marketsSelector)
  const marketConfig = useMangoStore(marketConfigSelector)
  const selectedMarket = useMangoStore(marketSelector)
  const connection = useMangoStore(connectionSelector)
  const mangoAccount = useMangoStore(mangoAccountSelector)

  // Fetches mango group as soon as page loads
  useEffect(() => {
    actions.fetchMangoGroup()
    actions.fetchMarketsInfo()
  }, [actions])

  useInterval(() => {
    actions.fetchMangoGroupCache()
  }, 12 * SECONDS)

  useInterval(() => {
    if (mangoAccount) {
      actions.reloadOrders()
    }
  }, 20 * SECONDS)

  useInterval(() => {
    if (mangoAccount) {
      actions.reloadMangoAccount()
      actions.fetchTradeHistory()
      actions.updateOpenOrders()
    }
  }, 90 * SECONDS)

  useInterval(() => {
    actions.fetchMangoGroup()
    actions.fetchWalletTokens()
    actions.fetchMarketsInfo()
  }, 120 * SECONDS)

  useEffect(() => {
    if (!marketConfig || !markets) return

    const market = markets[marketConfig.publicKey.toString()]
    if (!market) return
    setMangoStore((state) => {
      state.selectedMarket.current = market
      state.selectedMarket.orderBook.bids = decodeBookL2(
        market,
        state.accountInfos[marketConfig.bidsKey.toString()]
      )
      state.selectedMarket.orderBook.asks = decodeBookL2(
        market,
        state.accountInfos[marketConfig.asksKey.toString()]
      )
    })
  }, [marketConfig, markets, setMangoStore])

  // watch selected Mango Account for changes
  useEffect(() => {
    if (!mangoAccount) return

    const subscriptionId = connection.onAccountChange(
      mangoAccount.publicKey,
      (info, context) => {
        if (info?.lamports === 0) return

        const lastSeenSlot =
          useMangoStore.getState().selectedMangoAccount.lastSlot
        const mangoAccountLastUpdated = new Date(
          useMangoStore.getState().selectedMangoAccount.lastUpdatedAt
        )
        const newUpdatedAt = new Date()
        const timeDiff =
          mangoAccountLastUpdated.getTime() - newUpdatedAt.getTime()

        // only updated mango account if it's been more than 1 second since last update
        if (Math.abs(timeDiff / 1000) >= 1 && context.slot > lastSeenSlot) {
          const decodedMangoAccount = MangoAccountLayout.decode(info?.data)
          const newMangoAccount = Object.assign(
            mangoAccount,
            decodedMangoAccount
          )

          setMangoStore((state) => {
            state.selectedMangoAccount.lastSlot = context.slot
            state.selectedMangoAccount.current = newMangoAccount
            state.selectedMangoAccount.lastUpdatedAt =
              newUpdatedAt.toISOString()
          })
        }
      }
    )

    return () => {
      connection.removeAccountChangeListener(subscriptionId)
    }
  }, [mangoAccount])

  // fetch referrer for selected Mango Account
  useEffect(() => {
    if (mangoAccount) {
      const fetchReferrer = async () => {
        try {
          const [referrerMemoryPk] = await PublicKey.findProgramAddress(
            [
              mangoAccount.publicKey.toBytes(),
              new Buffer('ReferrerMemory', 'utf-8'),
            ],
            programId
          )

          const info = await connection.getAccountInfo(referrerMemoryPk)
          if (info) {
            const decodedReferrer = ReferrerMemoryLayout.decode(info.data)
            const referrerMemory = new ReferrerMemory(decodedReferrer)

            setMangoStore((state) => {
              state.referrerPk = referrerMemory.referrerMangoAccount
            })
          }
        } catch (e) {
          console.error('Unable to fetch referrer', e)
        }
      }

      fetchReferrer()
    }
  }, [mangoAccount])

  // hydrate orderbook with all markets in mango group
  useEffect(() => {
    let previousBidInfo: AccountInfo<Buffer> | null = null
    let previousAskInfo: AccountInfo<Buffer> | null = null
    if (!marketConfig || !selectedMarket) return
    console.log('in orderbook WS useEffect')

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

          info['parsed'] = decodeBook(selectedMarket, info)
          setMangoStore((state) => {
            state.accountInfos[marketConfig.bidsKey.toString()] = info
            state.selectedMarket.orderBook.bids = decodeBookL2(
              selectedMarket,
              info
            )
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

          info['parsed'] = decodeBook(selectedMarket, info)
          setMangoStore((state) => {
            state.accountInfos[marketConfig.asksKey.toString()] = info
            state.selectedMarket.orderBook.asks = decodeBookL2(
              selectedMarket,
              info
            )
          })
        }
      }
    )

    return () => {
      connection.removeAccountChangeListener(bidSubscriptionId)
      connection.removeAccountChangeListener(askSubscriptionId)
    }
  }, [marketConfig, selectedMarket, connection, setMangoStore])

  // fetch filled trades for selected market
  useInterval(() => {
    actions.loadMarketFills()
  }, 20 * SECONDS)

  useEffect(() => {
    actions.loadMarketFills()
  }, [selectedMarket])
}

export default useHydrateStore
