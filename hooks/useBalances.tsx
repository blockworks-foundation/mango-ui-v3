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
  const balances = []
  const markets = useAllMarkets()
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const marginAccount = useMangoStore((s) => s.selectedMarginAccount.current)
  const { symbols } = useMarketList()

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
    const nativeQuoteFree =
      (openOrders?.quoteTokenFree || 0) +
      (openOrders?.['referrerRebatesAccrued'].toNumber() || 0)

    const nativeBaseLocked = openOrders
      ? openOrders.baseTokenTotal - openOrders?.baseTokenFree
      : 0
    const nativeQuoteLocked = openOrders
      ? openOrders?.quoteTokenTotal - openOrders?.quoteTokenFree
      : 0

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
          nativeBaseFree,
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
          nativeQuoteFree,
          mangoGroup.mintDecimals[quoteCurrencyIndex]
        ),
        net: net(nativeQuoteLocked, quoteCurrencyIndex),
      },
    ]
    balances.push(marketPair)
  }

  const baseBalances = balances.map((b) => b[0])
  const quoteBalances = balances.map((b) => b[1])
  const quoteMeta = quoteBalances[0]

  let quoteOpenOrders = 0
  quoteBalances.forEach((qb) => (quoteOpenOrders += qb.openOrders))
  let orders = 0
  quoteBalances.forEach((qb) => (orders += qb.orders))
  let unsettled = 0
  quoteBalances.forEach((qb) => (unsettled += qb.unsettled))
  let net = 0
  quoteBalances.forEach((qb) => (net += qb.net))

  return baseBalances.concat([
    {
      market: null,
      key: `${quoteMeta.quoteCurrency}${quoteMeta.quoteCurrency}`,
      coin: quoteMeta.coin,
      marginDeposits: quoteMeta.marginDeposits,
      borrows: quoteMeta.borrows,
      openOrders: quoteOpenOrders,
      orders,
      unsettled,
      net,
    },
  ])
}
