import { useEffect } from 'react'
import { Market } from '@project-serum/serum'
// import { AccountInfo, PublicKey } from '@solana/web3.js'
import { PublicKey } from '@solana/web3.js'
import useConnection from './useConnection'
import useMangoStore from '../stores/useMangoStore'
// import useSerumStore from '../stores/useSerumStore'
// import useMarketList from './useMarketList'
import useInterval from './useInterval'

const SECONDS = 1000
// const _SLOW_REFRESH_INTERVAL = 60 * SECONDS

// const mangoGroupMarketsSelector = (s) => s.selectedMangoGroup.markets
// const websocketConnectionSelector = (s) => s.connection.websocket
const selectedMarketAddressSelector = (s) => s.selectedMarket.address

const useHydrateStore = () => {
  const setMangoStore = useMangoStore((s) => s.set)
  // const setSerumStore = useSerumStore((s) => s.set)
  // const marketsForSelectedMangoGroup = useMangoStore(mangoGroupMarketsSelector)
  // const websocketConnection = useMangoStore(websocketConnectionSelector)
  const selectedMarketAddress = useMangoStore(selectedMarketAddressSelector)
  const actions = useMangoStore((s) => s.actions)
  const { connection, dexProgramId } = useConnection()
  // const { marketList } = useMarketList()

  useEffect(() => {
    actions.fetchMangoGroup()
  }, [actions])

  useInterval(() => {
    actions.fetchMangoGroup()
  }, 60 * SECONDS)

  // load the selected market and orderbook
  useEffect(() => {
    Market.load(
      connection,
      new PublicKey(selectedMarketAddress),
      {},
      dexProgramId
    )
      .then(async (market) => {
        const bidAccount = market['_decoded'].bids
        const bidInfo = await connection.getAccountInfo(bidAccount)
        const askAccount = market['_decoded'].asks
        const askInfo = await connection.getAccountInfo(askAccount)

        setMangoStore((state) => {
          state.selectedMarket.current = market
          state.accountInfos[askAccount.toString()] = askInfo
          state.accountInfos[bidAccount.toString()] = bidInfo
        })
      })
      .catch((e) => {
        console.log({
          message: 'Error loading market',
          description: e.message,
          type: 'error',
        })
      })
  }, [selectedMarketAddress])

  // // load all markets for mangoGroup
  // useEffect(() => {
  //   Promise.all(
  //     marketList.map((mkt) => {
  //       return Market.load(connection, mkt.address, {}, mkt.programId)
  //     })
  //   ).then((markets) => {
  //     setMangoStore((state) => {
  //       state.selectedMarket.current = markets[0]
  //       markets.forEach((market) => {
  //         state.selectedMangoGroup.markets[market.publicKey.toString()] = market
  //         const bidAcctAddress = market['_decoded'].bids.toString()
  //         if (!(bidAcctAddress in state.accountInfos)) {
  //           state.accountInfos[bidAcctAddress] = null
  //         }
  //         const askAcctAddress = market['_decoded'].asks.toString()
  //         if (!(askAcctAddress in state.accountInfos)) {
  //           state.accountInfos[askAcctAddress] = null
  //         }
  //       })
  //     })
  //   })
  // }, [marketList])

  // // hydrate orderbook with all markets in mango group
  // useEffect(() => {
  //   const subscriptionIds = Object.entries(marketsForSelectedMangoGroup).map(
  //     ([, market]) => {
  //       let previousBidInfo: AccountInfo<Buffer> | null = null
  //       let previousAskInfo: AccountInfo<Buffer> | null = null
  //       return [
  //         websocketConnection.onAccountChange(
  //           // @ts-ignore
  //           market._decoded.bids,
  //           (info) => {
  //             if (
  //               !previousBidInfo ||
  //               !previousBidInfo.data.equals(info.data) ||
  //               previousBidInfo.lamports !== info.lamports
  //             ) {
  //               previousBidInfo = info
  //               setMangoStore((state) => {
  //                 // @ts-ignore
  //                 const pkString = market._decoded.bids.toString()
  //                 state.accountInfos[pkString] = previousBidInfo
  //               })
  //             }
  //           }
  //         ),
  //         websocketConnection.onAccountChange(
  //           // @ts-ignore
  //           market._decoded.asks,
  //           (info) => {
  //             if (
  //               !previousAskInfo ||
  //               !previousAskInfo.data.equals(info.data) ||
  //               previousAskInfo.lamports !== info.lamports
  //             ) {
  //               previousAskInfo = info
  //               setMangoStore((state) => {
  //                 // @ts-ignore
  //                 const pkString = market._decoded.asks.toString()
  //                 state.accountInfos[pkString] = previousAskInfo
  //               })
  //             }
  //           }
  //         ),
  //       ]
  //     }
  //   )
  //   console.log('subscription ids', subscriptionIds)

  //   return () => {
  //     for (const id of subscriptionIds.flat()) {
  //       websocketConnection.removeAccountChangeListener(id)
  //     }
  //   }
  // }, [marketsForSelectedMangoGroup])

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
