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
import {
  mangoCacheSelector,
  mangoGroupConfigSelector,
  mangoGroupSelector,
  marketsSelector,
} from '../stores/selectors'
import { useEffect } from 'react'
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

  const perpMarketInfo = mangoGroup.perpMarkets[marketConfig.marketIndex]
  const perpAccount = mangoAccount.perpAccounts[marketConfig.marketIndex]

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
    // console.error(e)
  }

  const basePosition = perpMarket?.baseLotsToNumber(perpAccount.basePosition)
  const indexPrice = mangoGroup
    .getPrice(marketConfig.marketIndex, mangoCache)
    .toNumber()
  const notionalSize = Math.abs(basePosition * indexPrice)
  const unrealizedPnl = basePosition * (indexPrice - breakEvenPrice)
  const unsettledPnl = +nativeI80F48ToUi(
    perpAccount.getPnl(
      perpMarketInfo,
      mangoCache.perpMarketCache[marketConfig.marketIndex],
      mangoCache.priceCache[marketConfig.marketIndex].price
    ),
    marketConfig.quoteDecimals
  ).toNumber()

  return {
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
  const setMangoStore = useMangoStore((s) => s.set)
  const { mangoAccount } = useMangoAccount()
  const groupConfig = useMangoStore(mangoGroupConfigSelector)
  const mangoGroup = useMangoStore(mangoGroupSelector)
  const mangoCache = useMangoStore(mangoCacheSelector)
  const allMarkets = useMangoStore(marketsSelector)
  const tradeHistory = useTradeHistory()

  useEffect(() => {
    if (mangoAccount) {
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

      const openPerpPositions = perpAccounts.filter(
        ({ perpAccount }) =>
          perpAccount?.basePosition && !perpAccount.basePosition.eq(new BN(0))
      )

      setMangoStore((state) => {
        state.selectedMangoAccount.perpAccounts = perpAccounts
        state.selectedMangoAccount.openPerpPositions = openPerpPositions
        if (
          openPerpPositions.length !==
          state.selectedMangoAccount.totalOpenPerpPositions
        ) {
          state.selectedMangoAccount.totalOpenPerpPositions =
            openPerpPositions.length
        }
        state.selectedMangoAccount.unsettledPerpPositions = perpAccounts.filter(
          ({ perpAccount, unsettledPnl }) =>
            perpAccount?.basePosition?.eq(new BN(0)) && unsettledPnl != 0
        )
      })
    }
  }, [mangoAccount, mangoCache, tradeHistory])
}

export default usePerpPositions
