import { useEffect } from 'react'
import { AccountInfo } from '@solana/web3.js'
import useMangoStore, { WEBSOCKET_CONNECTION } from '../stores/useMangoStore'
import useInterval from './useInterval'

const SECONDS = 1000
// const _SLOW_REFRESH_INTERVAL = 60 * SECONDS

const useHydrateStore = () => {
  const setMangoStore = useMangoStore((s) => s.set)
  const actions = useMangoStore((s) => s.actions)
  const markets = useMangoStore((s) => s.selectedMangoGroup.markets)
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const selectedMarket = useMangoStore((s) => s.selectedMarket.current)

  useEffect(() => {
    actions.fetchMangoGroup()
  }, [actions])

  useInterval(() => {
    actions.fetchMangoGroup()
  }, 60 * SECONDS)

  useEffect(() => {
      setMangoStore((state) => {
        state.selectedMarket.current =
        markets[marketConfig.publicKey.toString()]
      })
  }, [marketConfig])

  // hydrate orderbook with all markets in mango group
  useEffect(() => {
    let previousBidInfo: AccountInfo<Buffer> | null = null
    let previousAskInfo: AccountInfo<Buffer> | null = null
    if (!selectedMarket || marketConfig.kind !== 'spot') return

    const bidSubscriptionId = WEBSOCKET_CONNECTION.onAccountChange(
      selectedMarket['_decoded'].bids,
      (info) => {
        console.log('bid websocket')
        if (
          !previousBidInfo ||
          !previousBidInfo.data.equals(info.data) ||
          previousBidInfo.lamports !== info.lamports
        ) {
          previousBidInfo = info
          setMangoStore((state) => {
            const pkString = selectedMarket['_decoded'].bids.toString()
            state.accountInfos[pkString] = previousBidInfo
          })
        }
      }
    )
    const askSubscriptionId = WEBSOCKET_CONNECTION.onAccountChange(
      selectedMarket['_decoded'].asks,
      (info) => {
        console.log('ask websocket')
        if (
          !previousAskInfo ||
          !previousAskInfo.data.equals(info.data) ||
          previousAskInfo.lamports !== info.lamports
        ) {
          previousAskInfo = info
          setMangoStore((state) => {
            const pkString = selectedMarket['_decoded'].asks.toString()
            state.accountInfos[pkString] = previousAskInfo
          })
        }
      }
    )

    return () => {
      WEBSOCKET_CONNECTION.removeAccountChangeListener(bidSubscriptionId)
      WEBSOCKET_CONNECTION.removeAccountChangeListener(askSubscriptionId)
    }
  }, [selectedMarket])

  // // fetch filled trades for selected market
  // useInterval(() => {
  //   async function fetchFills() {
  //     const market = useMangoStore.getState().selectedMarket.current
  //     if (!market || !connection) {
  //       return null
  //     }
  //     try {
  //       const loadedFills = await market.loadFills(connection, 10000)
  //       setSerumStore((state) => {
  //         state.fills = loadedFills
  //       })
  //     } catch (err) {
  //       console.log('Error fetching fills:', err)
  //     }
  //   }

  //   fetchFills()
  // }, _SLOW_REFRESH_INTERVAL)
}

export default useHydrateStore
