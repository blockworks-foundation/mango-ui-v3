import create, { State } from 'zustand'
import { devtools } from 'zustand/middleware'
import produce from 'immer'
import { Market } from '@project-serum/serum'
import {
  IDS,
  MangoClient,
  MangoGroup,
  MarginAccount,
} from '@blockworks-foundation/mango-client'
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
const DEFAULT_MANGO_GROUP = 'BTC_ETH_USDT'

interface AccountInfoList {
  [key: string]: AccountInfo<Buffer>
}

interface MangoStore extends State {
  accountInfos: AccountInfoList
  connection: {
    cluster: string
    current: Connection
    endpoint: string
  }
  market: {
    current: Market | null
    mangoProgramId: number | null
    markPrice: number
    orderBook: any[]
  }
  selectedMarket: {
    name: string
    address: string
  }
  mangoClient: MangoClient
  mangoGroups: Array<MangoGroup>
  selectedMangoGroup: {
    name: string
    current: MangoGroup | null
    markets: {
      [key: string]: Market
    }
  }
  selectedMarginAccount: {
    current: MarginAccount | null
  }
  tradeForm: {
    currency: string
    size: number
  }
  wallet: {
    connected: boolean
    current: Wallet
  }
  set: (x: any) => void
}

const useMangoStore = create<MangoStore>(
  devtools((set) => ({
    accountInfos: {},
    connection: {
      cluster: CLUSTER,
      current: DEFAULT_CONNECTION,
      endpoint: ENDPOINT_URL,
    },
    selectedMangoGroup: {
      name: DEFAULT_MANGO_GROUP,
      current: null,
      markets: {},
    },
    selectedMarket: {
      name: Object.entries(
        IDS[CLUSTER].mango_groups[DEFAULT_MANGO_GROUP].spot_market_symbols
      )[0][0],
      address: Object.entries(
        IDS[CLUSTER].mango_groups[DEFAULT_MANGO_GROUP].spot_market_symbols
      )[0][1],
    },
    market: {
      current: null,
      mangoProgramId: null,
      markPrice: 0,
      orderBook: [],
    },
    mangoClient: new MangoClient(),
    mangoGroups: [],
    marginAccounts: [],
    selectedMarginAccount: {
      current: null,
    },
    tradeForm: {
      size: 0,
      currency: 'BTC',
    },
    wallet: {
      connected: false,
      current: null,
    },
    set: (fn) => set(produce(fn)),
  }))
)

export default useMangoStore
