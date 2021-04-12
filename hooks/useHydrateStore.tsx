import { useEffect } from 'react'
import { Market } from '@project-serum/serum'
import { PublicKey, AccountInfo } from '@solana/web3.js'
import useConnection from './useConnection'
import useMangoStore from '../stores/useMangoStore'
import useMarketList from './useMarketList'
import { notify } from '../utils/notifications'

const marketAddressSelector = (s) => s.selectedMarket.address
const mangoGroupMarketsSelector = (s) => s.selectedMangoGroup.markets

const useHydrateStore = () => {
  const setMangoStore = useMangoStore((s) => s.set)
  const selectedMarketAddress = useMangoStore(marketAddressSelector)
  const marketsForSelectedMangoGroup = useMangoStore(mangoGroupMarketsSelector)
  const { connection, dexProgramId } = useConnection()
  const { marketList } = useMarketList()

  // load selected market
  useEffect(() => {
    console.log('useEffect loading market', selectedMarketAddress, dexProgramId)
    Market.load(
      connection,
      new PublicKey(selectedMarketAddress),
      {},
      new PublicKey(dexProgramId)
    )
      .then(async (market) => {
        // @ts-ignore
        const bidAcccount = market._decoded.bids
        const bidInfo = await connection.getAccountInfo(bidAcccount)
        // @ts-ignore
        const askAccount = market._decoded.asks
        const askInfo = await connection.getAccountInfo(askAccount)
        setMangoStore((state) => {
          state.market.current = market
          state.accountInfos[askAccount.toString()] = askInfo
          state.accountInfos[bidAcccount.toString()] = bidInfo
        })
      })
      .catch((e) => {
        notify({
          message: 'Error loading market',
          description: e.message,
          type: 'error',
        })
      })
  }, [selectedMarketAddress])

  // load all markets for mangoGroup
  useEffect(() => {
    console.log('loading all markets for mangoGroup')

    Promise.all(
      marketList.map((mkt) => {
        return Market.load(connection, mkt.address, {}, mkt.programId)
      })
    ).then((markets) => {
      setMangoStore((state) => {
        markets.forEach((market) => {
          state.selectedMangoGroup.markets[market.publicKey.toString()] = market
          // @ts-ignore
          const bidAcctAddress = market._decoded.bids.toString()
          if (!(bidAcctAddress in state.accountInfos)) {
            state.accountInfos[bidAcctAddress] = null
          }
          // @ts-ignore
          const askAcctAddress = market._decoded.asks.toString()
          if (!(askAcctAddress in state.accountInfos)) {
            state.accountInfos[askAcctAddress] = null
          }
        })
      })
    })
  }, [marketList])

  // hydrate orderbook for all markets in mango group
  useEffect(() => {
    const subscriptionIds = Object.entries(marketsForSelectedMangoGroup).map(
      ([, market]) => {
        let previousBidInfo: AccountInfo<Buffer> | null = null
        let previousAskInfo: AccountInfo<Buffer> | null = null
        return [
          connection.onAccountChange(
            // @ts-ignore
            market._decoded.bids,
            (info) => {
              if (
                !previousBidInfo ||
                !previousBidInfo.data.equals(info.data) ||
                previousBidInfo.lamports !== info.lamports
              ) {
                previousBidInfo = info
                setMangoStore((state) => {
                  // @ts-ignore
                  const pkString = market._decoded.bids.toString()
                  state.accountInfos[pkString] = previousBidInfo
                })
              }
            }
          ),
          connection.onAccountChange(
            // @ts-ignore
            market._decoded.asks,
            (info) => {
              if (
                !previousAskInfo ||
                !previousAskInfo.data.equals(info.data) ||
                previousAskInfo.lamports !== info.lamports
              ) {
                previousAskInfo = info
                setMangoStore((state) => {
                  // @ts-ignore
                  const pkString = market._decoded.asks.toString()
                  state.accountInfos[pkString] = previousAskInfo
                })
              }
            }
          ),
        ]
      }
    )
    console.log('subscription ids', subscriptionIds)

    return () => {
      for (const id of subscriptionIds.flat()) {
        connection.removeAccountChangeListener(id)
      }
    }
  }, [marketsForSelectedMangoGroup])
}

export default useHydrateStore
