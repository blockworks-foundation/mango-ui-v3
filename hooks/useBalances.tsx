import { Balances } from '../@types/types'
import { nativeToUi } from '@blockworks-foundation/mango-client'
import useMarketList from './useMarketList'
import useMangoStore from '../stores/useMangoStore'
import {
  displayBorrowsForMarginAccount,
  displayDepositsForMarginAccount,
  floorToDecimal,
} from '../utils'
import useAllMarkets from './useAllMarkets'

export function useBalances(): Balances[] {
  let balances = []
  const markets = useAllMarkets()
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const marginAccount = useMangoStore((s) => s.selectedMarginAccount.current)
  const { symbols } = useMarketList()

  let nativeQuoteFree = 0
  let nativeQuoteLocked = 0
  let nativeQuoteUnsettled = 0

  for (const { market, baseCurrency, quoteCurrency } of markets) {
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
    nativeQuoteFree += openOrders?.quoteTokenFree || 0

    const nativeBaseLocked = openOrders
      ? openOrders.baseTokenTotal - nativeBaseFree
      : 0
    nativeQuoteLocked += openOrders
      ? openOrders?.quoteTokenTotal - nativeQuoteFree
      : 0

    const nativeBaseUnsettled = openOrders?.baseTokenFree || 0
    nativeQuoteUnsettled += openOrders?.quoteTokenFree || 0

    const tokenIndex = marketIndex

    const net = (borrows, currencyIndex) => {
      const amount =
        marginAccount.getNativeDeposit(mangoGroup, currencyIndex) +
        borrows -
        marginAccount.getNativeBorrow(mangoGroup, currencyIndex)

      return floorToDecimal(
        nativeToUi(amount, mangoGroup.mintDecimals[currencyIndex]),
        mangoGroup.mintDecimals[currencyIndex]
      )
    }

    const marketPair = [
      {
        market,
        key: `${baseCurrency}${quoteCurrency}${baseCurrency}`,
        coin: baseCurrency,
        marginDeposits: displayDepositsForMarginAccount(
          marginAccount,
          mangoGroup,
          baseCurrencyIndex
        ),
        borrows: displayBorrowsForMarginAccount(
          marginAccount,
          mangoGroup,
          baseCurrencyIndex
        ),
        orders: nativeToUi(
          nativeBaseLocked,
          mangoGroup.mintDecimals[tokenIndex]
        ),
        openOrders,
        unsettled: nativeToUi(
          nativeBaseUnsettled,
          mangoGroup.mintDecimals[tokenIndex]
        ),
        net: net(nativeBaseLocked, tokenIndex),
      },
      {
        market,
        key: `${quoteCurrency}${baseCurrency}${quoteCurrency}`,
        coin: quoteCurrency,
        marginDeposits: displayDepositsForMarginAccount(
          marginAccount,
          mangoGroup,
          quoteCurrencyIndex
        ),
        borrows: displayBorrowsForMarginAccount(
          marginAccount,
          mangoGroup,
          quoteCurrencyIndex
        ),
        openOrders,
        orders: nativeToUi(
          nativeQuoteLocked,
          mangoGroup.mintDecimals[quoteCurrencyIndex]
        ),
        unsettled: nativeToUi(
          nativeQuoteUnsettled,
          mangoGroup.mintDecimals[quoteCurrencyIndex]
        ),
        net: net(nativeQuoteLocked, quoteCurrencyIndex),
      },
    ]
    balances = balances.concat(marketPair)
  }

  balances.sort((a, b) => (a.coin > b.coin ? 1 : -1))

  balances = balances.filter((elem, index, self) => {
    return index === self.map((a) => a.coin).indexOf(elem.coin)
  })

  return balances
}
