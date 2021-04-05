import create, { State } from 'zustand'
import produce from 'immer'
// import { Connection } from '@solana/web3.js'
// import { Market } from '@project-serum/serum'

interface SerumStore extends State {
  orderbook: {
    bids: any[]
    asks: any[]
  }
  fills: any[]
  set: (x: any) => void
}

const useSerumStore = create<SerumStore>((set) => ({
  orderbook: {
    bids: [],
    asks: [],
  },
  fills: [],
  set: (fn) => set(produce(fn)),
}))

export default useSerumStore
