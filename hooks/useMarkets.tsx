import { useEffect, useMemo } from 'react'
import useConnection from './useConnection'
import { PublicKey } from '@solana/web3.js'
import { Market } from '@project-serum/serum'
import useMangoStore from '../stores/useMangoStore'
import { IDS } from '@blockworks-foundation/mango-client'

const formatTokenMints = (symbols: { [name: string]: string }) => {
  return Object.entries(symbols).map(([name, address]) => {
    return {
      address: new PublicKey(address),
      name: name,
    }
  })
}

const useMarkets = () => {
  const setMangoStore = useMangoStore((state) => state.set)
  const mangoGroupName = useMangoStore((state) => state.selectedMangoGroup.name)
  const market = useMangoStore((state) => state.market.current)
  const { connection, cluster, programId, dexProgramId } = useConnection()

  const spotMarkets = useMemo(
    () => IDS[cluster]?.mango_groups[mangoGroupName]?.spot_market_symbols || {},
    [cluster, mangoGroupName]
  )

  const marketList = useMemo(
    () =>
      Object.entries(spotMarkets).map(([name, address]) => {
        return {
          address: new PublicKey(address as string),
          programId: new PublicKey(dexProgramId as string),
          deprecated: false,
          name,
        }
      }),
    [spotMarkets]
  )

  useEffect(() => {
    if (market) return

    console.log('loading market', connection)
    Market.load(connection, marketList[0].address, {}, marketList[0].programId)
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
  }, [])

  const TOKEN_MINTS = useMemo(() => formatTokenMints(IDS[cluster].symbols), [
    cluster,
  ])

  const baseCurrency = useMemo(
    () =>
      (market?.baseMintAddress &&
        TOKEN_MINTS.find((token) =>
          token.address.equals(market.baseMintAddress)
        )?.name) ||
      'UNKNOWN',
    [market, TOKEN_MINTS]
  )

  const quoteCurrency = useMemo(
    () =>
      (market?.quoteMintAddress &&
        TOKEN_MINTS.find((token) =>
          token.address.equals(market.quoteMintAddress)
        )?.name) ||
      'UNKNOWN',
    [market, TOKEN_MINTS]
  )

  return { market, programId, marketList, baseCurrency, quoteCurrency }
}

export default useMarkets
