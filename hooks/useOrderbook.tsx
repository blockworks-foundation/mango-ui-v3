import { useEffect, useRef } from 'react'
import tuple from 'immutable-tuple'
import { PublicKey, AccountInfo } from '@solana/web3.js'
import { Orderbook } from '@project-serum/serum'
import useMarkets from './useMarket'
import useConnection from './useConnection'
import { setCache, useAsyncData } from '../utils/fetch-loop'

const accountListenerCount = new Map()

export function useAccountInfo(
  publicKey: PublicKey | undefined | null
): [AccountInfo<Buffer> | null | undefined, boolean] {
  const { connection } = useConnection()
  const cacheKey = tuple(connection, publicKey?.toBase58())
  const [accountInfo, loaded] = useAsyncData<AccountInfo<Buffer> | null>(
    async () => (publicKey ? connection.getAccountInfo(publicKey) : null),
    cacheKey,
    { refreshInterval: 60_000 }
  )
  useEffect(() => {
    if (!publicKey) {
      return
    }
    if (accountListenerCount.has(cacheKey)) {
      const currentItem = accountListenerCount.get(cacheKey)
      ++currentItem.count
    } else {
      let previousInfo: AccountInfo<Buffer> | null = null
      const subscriptionId = connection.onAccountChange(publicKey, (info) => {
        if (
          !previousInfo ||
          !previousInfo.data.equals(info.data) ||
          previousInfo.lamports !== info.lamports
        ) {
          previousInfo = info
          setCache(cacheKey, info)
        }
      })
      accountListenerCount.set(cacheKey, { count: 1, subscriptionId })
    }
    return () => {
      const currentItem = accountListenerCount.get(cacheKey)
      const nextCount = currentItem.count - 1
      if (nextCount <= 0) {
        connection.removeAccountChangeListener(currentItem.subscriptionId)
        accountListenerCount.delete(cacheKey)
      } else {
        --currentItem.count
      }
    }
    // eslint-disable-next-line
  }, [cacheKey])
  const previousInfoRef = useRef<AccountInfo<Buffer> | null | undefined>(null)
  if (
    !accountInfo ||
    !previousInfoRef.current ||
    !previousInfoRef.current.data.equals(accountInfo.data) ||
    previousInfoRef.current.lamports !== accountInfo.lamports
  ) {
    previousInfoRef.current = accountInfo
  }
  return [previousInfoRef.current, loaded]
}

export function useAccountData(publicKey) {
  const [accountInfo] = useAccountInfo(publicKey)
  return accountInfo && accountInfo.data
}

export function useOrderbookAccounts() {
  const { market } = useMarkets()
  // @ts-ignore
  const bidData = useAccountData(market && market._decoded.bids)
  // @ts-ignore
  const askData = useAccountData(market && market._decoded.asks)
  return {
    bidOrderbook: market && bidData ? Orderbook.decode(market, bidData) : null,
    askOrderbook: market && askData ? Orderbook.decode(market, askData) : null,
  }
}

export default function useOrderbook(
  depth = 20
): [{ bids: number[][]; asks: number[][] }, boolean] {
  const { bidOrderbook, askOrderbook } = useOrderbookAccounts()
  const { market } = useMarkets()
  const bids =
    !bidOrderbook || !market
      ? []
      : bidOrderbook.getL2(depth).map(([price, size]) => [price, size])
  const asks =
    !askOrderbook || !market
      ? []
      : askOrderbook.getL2(depth).map(([price, size]) => [price, size])
  return [{ bids, asks }, !!bids || !!asks]
}
