import { useEffect } from 'react'
import useConnection from './useConnection'
import { PublicKey } from '@solana/web3.js'
import { Market } from '@project-serum/serum'
import useStore from './useStore'
import { IDS } from '@blockworks-foundation/mango-client'

const useMarkets = () => {
  const defaultMangoGroup = useStore((state) => state.defaultMangoGroup)
  const marketStore = useStore((state) => state.market)
  const { connection, cluster, programId, dexProgramId } = useConnection()

  const spotMarkets =
    IDS[cluster]?.mango_groups[defaultMangoGroup]?.spot_market_symbols || {}

  const marketList = Object.entries(spotMarkets).map(([name, address]) => {
    return {
      address: new PublicKey(address as string),
      programId: new PublicKey(dexProgramId as string),
      deprecated: false,
      name,
    }
  })

  // TODO
  const defaultMarket = marketList[0]

  useEffect(() => {
    Market.load(connection, defaultMarket.address, {}, defaultMarket.programId)
      .then((market) => {
        console.log('market loaded', market)
        marketStore.setMarket(market)
      })
      .catch(
        (e) => {
          console.log('failed to load market', e)
        }
        // TODO
        // notify({
        //   message: 'Error loading market',
        //   description: e.message,
        //   type: 'error',
        // }),
      )
  }, [connection])

  console.log('rerendering useMarkets hook', marketStore.market)

  return { market: marketStore.market, programId, marketList }
}

export default useMarkets
