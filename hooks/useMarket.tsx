import { useMemo } from 'react'
import useConnection from './useConnection'
import { PublicKey } from '@solana/web3.js'
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

const useMarket = () => {
  const market = useMangoStore((state) => state.market.current)
  const selectedMarket = useMangoStore((state) => state.selectedMarket)
  const { cluster, programId } = useConnection()

  const marketAddress = useMemo(
    () => (market ? market.publicKey.toString() : null),
    [market]
  )

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

  return {
    market,
    marketAddress,
    programId,
    marketName: selectedMarket.name,
    baseCurrency,
    quoteCurrency,
  }
}

export default useMarket
