import create, { State } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Connection } from '@solana/web3.js'
import { Market } from '@project-serum/serum'

interface MangoStore extends State {
  wallet: {
    connected: boolean
    setConnected: (x: boolean) => void
  }
  connection: {
    endpoint: string
    connection: Connection
    setConnection: (x: Connection) => void
  }
  defaultMangoGroup: string
  market: {
    market: Market | null
    setMarket: (x: Market) => void
  }
}

const useStore = create<MangoStore>(
  devtools((set) => ({
    wallet: {
      connected: false,
      setConnected: (connected) => {
        set((state) => ({ ...state, wallet: { ...state.wallet, connected } }))
      },
    },
    connection: {
      endpoint: 'devnet',
      connection: null,
      setConnection: (connection) => {
        set((state) => ({
          ...state,
          connection: { ...state.connection, connection },
        }))
      },
    },
    defaultMangoGroup: 'BTC_ETH_USDT',
    market: {
      market: null,
      setMarket: (market) => {
        set((state) => ({
          ...state,
          market: { ...state.market, market },
        }))
      },
    },
  }))
)

export default useStore
