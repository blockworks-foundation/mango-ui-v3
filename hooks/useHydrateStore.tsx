import { useEffect } from 'react'
import { RBTree } from 'bintrees'
import { AccountInfo, PublicKey } from '@solana/web3.js'
import useMangoStore, {
  Orderbook,
  programId,
  SECONDS,
} from '../stores/useMangoStore'
import useInterval from './useInterval'
import set from 'lodash/set'
import get from 'lodash/get'
import { Market, Orderbook as SpotOrderBook } from '@project-serum/serum'
import {
  BookSide,
  BookSideLayout,
  MangoAccount,
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
import { useWallet } from '@solana/wallet-adapter-react'

export function decodeBook(
  market,
  accInfo: AccountInfo<Buffer>
): BookSide | SpotOrderBook | undefined {
  if (market && accInfo?.data) {
    if (market instanceof Market) {
      return SpotOrderBook.decode(market, accInfo.data)
    } else if (market instanceof PerpMarket) {
      // FIXME: Review the null being passed here
      return new BookSide(
        // @ts-ignore
        null,
        market,
        BookSideLayout.decode(accInfo.data),
        undefined,
        100000
      )
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
  const { wallet } = useWallet()

  // Fetches mango group as soon as page loads
  useEffect(() => {
    actions.fetchMangoGroup()
  }, [actions])

  // Fetch markets info once mango group is loaded
  useEffect(() => {
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
    actions.fetchMarketsInfo()
    if (wallet) {
      actions.fetchWalletTokens(wallet)
    }
  }, 120 * SECONDS)

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080')

    const trees: { [market: string]: any } = {}

    const books: { [market: string]: Orderbook } = {}

    ws.onmessage = (event) => {
      const { data } = event

      const instruction = JSON.parse(data)

      const { market, type, side, orders } = instruction

      if (type == 'l2snapshot') {
        switch (side) {
          case 'bids':
            set(
              trees,
              [market, side],
              new RBTree<{ price: number; size: number }>(
                (nodeA, nodeB) => nodeB.price - nodeA.price
              )
            )

            for (const [price, size] of orders) {
              trees[market][side].insert({ price, size })
            }

            break
          case 'asks':
            set(
              trees,
              [market, side],
              new RBTree<{ price: number; size: number }>(
                (nodeA, nodeB) => nodeA.price - nodeB.price
              )
            )

            for (const [price, size] of orders) {
              trees[market][side].insert({ price, size })
            }

            break
          default:
            console.error('Invalid side received')
        }
      }

      const tree = get(trees, [market, side])

      if (type == 'l2update') {
        for (const [price, size] of orders) {
          const node = tree.find({ price, size })

          if (size == 0) {
            if (node) tree.remove({ price, size })
          } else if (node) {
            node.size = size
          } else {
            tree.insert({ price, size })
          }
        }
      }

      const iterator = tree.iterator()

      const materialized: any[] = []

      let order = iterator.next()

      while (order !== null) {
        materialized.push([order.price, order.size])

        order = iterator.next()
      }

      set(books, [market], {
        ...get(books, [market], { bids: [], asks: [] }),
        [side]: materialized,
      })

      const book = get(books, [marketConfig.name], {
        bids: [],
        asks: [],
      })

      setMangoStore((state) => {
        state.selectedMarket.orderBook = book
      })
    }

    return () => ws.close()
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
        const mangoAccount =
          useMangoStore.getState().selectedMangoAccount.current
        if (!mangoAccount) return
        const newUpdatedAt = new Date()
        const timeDiff =
          mangoAccountLastUpdated.getTime() - newUpdatedAt.getTime()

        // only updated mango account if it's been more than 1 second since last update
        if (Math.abs(timeDiff) >= 500 && context.slot > lastSeenSlot) {
          const decodedMangoAccount = MangoAccountLayout.decode(info?.data)
          const newMangoAccount = new MangoAccount(
            mangoAccount.publicKey,
            decodedMangoAccount
          )
          newMangoAccount.spotOpenOrdersAccounts =
            mangoAccount.spotOpenOrdersAccounts
          newMangoAccount.advancedOrders = mangoAccount.advancedOrders

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

  // fetch filled trades for selected market
  useInterval(() => {
    actions.loadMarketFills()
  }, 20 * SECONDS)

  useEffect(() => {
    actions.loadMarketFills()
  }, [selectedMarket])
}

export default useHydrateStore
