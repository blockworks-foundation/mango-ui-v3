import useMangoStore from '../stores/useMangoStore'
import BN from 'bn.js'
import {
  MangoAccount,
  MangoCache,
  MangoGroup,
  nativeI80F48ToUi,
  PerpMarket,
  PerpMarketConfig,
} from '@blockworks-foundation/mango-client'
import useTradeHistory from './useTradeHistory'
import useMangoAccount from './useMangoAccount'

export const collectPerpPosition = (
  mangoAccount: MangoAccount,
  mangoGroup: MangoGroup,
  mangoCache: MangoCache,
  marketConfig: PerpMarketConfig,
  perpMarket: PerpMarket,
  tradeHistory: any
) => {
  if (
    !mangoAccount ||
    !mangoGroup ||
    !mangoCache ||
    !perpMarket ||
    !tradeHistory
  )
    return {}

  const marketIndex = marketConfig.marketIndex
  const perpMarketInfo = mangoGroup.perpMarkets[marketIndex]
  const perpAccount = mangoAccount.perpAccounts[marketIndex]

  let avgEntryPrice = 0,
    breakEvenPrice = 0
  try {
    const perpTradeHistory = tradeHistory.filter(
      (t) => t.marketName === marketConfig.name
    )

    avgEntryPrice = perpAccount
      .getAverageOpenPrice(mangoAccount, perpMarket, perpTradeHistory)
      .toNumber()
    breakEvenPrice = perpAccount
      .getBreakEvenPrice(mangoAccount, perpMarket, perpTradeHistory)
      .toNumber()
  } catch (e) {
    console.error(e)
  }

  const basePosition = perpMarket.baseLotsToNumber(perpAccount.basePosition)
  const indexPrice = mangoGroup.getPrice(marketIndex, mangoCache).toNumber()
  const notionalSize = Math.abs(basePosition * indexPrice)
  const unrealizedPnl = basePosition * (indexPrice - breakEvenPrice)
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
    perpAccount,
    basePosition,
    indexPrice,
    avgEntryPrice,
    breakEvenPrice,
    notionalSize,
    unrealizedPnl,
    unsettledPnl,
  }
}

const usePerpPositions = () => {
  const { mangoAccount } = useMangoAccount()
  const groupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const allMarkets = useMangoStore((s) => s.selectedMangoGroup.markets)
  const tradeHistory = useTradeHistory()

  const perpAccounts = mangoAccount
    ? groupConfig.perpMarkets.map((m) =>
        collectPerpPosition(
          mangoAccount,
          mangoGroup,
          mangoCache,
          m,
          allMarkets[m.publicKey.toBase58()] as PerpMarket,
          tradeHistory
        )
      )
    : []

  const openPositions = perpAccounts.filter(
    ({ perpAccount }) => !perpAccount.basePosition.eq(new BN(0))
  )
  const unsettledPositions = perpAccounts.filter(
    ({ perpAccount, unsettledPnl }) =>
      perpAccount.basePosition.eq(new BN(0)) && unsettledPnl != 0
  )

  return { openPositions, unsettledPositions }
}

export default usePerpPositions
