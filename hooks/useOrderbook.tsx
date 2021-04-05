import { useEffect, useMemo } from 'react'
import { PublicKey, AccountInfo } from '@solana/web3.js'
import { Orderbook } from '@project-serum/serum'
import useMarkets from './useMarkets'
import useInterval from './useInterval'
import useMangoStore from '../stores/useMangoStore'
import useConnection from './useConnection'

function useAccountInfo(account: PublicKey) {
  const setSolanaStore = useMangoStore((s) => s.set)
  const { connection } = useConnection()
  const accountPkAsString = account ? account.toString() : null

  useInterval(async () => {
    if (!account) return

    const info = await connection.getAccountInfo(account)
    console.log('fetching account info on interval', accountPkAsString)

    setSolanaStore((state) => {
      state.accountInfos[accountPkAsString] = info
    })
  }, 60000)

  useEffect(() => {
    if (!account) return
    let previousInfo: AccountInfo<Buffer> | null = null

    const subscriptionId = connection.onAccountChange(account, (info) => {
      if (
        !previousInfo ||
        !previousInfo.data.equals(info.data) ||
        previousInfo.lamports !== info.lamports
      ) {
        previousInfo = info
        setSolanaStore((state) => {
          state.accountInfos[accountPkAsString] = previousInfo
        })
      }
    })

    return () => {
      connection.removeAccountChangeListener(subscriptionId)
    }
  }, [account, connection])
}

export function useAccountData(publicKey) {
  useAccountInfo(publicKey)

  const account = publicKey ? publicKey.toString() : null
  const accountInfo = useMangoStore((s) => s.accountInfos[account])
  return accountInfo && Buffer.from(accountInfo.data)
}

export function useOrderbookAccounts() {
  const market = useMangoStore((s) => s.market.current)
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

  const setMangoStore = useMangoStore((s) => s.set)

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
      state.market.orderBook = [{ bids, asks }, !!bids || !!asks]
    })
  }, [bids, asks])

  return [{ bids, asks }, !!bids || !!asks]
}
