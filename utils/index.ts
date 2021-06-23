import {
  getMultipleAccounts,
  GroupConfig,
} from '@blockworks-foundation/mango-client'
import { I80F48 } from '@blockworks-foundation/mango-client/lib/src/fixednum'
import { Market, TOKEN_MINTS } from '@project-serum/serum'
import { AccountInfo, PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import { DEFAULT_CONNECTION, Orderbook } from '../stores/useMangoStore'

export function isValidPublicKey(key) {
  if (!key) {
    return false
  }
  try {
    new PublicKey(key)
    return true
  } catch {
    return false
  }
}

export async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const percentFormat = new Intl.NumberFormat(undefined, {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function displayDepositsForMangoAccount(
  mangoAccount,
  mangoGroup,
  tokenIndex
) {
  const deposit = mangoAccount.getUiDeposit(mangoGroup, tokenIndex)
  const decimals = mangoGroup.mintDecimals[tokenIndex]
  return floorToDecimal(deposit, decimals)
}

export function displayBorrowsForMangoAccount(
  mangoAccount,
  mangoGroup,
  tokenIndex
) {
  const borrow = mangoAccount.getUiBorrow(mangoGroup, tokenIndex)
  const decimals = mangoGroup.mintDecimals[tokenIndex]
  return ceilToDecimal(borrow, decimals)
}

export function floorToDecimal(
  value: number,
  decimals: number | undefined | null
) {
  return decimals
    ? Math.floor(value * 10 ** decimals) / 10 ** decimals
    : Math.floor(value)
}

export function ceilToDecimal(
  value: number,
  decimals: number | undefined | null
) {
  return decimals
    ? Math.ceil(value * 10 ** decimals) / 10 ** decimals
    : Math.ceil(value)
}

export function roundToDecimal(
  value: number,
  decimals: number | undefined | null
) {
  return decimals ? Math.round(value * 10 ** decimals) / 10 ** decimals : value
}

export function getDecimalCount(value): number {
  if (
    !isNaN(value) &&
    Math.floor(value) !== value &&
    value.toString().includes('.')
  )
    return value.toString().split('.')[1].length || 0
  if (
    !isNaN(value) &&
    Math.floor(value) !== value &&
    value.toString().includes('e')
  )
    return parseInt(value.toString().split('e-')[1] || '0')
  return 0
}

export function divideBnToNumber(numerator: BN, denominator: BN): number {
  const quotient = numerator.div(denominator).toNumber()
  const rem = numerator.umod(denominator)
  const gcd = rem.gcd(denominator)
  return quotient + rem.div(gcd).toNumber() / denominator.div(gcd).toNumber()
}

export const formatBalanceDisplay = (balance, fixedDecimals) => {
  // Get the decimal part
  const dPart = balance - Math.trunc(balance)
  return (
    Math.trunc(balance) +
    Math.floor(dPart * Math.pow(10, fixedDecimals)) /
      Math.pow(10, fixedDecimals)
  )
}

export function getTokenMultiplierFromDecimals(decimals: number): BN {
  return new BN(10).pow(new BN(decimals))
}

export function abbreviateAddress(address: PublicKey, size = 5) {
  const base58 = address.toBase58()
  return base58.slice(0, size) + '…' + base58.slice(-size)
}

export function isEqual(obj1, obj2, keys) {
  if (!keys && Object.keys(obj1).length !== Object.keys(obj2).length) {
    return false
  }
  keys = keys || Object.keys(obj1)
  for (const k of keys) {
    if (obj1[k] !== obj2[k]) {
      // shallow comparison
      return false
    }
  }
  return true
}

export function groupBy(list, keyGetter) {
  const map = new Map()
  list.forEach((item) => {
    const key = keyGetter(item)
    const collection = map.get(key)
    if (!collection) {
      map.set(key, [item])
    } else {
      collection.push(item)
    }
  })
  return map
}

export function isDefined<T>(argument: T | undefined): argument is T {
  return argument !== undefined
}

export const calculateMarketPrice = (
  orderBook: Orderbook,
  size: number,
  side: 'buy' | 'sell'
) => {
  const orders = side === 'buy' ? orderBook.asks : orderBook.bids
  let acc = 0
  let selectedOrder
  for (const order of orders) {
    acc += order[1]
    if (acc >= size) {
      selectedOrder = order
      break
    }
  }

  if (side === 'buy') {
    return selectedOrder[0] * 1.05
  } else {
    return selectedOrder[0] * 0.95
  }
}

// Precision for our mango group token
export const tokenPrecision = {
  BTC: 4,
  ETH: 3,
  SOL: 2,
  SRM: 2,
  USDC: 2,
  USDT: 2,
  WUSDT: 2,
}

// Precision for depositing/withdrawing
export const DECIMALS = {
  BTC: 5,
  ETH: 4,
  SOL: 2,
  SRM: 2,
  USDC: 2,
  USDT: 2,
  WUSDT: 2,
}

export const getSymbolForTokenMintAddress = (address: string): string => {
  if (address && address.length) {
    return TOKEN_MINTS.find((m) => m.address.toString() === address)?.name || ''
  } else {
    return ''
  }
}

export const capitalize = (s) => {
  if (typeof s !== 'string') return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function* chunks(arr, n) {
  for (let i = 0; i < arr.length; i += n) {
    yield arr.slice(i, i + n)
  }
}

export function zipDict<K extends string | number | symbol, V>(
  keys: K[],
  values: V[]
) {
  const result: Partial<Record<K, V>> = {}
  keys.forEach((key, index) => {
    result[key] = values[index]
  })
  return result
}

export const copyToClipboard = (copyThis) => {
  const el = document.createElement('textarea')
  el.value = copyThis.toString()
  document.body.appendChild(el)
  el.select()
  document.execCommand('copy')
  document.body.removeChild(el)
}

// Truncate decimals without rounding
export const trimDecimals = (n, digits) => {
  const step = Math.pow(10, digits || 0)
  const temp = Math.trunc(step * n)

  return temp / step
}

export const i80f48ToPercent = (value: I80F48) =>
  value.mul(I80F48.fromNumber(100))

export async function decodeAndLoadMarkets(
  groupConfig: GroupConfig,
  marketAccountInfos
): Promise<{ [marketPk: string]: Market }> {
  const markets = {}

  for (let i = 0; i < marketAccountInfos.length; i++) {
    const { publicKey, accountInfo } = marketAccountInfos[i]
    const decodedAcc = await Market.getLayout(
      groupConfig.serumProgramId
    ).decode(accountInfo.data)

    const baseToken = groupConfig.tokens.find((token) =>
      token.mintKey.equals(decodedAcc.baseMint)
    )
    const quoteToken = groupConfig.tokens.find((token) =>
      token.mintKey.equals(decodedAcc.quoteMint)
    )

    const baseMintDecimals = baseToken.decimals
    const quoteMintDecimals = quoteToken.decimals
    markets[publicKey] = new Market(
      decodedAcc,
      baseMintDecimals,
      quoteMintDecimals,
      {},
      groupConfig.serumProgramId
    )
  }

  return markets
}

export async function getOrderBookAccountInfos(
  serumProgramId,
  spotMarketAccountInfos: AccountInfo<Buffer>[]
): Promise<
  {
    publicKey: PublicKey
    accountInfo: AccountInfo<Buffer>
  }[]
> {
  const decodedMarkets = spotMarketAccountInfos.map((accountInfo) =>
    Market.getLayout(serumProgramId).decode(accountInfo.data)
  )

  const orderBookPks = []
  decodedMarkets.forEach((mkt) => {
    orderBookPks.push(mkt.bids)
    orderBookPks.push(mkt.asks)
  })

  return await getMultipleAccounts(DEFAULT_CONNECTION, orderBookPks)
}
