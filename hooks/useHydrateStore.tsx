import { useEffect } from 'react'
import { Market } from '@project-serum/serum'
// import { AccountInfo, PublicKey } from '@solana/web3.js'
import { AccountInfo, PublicKey } from '@solana/web3.js'
import useConnection from './useConnection'
import useMangoStore, {
  mangoClient,
  WEBSOCKET_CONNECTION,
} from '../stores/useMangoStore'
// import useSerumStore from '../stores/useSerumStore'
// import useMarketList from './useMarketList'
import useInterval from './useInterval'
import { PerpMarket } from '@blockworks-foundation/mango-client'

const SECONDS = 1000
// const _SLOW_REFRESH_INTERVAL = 60 * SECONDS

const useHydrateStore = () => {
  const setMangoStore = useMangoStore((s) => s.set)
  const actions = useMangoStore((s) => s.actions)
  const groupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const selectedMarket = useMangoStore((s) => s.selectedMarket)

  const { connection } = useConnection()
  // const { marketList } = useMarketList()

  useEffect(() => {
    actions.fetchMangoGroup()
  }, [actions])

  useInterval(() => {
    actions.fetchMangoGroup()
  }, 60 * SECONDS)

  // load the selected market and orderbook
  useEffect(() => {
    if (marketConfig.kind === 'spot') {
      Market.load(
        connection,
        marketConfig.publicKey,
        {},
        groupConfig.serumProgramId
      )
        .then(async (market) => {
          const bidAccount = market['_decoded'].bids
          const bidInfo = await connection.getAccountInfo(bidAccount)
          const askAccount = market['_decoded'].asks
          const askInfo = await connection.getAccountInfo(askAccount)

          setMangoStore((state) => {
            state.selectedMarket.current = market
            state.selectedMarket.askInfo = askInfo
            state.selectedMarket.bidInfo = bidInfo
          })
        })
        .catch((e) => {
          console.log({
            message: 'Error loading market',
            description: e.message,
            type: 'error',
          })
        })
    } else {
      mangoClient.getPerpMarket(marketConfig.publicKey, marketConfig.baseDecimals, marketConfig.quoteDecimals).then(async (market) => {
        const bidInfo = await connection.getAccountInfo(market.bids)
        const askInfo = await connection.getAccountInfo(market.asks)

        setMangoStore((state) => {
          state.selectedMarket.current = market
          state.selectedMarket.askInfo = askInfo
          state.selectedMarket.bidInfo = bidInfo
        })
      })
    }
  }, [connection, mangoClient, marketConfig, groupConfig, setMangoStore])

  // // hydrate orderbook with all markets in mango group
  // useEffect(() => {
  //   let previousBidInfo: AccountInfo<Buffer> | null = null
  //   let previousAskInfo: AccountInfo<Buffer> | null = null
  //   const market = selectedMarket.current
  //   if (!market) return
  //   console.log('selected market =: ', market)

  //   const bidSubscriptionId = WEBSOCKET_CONNECTION.onAccountChange(
  //     market['_decoded']?.bids,
  //     (info) => {
  //       console.log('bid websocket')

  //       if (
  //         !previousBidInfo ||
  //         !previousBidInfo.data.equals(info.data) ||
  //         previousBidInfo.lamports !== info.lamports
  //       ) {
  //         previousBidInfo = info
  //         setMangoStore((state) => {
  //           const pkString = market['_decoded'].bids.toString()
  //           state.accountInfos[pkString] = previousBidInfo
  //           state.selectedMarket.bidInfo = previousBidInfo
  //         })
  //       }
  //     }
  //   )
  //   const askSubscriptionId = WEBSOCKET_CONNECTION.onAccountChange(
  //     market['_decoded'].asks,
  //     (info) => {
  //       console.log('ask websocket')

  //       if (
  //         !previousAskInfo ||
  //         !previousAskInfo.data.equals(info.data) ||
  //         previousAskInfo.lamports !== info.lamports
  //       ) {
  //         previousAskInfo = info
  //         setMangoStore((state) => {
  //           const pkString = market['_decoded'].asks.toString()
  //           state.accountInfos[pkString] = previousAskInfo
  //           state.selectedMarket.askInfo = previousAskInfo
  //         })
  //       }
  //     }
  //   )

  //   return () => {
  //     WEBSOCKET_CONNECTION.removeAccountChangeListener(bidSubscriptionId)
  //     WEBSOCKET_CONNECTION.removeAccountChangeListener(askSubscriptionId)
  //   }
  // }, [selectedMarket])

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
