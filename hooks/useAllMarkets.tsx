import useConnection from './useConnection'
import { IDS } from '@blockworks-foundation/mango-client'
import useMangoStore from '../stores/useMangoStore'
import { formatTokenMints } from './useMarket'

const useAllMarkets = () => {
  const markets = useMangoStore((s) => s.selectedMangoGroup.markets)
  const { cluster, programId } = useConnection()
  const TOKEN_MINTS = formatTokenMints(IDS[cluster].symbols)

  return Object.keys(markets).map(function (marketIndex) {
    const market = markets[marketIndex]
    const marketAddress = market ? market.publicKey.toString() : null

    const baseCurrency =
      (market?.baseMintAddress &&
        TOKEN_MINTS.find((token) =>
          token.address.equals(market.baseMintAddress)
        )?.name) ||
      '...'

    const quoteCurrency =
      (market?.quoteMintAddress &&
        TOKEN_MINTS.find((token) =>
          token.address.equals(market.quoteMintAddress)
        )?.name) ||
      '...'

    return {
      market,
      marketAddress,
      programId,
      baseCurrency,
      quoteCurrency,
    }
  })
}

export default useAllMarkets
