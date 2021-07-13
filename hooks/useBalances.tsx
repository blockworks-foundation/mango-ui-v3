import { Balances } from '../@types/types'
import { nativeToUi } from '@blockworks-foundation/mango-client'
import useMangoStore from '../stores/useMangoStore'
import { sumBy } from 'lodash'
import { QUOTE_INDEX } from '@blockworks-foundation/mango-client/lib/src/MangoGroup'
import { I80F48 } from '@blockworks-foundation/mango-client/lib/src/fixednum'

export function useBalances(): Balances[] {
  const balances = []
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const mangoGroupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)

  for (const {
    marketIndex,
    baseSymbol,
    name,
  } of mangoGroupConfig.spotMarkets) {
    if (!mangoAccount || !mangoGroup) {
      return []
    }

    const openOrders: any = mangoAccount.spotOpenOrdersAccounts[marketIndex]
    const quoteCurrencyIndex = QUOTE_INDEX

    const nativeBaseFree = openOrders?.baseTokenFree || 0
    const nativeQuoteFree =
      (openOrders?.quoteTokenFree || 0) +
      (openOrders?.['referrerRebatesAccrued'].toNumber() || 0)

    const nativeBaseLocked = openOrders
      ? openOrders.baseTokenTotal - openOrders?.baseTokenFree
      : 0
    const nativeQuoteLocked = openOrders
      ? openOrders?.quoteTokenTotal - (openOrders?.quoteTokenFree || 0)
      : 0

    const tokenIndex = marketIndex

    const net = (nativeBaseLocked, tokenIndex) => {
      const amount = mangoAccount
        .getUiDeposit(
          mangoCache.rootBankCache[tokenIndex],
          mangoGroup,
          tokenIndex
        )
        .add(
          I80F48.fromNumber(nativeBaseLocked).sub(
            mangoAccount.getUiBorrow(
              mangoCache.rootBankCache[tokenIndex],
              mangoGroup,
              tokenIndex
            )
          )
        )

      return amount
    }

    const marketPair = [
      {
        market: null,
        key: `${baseSymbol}${name}`,
        symbol: baseSymbol,
        marginDeposits: mangoAccount.getUiDeposit(
          mangoCache.rootBankCache[tokenIndex],
          mangoGroup,
          tokenIndex
        ),
        borrows: mangoAccount.getUiBorrow(
          mangoCache.rootBankCache[tokenIndex],
          mangoGroup,
          tokenIndex
        ),
        orders: nativeToUi(
          nativeBaseLocked,
          mangoGroup.tokens[tokenIndex].decimals
        ),
        unsettled: nativeToUi(
          nativeBaseFree,
          mangoGroup.tokens[tokenIndex].decimals
        ),
        net: net(nativeBaseLocked, tokenIndex),
      },
      {
        market: null,
        key: `${name}`,
        symbol: mangoGroupConfig.quoteSymbol,
        marginDeposits: mangoAccount.getUiDeposit(
          mangoCache.rootBankCache[quoteCurrencyIndex],
          mangoGroup,
          quoteCurrencyIndex
        ),
        borrows: mangoAccount.getUiBorrow(
          mangoCache.rootBankCache[tokenIndex],
          mangoGroup,
          quoteCurrencyIndex
        ),
        orders: nativeToUi(
          nativeQuoteLocked,
          mangoGroup.tokens[quoteCurrencyIndex].decimals
        ),
        unsettled: nativeToUi(
          nativeQuoteFree,
          mangoGroup.tokens[quoteCurrencyIndex].decimals
        ),
        net: net(nativeQuoteLocked, quoteCurrencyIndex),
      },
    ]
    balances.push(marketPair)
  }

  const baseBalances = balances.map((b) => b[0])
  const quoteBalances = balances.map((b) => b[1])
  const quoteMeta = quoteBalances[0]
  const quoteInOrders = sumBy(quoteBalances, 'orders')
  const unsettled = sumBy(quoteBalances, 'unsettled')

  const net: I80F48 = quoteMeta.marginDeposits
    .add(I80F48.fromNumber(unsettled))
    .sub(quoteMeta.borrows)
    .sub(I80F48.fromNumber(quoteInOrders))

  return baseBalances.concat([
    {
      market: null,
      key: `${quoteMeta.symbol}${quoteMeta.symbol}`,
      symbol: quoteMeta.symbol,
      marginDeposits: quoteMeta.marginDeposits,
      borrows: quoteMeta.borrows,
      orders: quoteInOrders,
      unsettled,
      net,
    },
  ])
}
