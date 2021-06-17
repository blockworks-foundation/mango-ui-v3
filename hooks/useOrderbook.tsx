import { useEffect, useMemo } from 'react'
import { Orderbook, Market } from '@project-serum/serum'
import useMarket from './useMarket'
import useMangoStore from '../stores/useMangoStore'
import { BookSide, BookSideLayout, PerpMarket } from '@blockworks-foundation/mango-client'
import { AccountInfo } from '@solana/web3.js'

export function useAccountData(publicKey) {
  const account = publicKey ? publicKey.toString() : null
  const accountInfo = useMangoStore((s) => s.accountInfos[account])
  return accountInfo && Buffer.from(accountInfo.data)
}

function decodeBook(market, accInfo: AccountInfo<Buffer>): number[][] {
  if (market && accInfo) {
    const depth = 20; 
    if (market instanceof Market) {
      const book = Orderbook.decode(market, accInfo.data);
      return book.getL2(depth).map(([price, size]) => [price, size])
    } else if (market instanceof PerpMarket) {
      const book = new BookSide(null, market, BookSideLayout.decode(accInfo.data));
      return book.getL2(depth).map(([price, size]) => [price, size])
    }    
  } else {
    return [[]]
  }
}

export default function useOrderbook():
{ bids: number[][]; asks: number[][] } {
  const setMangoStore = useMangoStore((s) => s.set)
  const market = useMangoStore((state) => state.selectedMarket.current)
  const askInfo = useMangoStore((state) => state.selectedMarket.askInfo)
  const bidInfo = useMangoStore((state) => state.selectedMarket.bidInfo)

  const bids = useMemo(() => decodeBook(market, bidInfo), [bidInfo, market])
  const asks = useMemo(() => decodeBook(market, askInfo), [askInfo, market])

  useEffect(() => {
    setMangoStore((state) => {
      state.selectedMarket.orderBook = {bids, asks}
    })
  }, [bids, asks, setMangoStore])

  return { bids, asks }
}
