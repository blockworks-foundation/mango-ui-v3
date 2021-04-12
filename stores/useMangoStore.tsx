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
import { AccountInfo, Connection, PublicKey } from '@solana/web3.js'
import { Wallet } from '@project-serum/sol-wallet-adapter'
import { EndpointInfo } from '../@types/types'
import { getOwnedTokenAccounts } from '../utils/tokens'

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
const DEFAULT_MANGO_GROUP_NAME = 'BTC_ETH_USDT'

// an object with keys of Solana account addresses that we are
// subscribing to with connection.onAccountChange() in the
// useHydrateStore hook
interface AccountInfoList {
  [key: string]: AccountInfo<Buffer>
}

interface MangoStore extends State {
  notifications: Array<{
    type: string
    message: string
    description?: string
    txid?: string
  }>
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
    srmAccount: AccountInfo<Buffer> | null
    markets: {
      [key: string]: Market
    }
    mintDecimals: number[]
  }
  selectedMarginAccount: {
    current: MarginAccount | null
  }
  tradeForm: {
    side: string
    currency: string
    size: number
  }
  wallet: {
    connected: boolean
    current: Wallet
    balances: Array<{ account: any; publicKey: PublicKey }>
  }
  set: (x: any) => void
  actions: any
}

const useMangoStore = create<MangoStore>(
  devtools((set, get) => ({
    notifications: [],
    accountInfos: {},
    connection: {
      cluster: CLUSTER,
      current: DEFAULT_CONNECTION,
      endpoint: ENDPOINT_URL,
    },
    selectedMangoGroup: {
      name: DEFAULT_MANGO_GROUP_NAME,
      current: null,
      markets: {},
      srmAccount: null,
      mintDecimals: [],
    },
    selectedMarket: {
      name: Object.entries(
        IDS[CLUSTER].mango_groups[DEFAULT_MANGO_GROUP_NAME].spot_market_symbols
      )[0][0],
      address: Object.entries(
        IDS[CLUSTER].mango_groups[DEFAULT_MANGO_GROUP_NAME].spot_market_symbols
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
      side: 'buy',
      size: 0,
      currency: 'BTC',
    },
    wallet: {
      connected: false,
      current: null,
      balances: [],
    },
    set: (fn) => set(produce(fn)),
    actions: {
      async fetchWalletBalances() {
        const connection = get().connection.current
        const wallet = get().wallet.current
        const connected = get().wallet.connected
        const set = get().set
        console.log('fetchingWalletBalances', connected, wallet)
        if (wallet && connected) {
          const ownerAddress = wallet.publicKey
          const ownedTokenAccounts = await getOwnedTokenAccounts(
            connection,
            ownerAddress
          )
          set((state) => {
            state.wallet.balances = ownedTokenAccounts
          })
        } else {
          set((state) => {
            state.wallet.balances = []
          })
        }
      },
    },
  }))
)

export default useMangoStore
