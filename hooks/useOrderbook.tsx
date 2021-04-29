import { useEffect, useMemo } from 'react'
import { Orderbook, Market } from '@project-serum/serum'
import useMarket from './useMarket'
import useMangoStore from '../stores/useMangoStore'

export function useAccountData(publicKey) {
  const account = publicKey ? publicKey.toString() : null
  const accountInfo = useMangoStore((s) => s.accountInfos[account])
  return accountInfo && Buffer.from(accountInfo.data)
}

export function useOrderbookAccounts(market: Market) {
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
  const setMangoStore = useMangoStore((s) => s.set)
  const { market } = useMarket()
  const { bidOrderbook, askOrderbook } = useOrderbookAccounts(market)

  const bids = useMemo(
    () =>
      !bidOrderbook || !market
        ? []
        : bidOrderbook.getL2(depth).map(([price, size]) => [price, size]),
    [bidOrderbook, depth, market]
  )

  const asks = useMemo(
    () =>
      !askOrderbook || !market
        ? []
        : askOrderbook.getL2(depth).map(([price, size]) => [price, size]),
    [askOrderbook, depth, market]
  )

  useEffect(() => {
    setMangoStore((state) => {
      state.selectedMarket.orderBook = [{ bids, asks }, !!bids || !!asks]
    })
  }, [bids, asks])

  return [{ bids, asks }, !!bids || !!asks]
}
