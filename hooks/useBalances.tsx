import { Balances } from '../@types/types'
import {
  getTokenBySymbol,
  nativeI80F48ToUi,
  nativeToUi,
  QUOTE_INDEX,
} from '@blockworks-foundation/mango-client'
import useMangoStore from '../stores/useMangoStore'
import { i80f48ToPercent } from '../utils/index'
import { sumBy } from 'lodash'
import { I80F48 } from '@blockworks-foundation/mango-client'
import useMangoAccount from './useMangoAccount'

export function useBalances(): Balances[] {
  const balances = []
  const { mangoAccount } = useMangoAccount()
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
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

    let nativeBaseFree = 0
    let nativeQuoteFree = 0
    let nativeBaseLocked = 0
    let nativeQuoteLocked = 0
    if (openOrders) {
      nativeBaseFree = openOrders.baseTokenFree.toNumber()
      nativeQuoteFree = openOrders.quoteTokenFree
        .add(openOrders['referrerRebatesAccrued'])
        .toNumber()
      nativeBaseLocked = openOrders.baseTokenTotal
        .sub(openOrders.baseTokenFree)
        .toNumber()
      nativeQuoteLocked = openOrders.quoteTokenTotal
        .sub(openOrders.quoteTokenFree)
        .toNumber()
    }

    const tokenIndex = marketIndex

    const net = (nativeBaseLocked, tokenIndex) => {
      const amount = mangoAccount
        .getUiDeposit(
          mangoCache.rootBankCache[tokenIndex],
          mangoGroup,
          tokenIndex
        )
        .add(
          nativeI80F48ToUi(
            I80F48.fromNumber(nativeBaseLocked),
            mangoGroup.tokens[tokenIndex].decimals
          ).sub(
            mangoAccount.getUiBorrow(
              mangoCache.rootBankCache[tokenIndex],
              mangoGroup,
              tokenIndex
            )
          )
        )

      return amount
    }

    const value = (nativeBaseLocked, tokenIndex) => {
      const amount = mangoGroup
        .getPrice(tokenIndex, mangoCache)
        .mul(net(nativeBaseLocked, tokenIndex))

      return amount
    }

    const marketPair = [
      {
        market: null,
        key: `${baseSymbol}${name}`,
        symbol: baseSymbol,
        deposits: mangoAccount.getUiDeposit(
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
        value: value(nativeBaseLocked, tokenIndex),
        depositRate: i80f48ToPercent(mangoGroup.getDepositRate(tokenIndex)),
        borrowRate: i80f48ToPercent(mangoGroup.getBorrowRate(tokenIndex)),
        decimals: mangoGroup.tokens[tokenIndex].decimals,
      },
      {
        market: null,
        key: `${name}`,
        symbol: mangoGroupConfig.quoteSymbol,
        deposits: mangoAccount.getUiDeposit(
          mangoCache.rootBankCache[quoteCurrencyIndex],
          mangoGroup,
          quoteCurrencyIndex
        ),
        borrows: mangoAccount.getUiBorrow(
          mangoCache.rootBankCache[quoteCurrencyIndex],
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
        value: value(nativeQuoteLocked, quoteCurrencyIndex),
        depositRate: i80f48ToPercent(mangoGroup.getDepositRate(tokenIndex)),
        borrowRate: i80f48ToPercent(mangoGroup.getBorrowRate(tokenIndex)),
        decimals: mangoGroup.tokens[quoteCurrencyIndex].decimals,
      },
    ]
    balances.push(marketPair)
  }

  const baseBalances = balances.map((b) => b[0])
  const quoteBalances = balances.map((b) => b[1])
  const quoteMeta = quoteBalances[0]
  const quoteInOrders = sumBy(quoteBalances, 'orders')
  const unsettled = sumBy(quoteBalances, 'unsettled')

  const net: I80F48 = quoteMeta.deposits
    .add(I80F48.fromNumber(unsettled))
    .sub(quoteMeta.borrows)
    .add(I80F48.fromNumber(quoteInOrders))

  const token = getTokenBySymbol(mangoGroupConfig, quoteMeta.symbol)
  const tokenIndex = mangoGroup.getTokenIndex(token.mintKey)

  const value = net.mul(mangoGroup.getPrice(tokenIndex, mangoCache))

  const depositRate = i80f48ToPercent(mangoGroup.getDepositRate(tokenIndex))

  const borrowRate = i80f48ToPercent(mangoGroup.getBorrowRate(tokenIndex))

  return [
    {
      market: null,
      key: `${quoteMeta.symbol}${quoteMeta.symbol}`,
      symbol: quoteMeta.symbol,
      deposits: quoteMeta.deposits,
      borrows: quoteMeta.borrows,
      orders: quoteInOrders,
      unsettled,
      net,
      value,
      depositRate,
      borrowRate,
      decimals: mangoGroup.tokens[QUOTE_INDEX].decimals,
    },
  ].concat(baseBalances)
}
