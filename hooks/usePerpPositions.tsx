import useMangoStore from '../stores/useMangoStore'
import BN from 'bn.js'
import {
  getMarketByPublicKey,
  nativeI80F48ToUi,
  PerpMarket,
} from '@blockworks-foundation/mango-client'
import useTradeHistory from './useTradeHistory'

const usePerpPositions = () => {
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const groupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const allMarkets = useMangoStore((s) => s.selectedMangoGroup.markets)
  const tradeHistory = useTradeHistory()

  const perpAccounts = mangoAccount
    ? groupConfig.perpMarkets.map((m) => {
        const marketIndex = m.marketIndex
        const perpMarketInfo = mangoGroup.perpMarkets[marketIndex]
        const marketConfig = getMarketByPublicKey(
          groupConfig,
          perpMarketInfo.perpMarket
        )

        const perpMarket = allMarkets[
          perpMarketInfo.perpMarket.toString()
        ] as PerpMarket
        const perpTradeHistory = tradeHistory.filter(
          (t) => t.marketName === marketConfig.name
        )

        const perpAccount = mangoAccount.perpAccounts[marketIndex]

        let avgEntryPrice, breakEvenPrice
        try {
          avgEntryPrice = perpAccount
            .getAverageOpenPrice(mangoAccount, perpMarket, perpTradeHistory)
            .toNumber()
        } catch (e) {
          console.error(e)
        }
        try {
          breakEvenPrice = perpAccount
            .getBreakEvenPrice(mangoAccount, perpMarket, perpTradeHistory)
            .toNumber()
        } catch (e) {
          console.error(e)
        }

        const basePosition = perpMarket.baseLotsToNumber(
          perpAccount.basePosition
        )
        const unrealizedPnl =
          basePosition *
          (mangoGroup.getPrice(marketIndex, mangoCache).toNumber() -
            parseFloat(breakEvenPrice))

        const unsettledPnl = +nativeI80F48ToUi(
          perpAccount.getPnl(
            mangoGroup.perpMarkets[marketIndex],
            mangoCache.perpMarketCache[marketIndex],
            mangoCache.priceCache[marketIndex].price
          ),
          marketConfig.quoteDecimals
        ).toNumber()

        return {
          marketIndex,
          perpMarketInfo,
          marketConfig,
          perpMarket,
          perpTradeHistory,
          perpAccount,
          basePosition,
          avgEntryPrice,
          breakEvenPrice,
          unrealizedPnl,
          unsettledPnl,
        }
      })
    : []

  const openPositions = perpAccounts.filter(
    ({ perpAccount }) => !perpAccount.basePosition.eq(new BN(0))
  )
  const unsettledPositions = perpAccounts.filter(
    ({ unsettledPnl }) => unsettledPnl != 0
  )

  return { openPositions, unsettledPositions }
}

export default usePerpPositions
