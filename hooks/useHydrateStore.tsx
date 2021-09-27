import { useEffect } from 'react'
import { AccountInfo } from '@solana/web3.js'
import useMangoStore from '../stores/useMangoStore'
import useInterval from './useInterval'
import useOrderbook from './useOrderbook'

const SECONDS = 1000
const _SLOW_REFRESH_INTERVAL = 20 * SECONDS

const useHydrateStore = () => {
  const setMangoStore = useMangoStore((s) => s.set)
  const actions = useMangoStore((s) => s.actions)
  const markets = useMangoStore((s) => s.selectedMangoGroup.markets)
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const selectedMarket = useMangoStore((s) => s.selectedMarket.current)
  const connection = useMangoStore((s) => s.connection.current)
  useOrderbook()

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
    setMangoStore((state) => {
      state.selectedMarket.current = markets[marketConfig.publicKey.toString()]
    })
  }, [marketConfig, markets, setMangoStore])

  // hydrate orderbook with all markets in mango group
  useEffect(() => {
    let previousBidInfo: AccountInfo<Buffer> | null = null
    let previousAskInfo: AccountInfo<Buffer> | null = null
    if (!marketConfig) return

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
            state.accountInfos[marketConfig.bidsKey.toString()] =
              previousBidInfo
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
            state.accountInfos[marketConfig.asksKey.toString()] =
              previousAskInfo
          })
        }
      }
    )

    return () => {
      connection.removeAccountChangeListener(bidSubscriptionId)
      connection.removeAccountChangeListener(askSubscriptionId)
    }
  }, [marketConfig, connection, setMangoStore])

  // fetch filled trades for selected market
  useInterval(() => {
    actions.loadMarketFills()
  }, _SLOW_REFRESH_INTERVAL)

  useEffect(() => {
    actions.loadMarketFills()
  }, [selectedMarket])
}

export default useHydrateStore
