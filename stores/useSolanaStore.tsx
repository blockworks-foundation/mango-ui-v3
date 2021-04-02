import create, { State } from 'zustand'
import { devtools } from 'zustand/middleware'
import produce from 'immer'
import { AccountInfo, Connection } from '@solana/web3.js'
import { Wallet } from '@project-serum/sol-wallet-adapter'
import { EndpointInfo } from '../@types/types'

export const ENDPOINTS: EndpointInfo[] = [
  {
    name: 'mainnet-beta',
    endpoint: 'https://solana-api.projectserum.com',
    custom: false,
  },
  {
    name: 'devnet',
    endpoint: 'https://devnet.solana.com',
    custom: false,
  },
]

const CLUSTER = 'mainnet-beta'
const ENDPOINT_URL = ENDPOINTS.find((e) => e.name === CLUSTER).endpoint
const DEFAULT_CONNECTION = new Connection(ENDPOINT_URL, 'recent')

interface AccountInfoList {
  [key: string]: AccountInfo<Buffer>
}

interface SolanaStore extends State {
  accountInfos: AccountInfoList
  connection: {
    cluster: string
    current: Connection
    endpoint: string
  }
  wallet: {
    connected: boolean
    current: Wallet
  }
  set: (x: any) => void
}

const useSolanaStore = create<SolanaStore>(
  devtools((set) => ({
    accountInfos: {},
    connection: {
      cluster: CLUSTER,
      current: DEFAULT_CONNECTION,
      endpoint: ENDPOINT_URL,
    },
    wallet: {
      connected: false,
      current: null,
    },
    set: (fn) => set(produce(fn)),
  }))
)

export default useSolanaStore
