import { useEffect } from 'react'
import { Market } from '@project-serum/serum'
import useConnection from './useConnection'
import useMangoStore from '../stores/useMangoStore'
import { PublicKey } from '@solana/web3.js'

const useHydrateStore = () => {
  const setMangoStore = useMangoStore((s) => s.set)
  const selectedMarket = useMangoStore((s) => s.selectedMarket)
  const { connection, dexProgramId } = useConnection()

  useEffect(() => {
    console.log(
      'useEffect loading market',
      selectedMarket.address,
      dexProgramId
    )
    Market.load(
      connection,
      new PublicKey(selectedMarket.address),
      {},
      new PublicKey(dexProgramId)
    )
      .then((market) => {
        setMangoStore((state) => {
          state.market.current = market
          // @ts-ignore
          state.accountInfos[market._decoded.bids.toString()] = null
          // @ts-ignore
          state.accountInfos[market._decoded.asks.toString()] = null
        })
      })
      .catch(
        (e) => {
          console.error('failed to load market', e)
        }
        // TODO
        // notify({
        //   message: 'Error loading market',
        //   description: e.message,
        //   type: 'error',
        // }),
      )
  }, [selectedMarket])

  return null
}

export default useHydrateStore
