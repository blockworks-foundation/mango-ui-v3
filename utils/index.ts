import { I80F48 } from '@blockworks-foundation/mango-client/lib/src/fixednum'
import { TOKEN_MINTS } from '@project-serum/serum'
import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import { Orderbook } from '../stores/useMangoStore'

export async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const percentFormat = new Intl.NumberFormat(undefined, {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

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

export function calculateTradePrice(
  tradeType: string,
  orderBook: Orderbook,
  baseSize: number,
  side: 'buy' | 'sell',
  price: string | number
): number {
  if (tradeType === 'Market') {
    return calculateMarketPrice(orderBook, baseSize, side)
  }
  return Number(price)
}

export const calculateMarketPrice = (
  orderBook: Orderbook,
  size: number,
  side: 'buy' | 'sell'
): number => {
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

  if (!selectedOrder) {
    console.error('Orderbook empty no market price available')
    return
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
  MNGO: 2,
  SOL: 2,
  SRM: 2,
  USDC: 2,
  USDT: 2,
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

export const usdFormatter = (value, decimals = 2, currency = true) => {
  if (decimals === 0) {
    value = Math.abs(value)
  }
  const config = currency ? { style: 'currency', currency: 'USD' } : {}
  return new Intl.NumberFormat('en-US', {
    ...config,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export const formatUsdValue = (value) => {
  const precision =
    value >= 1 || value <= -1
      ? 2
      : value === 0 ||
        (value > 0 && value < 0.001) ||
        (value < 0 && value > -0.001)
      ? 0
      : 4
  return usdFormatter(value, precision)
}

export const countLeadingZeros = (x) => {
  if (x % 1 == 0) {
    return 0
  } else {
    return -1 - Math.floor(Math.log10(x % 1))
  }
}

export function getBrowserVisibilityProp() {
  if (typeof document.hidden !== 'undefined') {
    // Opera 12.10 and Firefox 18 and later support
    return 'visibilitychange'
    // @ts-ignore
  } else if (typeof document.msHidden !== 'undefined') {
    return 'msvisibilitychange'
    // @ts-ignore
  } else if (typeof document.webkitHidden !== 'undefined') {
    return 'webkitvisibilitychange'
  }
}

export function getBrowserDocumentHiddenProp() {
  if (typeof document.hidden !== 'undefined') {
    return 'hidden'
    // @ts-ignore
  } else if (typeof document.msHidden !== 'undefined') {
    return 'msHidden'
    // @ts-ignore
  } else if (typeof document.webkitHidden !== 'undefined') {
    return 'webkitHidden'
  }
}

export function getIsDocumentHidden() {
  return !document[getBrowserDocumentHiddenProp()]
}

export const numberCompactFormatter = Intl.NumberFormat('en', {
  notation: 'compact',
})
