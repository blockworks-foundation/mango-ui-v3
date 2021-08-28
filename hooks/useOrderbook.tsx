import { useEffect } from 'react'
import { Orderbook as SpotOrderBook, Market } from '@project-serum/serum'
import useMangoStore from '../stores/useMangoStore'
import {
  BookSide,
  BookSideLayout,
  PerpMarket,
} from '@blockworks-foundation/mango-client'
import { AccountInfo } from '@solana/web3.js'

export function useAccountData(publicKey) {
  const account = publicKey ? publicKey.toString() : null
  const accountInfo = useMangoStore((s) => s.accountInfos[account])
  return accountInfo && Buffer.from(accountInfo.data)
}

function decodeBook(market, accInfo: AccountInfo<Buffer>): number[][] {
  if (market && accInfo?.data) {
    const depth = 20
    if (market instanceof Market) {
      const book = SpotOrderBook.decode(market, accInfo.data)
      return book.getL2(depth).map(([price, size]) => [price, size])
    } else if (market instanceof PerpMarket) {
      const book = new BookSide(
        null,
        market,
        BookSideLayout.decode(accInfo.data)
      )
      return book.getL2(depth).map(([price, size]) => [price, size])
    }
  } else {
    return []
  }
}

export default function useOrderbook() {
  const setMangoStore = useMangoStore((s) => s.set)
  const market = useMangoStore((state) => state.selectedMarket.current)
  const marketConfig = useMangoStore((state) => state.selectedMarket.config)
  const mangoGroup = useMangoStore((state) => state.selectedMangoGroup.current)
  const askInfo = useMangoStore(
    (state) => state.accountInfos[marketConfig.asksKey.toString()]
  )
  const bidInfo = useMangoStore(
    (state) => state.accountInfos[marketConfig.bidsKey.toString()]
  )

  useEffect(() => {
    if (!mangoGroup || market?.publicKey !== marketConfig?.publicKey) return
    const bids = decodeBook(market, bidInfo)
    const asks = decodeBook(market, askInfo)

    setMangoStore((state) => {
      state.selectedMarket.orderBook = { bids, asks }
      state.selectedMarket.askInfo = askInfo
      state.selectedMarket.bidInfo = bidInfo
    })
  }, [market, bidInfo, askInfo, setMangoStore])
}
