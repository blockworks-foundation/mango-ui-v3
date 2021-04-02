import create, { State } from 'zustand'
import { devtools } from 'zustand/middleware'
import produce from 'immer'
import { Market } from '@project-serum/serum'
import {
  MangoClient,
  MangoGroup,
  MarginAccount,
} from '@blockworks-foundation/mango-client'

interface MangoStore extends State {
  selectedMangoGroup: string
  market: {
    current: Market | null
    markPrice: number
    orderBook: any[]
  }
  mangoClient: MangoClient
  mangoGroup: MangoGroup | null
  selectedMarginAcccount: MarginAccount | null
  tradeForm: {
    currency: string
    size: number
  }
  set: (x: any) => void
}

const useMangoStore = create<MangoStore>(
  devtools((set) => ({
    selectedMangoGroup: 'BTC_ETH_USDT',
    market: {
      current: null,
      markPrice: 0,
      orderBook: [],
    },
    mangoClient: new MangoClient(),
    mangoGroup: null,
    marginAccounts: [],
    selectedMarginAcccount: null,
    tradeForm: {
      size: 0,
      currency: 'BTC',
    },
    set: (fn) => set(produce(fn)),
  }))
)

export default useMangoStore
