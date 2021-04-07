import useMarket from './useMarket'
import { Balances } from '../@types/types'
import { nativeToUi } from '@blockworks-foundation/mango-client'
import useMarketList from './useMarketList'
import useMangoStore from '../stores/useMangoStore'

export function useBalances(): Balances[] {
  const { baseCurrency, quoteCurrency, market } = useMarket()
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const marginAccount = useMangoStore((s) => s.selectedMarginAccount.current)
  const { symbols } = useMarketList()

  if (!marginAccount || !mangoGroup || !market) {
    return []
  }

  const marketIndex = mangoGroup.getMarketIndex(market)
  const openOrders: any = marginAccount.openOrdersAccounts[marketIndex]
  const baseCurrencyIndex = Object.entries(symbols).findIndex(
    (x) => x[0] === baseCurrency
  )
  const quoteCurrencyIndex = Object.entries(symbols).findIndex(
    (x) => x[0] === quoteCurrency
  )

  if (
    baseCurrency === 'UNKNOWN' ||
    quoteCurrency === 'UNKNOWN' ||
    !baseCurrency ||
    !quoteCurrency
  ) {
    return []
  }

  const nativeBaseFree = openOrders?.baseTokenFree || 0
  const nativeQuoteFree = openOrders?.quoteTokenFree || 0

  const nativeBaseLocked = openOrders
    ? openOrders.baseTokenTotal - nativeBaseFree
    : 0
  const nativeQuoteLocked = openOrders
    ? openOrders?.quoteTokenTotal - nativeQuoteFree
    : 0

  const nativeBaseUnsettled = openOrders?.baseTokenFree || 0
  const nativeQuoteUnsettled = openOrders?.quoteTokenFree || 0
  const tokenIndex = marketIndex

  const net = (borrows, currencyIndex) => {
    return (
      marginAccount.getNativeDeposit(mangoGroup, currencyIndex) +
      borrows -
      marginAccount.getNativeBorrow(mangoGroup, currencyIndex)
    )
  }

  return [
    {
      market,
      key: `${baseCurrency}${quoteCurrency}${baseCurrency}`,
      coin: baseCurrency,
      marginDeposits:
        mangoGroup && marginAccount
          ? marginAccount.getUiDeposit(mangoGroup, baseCurrencyIndex)
          : null,
      borrows: marginAccount.getUiBorrow(mangoGroup, baseCurrencyIndex),
      orders: nativeToUi(nativeBaseLocked, mangoGroup.mintDecimals[tokenIndex]),
      openOrders,
      unsettled: nativeToUi(
        nativeBaseUnsettled,
        mangoGroup.mintDecimals[tokenIndex]
      ),
      net: nativeToUi(
        net(nativeBaseLocked, tokenIndex),
        mangoGroup.mintDecimals[tokenIndex]
      ),
    },
    {
      market,
      key: `${quoteCurrency}${baseCurrency}${quoteCurrency}`,
      coin: quoteCurrency,
      marginDeposits:
        mangoGroup && marginAccount
          ? marginAccount.getUiDeposit(mangoGroup, quoteCurrencyIndex)
          : null,
      borrows: marginAccount.getUiBorrow(mangoGroup, quoteCurrencyIndex),
      openOrders,
      orders: nativeToUi(
        nativeQuoteLocked,
        mangoGroup.mintDecimals[quoteCurrencyIndex]
      ),
      unsettled: nativeToUi(
        nativeQuoteUnsettled,
        mangoGroup.mintDecimals[quoteCurrencyIndex]
      ),
      net: nativeToUi(
        net(nativeQuoteLocked, quoteCurrencyIndex),
        mangoGroup.mintDecimals[quoteCurrencyIndex]
      ),
    },
  ]
}
