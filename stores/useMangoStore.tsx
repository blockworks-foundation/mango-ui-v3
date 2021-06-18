import create, { State } from 'zustand'
import produce from 'immer'
import { Market } from '@project-serum/serum'
import {
  IDS,
  Config,
  MarketKind,
  MerpsClient as MangoClient,
  MerpsGroup as MangoGroup,
  MerpsAccount as MarginAccount,
  MarketConfig,
  getMarketByBaseSymbolAndKind,
  GroupConfig,
  TokenConfig,
  getTokenAccountsByOwnerWithWrappedSol,
  getTokenByMint,
  TokenAccount,
  nativeToUi,
  MerpsCache,
  PerpMarket,
  getMultipleAccounts,
} from '@blockworks-foundation/mango-client'
// import { SRM_DECIMALS } from '@project-serum/serum/lib/token-instructions'
import {
  AccountInfo,
  Commitment,
  Connection,
  PublicKey,
  TokenAmount,
} from '@solana/web3.js'
import { EndpointInfo, WalletAdapter } from '../@types/types'
import { getWalletTokenInfo } from '../utils/tokens'
import {
  decodeAndLoadMarkets,
  getOrderBookAccountInfos,
  isDefined,
} from '../utils'
import { notify } from '../utils/notifications'
import useAllMarkets from '../hooks/useAllMarkets'

export const ENDPOINTS: EndpointInfo[] = [
  {
    name: 'mainnet-beta',
    url: 'https://mango.rpcpool.com/',
    websocket: 'https://mango.rpcpool.com/',
    custom: false,
  },
  {
    name: 'devnet',
    url: 'https://api.devnet.solana.com',
    websocket: 'https://api.devnet.solana.com',
    custom: false,
  },
]

type ClusterType = 'mainnet-beta' | 'devnet'

const CLUSTER = (process.env.NEXT_PUBLIC_CLUSTER as ClusterType) || 'devnet'
const ENDPOINT = ENDPOINTS.find((e) => e.name === CLUSTER)
export const DEFAULT_CONNECTION = new Connection(
  ENDPOINT.url,
  'processed' as Commitment
)
export const WEBSOCKET_CONNECTION = new Connection(
  ENDPOINT.websocket,
  'processed' as Commitment
)

const DEFAULT_MANGO_GROUP_NAME = 'merps_test_v2.1'
const DEFAULT_MANGO_GROUP_CONFIG = Config.ids().getGroup(
  CLUSTER,
  DEFAULT_MANGO_GROUP_NAME
)
const defaultMangoGroupIds = IDS['groups'].find(
  (group) => group.name === DEFAULT_MANGO_GROUP_NAME
)

export const programId = new PublicKey(defaultMangoGroupIds.merpsProgramId)
export const serumProgramId = new PublicKey(defaultMangoGroupIds.serumProgramId)
const merpsGroupPk = new PublicKey(defaultMangoGroupIds.publicKey)

export const mangoClient = new MangoClient(DEFAULT_CONNECTION, programId)

export const INITIAL_STATE = {
  WALLET: {
    providerUrl: null,
    connected: false,
    current: null,
    tokens: [],
    srmAccountsForOwner: [],
    contributedSrm: 0,
  },
}

// an object with keys of Solana account addresses that we are
// subscribing to with connection.onAccountChange() in the
// useHydrateStore hook
interface AccountInfoList {
  [key: string]: AccountInfo<Buffer>
}

export interface WalletToken {
  account: TokenAccount
  config: TokenConfig
  uiBalance: number
}

export interface Orderbook {
  bids: number[][]
  asks: number[][]
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
    cluster: ClusterType
    current: Connection
    websocket: Connection
    endpoint: string
  }
  selectedMarket: {
    config: MarketConfig
    current: Market | PerpMarket | null
    markPrice: number
    kind: string
    askInfo: AccountInfo<Buffer> | null
    bidInfo: AccountInfo<Buffer> | null
    orderBook: Orderbook
  }
  mangoGroups: Array<MangoGroup>
  selectedMangoGroup: {
    config: GroupConfig
    name: string
    current: MangoGroup | null
    markets: {
      [address: string]: Market
    }
    rootBanks: any[]
    cache: MerpsCache | null
  }
  marginAccounts: MarginAccount[]
  selectedMarginAccount: {
    current: MarginAccount | null
    initialLoad: boolean
  }
  tradeForm: {
    side: 'buy' | 'sell'
    price: number | ''
    baseSize: number | ''
    quoteSize: number | ''
    tradeType: 'Market' | 'Limit'
  }
  wallet: {
    providerUrl: string
    connected: boolean
    current: WalletAdapter | undefined
    tokens: WalletToken[]
    srmAccountsForOwner: any[]
    contributedSrm: number
  }
  settings: {
    uiLocked: boolean
  }
  tradeHistory: any[]
  set: (x: any) => void
  actions: {
    [key: string]: () => void
  }
}

const useMangoStore = create<MangoStore>((set, get) => ({
  notifications: [],
  accountInfos: {},
  connection: {
    cluster: CLUSTER,
    current: DEFAULT_CONNECTION,
    websocket: WEBSOCKET_CONNECTION,
    endpoint: ENDPOINT.url,
  },
  selectedMangoGroup: {
    config: DEFAULT_MANGO_GROUP_CONFIG,
    name: DEFAULT_MANGO_GROUP_NAME,
    current: null,
    markets: {},
    rootBanks: [],
    cache: null,
  },
  selectedMarket: {
    config: getMarketByBaseSymbolAndKind(
      DEFAULT_MANGO_GROUP_CONFIG,
      'BTC',
      'spot'
    ) as MarketConfig,
    kind: 'spot',
    current: null,
    markPrice: 0,
    askInfo: null,
    bidInfo: null,
    orderBook: { bids: [], asks: [] },
  },
  mangoGroups: [],
  marginAccounts: [],
  selectedMarginAccount: {
    current: null,
    initialLoad: false,
  },
  tradeForm: {
    side: 'buy',
    baseSize: '',
    quoteSize: '',
    tradeType: 'Limit',
    price: '',
  },
  wallet: INITIAL_STATE.WALLET,
  settings: {
    uiLocked: true,
  },
  tradeHistory: [],
  set: (fn) => set(produce(fn)),
  actions: {
    async fetchWalletTokens() {
      const groupConfig = get().selectedMangoGroup.config
      const wallet = get().wallet.current
      const connected = get().wallet.connected
      const set = get().set

      if (wallet?.publicKey && connected) {
        const ownerAddress = wallet.publicKey
        const ownedTokenAccounts = await getTokenAccountsByOwnerWithWrappedSol(
          DEFAULT_CONNECTION,
          ownerAddress
        )
        const tokens = []
        ownedTokenAccounts.forEach((account) => {
          const config = getTokenByMint(groupConfig, account.mint)
          if (config) {
            const uiBalance = nativeToUi(account.amount, config.decimals)
            tokens.push({ account, config, uiBalance })
          }
        })

        set((state) => {
          state.wallet.tokens = tokens
        })
      } else {
        set((state) => {
          state.wallet.tokens = []
        })
      }
    },
    async fetchMarginAccounts() {
      const mangoGroup = get().selectedMangoGroup.current
      const selectedMarginAcount = get().selectedMarginAccount.current
      const wallet = get().wallet.current
      const set = get().set

      if (!wallet?.publicKey || !wallet.publicKey) return

      if (!selectedMarginAcount) {
        set((state) => {
          state.selectedMarginAccount.initialLoad = true
        })
      }

      return mangoClient
        .getMarginAccountsForOwner(mangoGroup, wallet.publicKey, true)
        .then((marginAccounts) => {
          if (marginAccounts.length > 0) {
            const sortedAccounts = marginAccounts
              .slice()
              .sort((a, b) =>
                a.publicKey.toBase58() > b.publicKey.toBase58() ? 1 : -1
              )
            console.log('margin acc: ', sortedAccounts[0])

            set((state) => {
              state.marginAccounts = sortedAccounts
              state.selectedMarginAccount.current = sortedAccounts[0]
              // if (state.selectedMarginAccount.current) {
              //   state.selectedMarginAccount.current = marginAccounts.find(
              //     (ma) =>
              //       ma.publicKey.equals(
              //         state.selectedMarginAccount.current.publicKey
              //       )
              //   )
              // } else {
              //   const lastAccount = localStorage.getItem('lastAccountViewed')

              //   state.selectedMarginAccount.current =
              //     marginAccounts.find(
              //       (ma) => ma.publicKey.toString() === JSON.parse(lastAccount)
              //     ) || sortedAccounts[0]
              // }
            })
          }
          set((state) => {
            state.selectedMarginAccount.initialLoad = false
          })
        })
        .catch((err) => {
          console.error('Could not get margin accounts for wallet', err)
        })
    },
    async fetchMangoGroup() {
      const set = get().set
      const mangoGroupPk = merpsGroupPk
      const mangoGroupConfig = get().selectedMangoGroup.config
      const selectedMarketConfig = get().selectedMarket.config

      return mangoClient
        .getMerpsGroup(mangoGroupPk)
        .then(async (mangoGroup) => {
          const rootBanks = await mangoGroup.loadRootBanks(DEFAULT_CONNECTION)
          const merpsCache = await mangoGroup.loadCache(DEFAULT_CONNECTION)

          const spotMarketAccountInfos = await getMultipleAccounts(
            DEFAULT_CONNECTION,
            mangoGroupConfig.spotMarkets.map((mkt) => mkt.publicKey)
          )
          const spotOrderBookAccountInfos = await getOrderBookAccountInfos(
            mangoGroup.dexProgramId,
            spotMarketAccountInfos.map(({ accountInfo }) => accountInfo)
          )
          const spotMarkets = await decodeAndLoadMarkets(
            mangoGroupConfig,
            spotMarketAccountInfos
          )

          set((state) => {
            state.selectedMangoGroup.current = mangoGroup
            state.selectedMangoGroup.rootBanks = rootBanks
            state.selectedMangoGroup.cache = merpsCache
            state.selectedMangoGroup.markets = spotMarkets
            state.selectedMarket.current =
              spotMarkets[selectedMarketConfig.publicKey.toString()]

            spotMarketAccountInfos
              .concat(spotOrderBookAccountInfos)
              .forEach(({ publicKey, accountInfo }) => {
                state.accountInfos[publicKey.toString()] = accountInfo
              })
          })
        })
        .catch((err) => {
          notify({
            message: 'Could not get mango group: ',
            description: `${err}`,
            type: 'error',
          })
          console.log('Could not get mango group: ', err)
        })
    },
    // async fetchTradeHistory(marginAccount = null) {
    //   const selectedMarginAccount =
    //     marginAccount || get().selectedMarginAccount.current
    //   const set = get().set

    //   if (!selectedMarginAccount) return
    //   if (selectedMarginAccount.openOrdersAccounts.length === 0) return

    //   const openOrdersAccounts =
    //     selectedMarginAccount.openOrdersAccounts.filter(isDefined)
    //   const publicKeys = openOrdersAccounts.map((act) =>
    //     act.publicKey.toString()
    //   )
    //   const results = await Promise.all(
    //     publicKeys.map(async (pk) => {
    //       const response = await fetch(
    //         `https://stark-fjord-45757.herokuapp.com/trades/open_orders/${pk.toString()}`
    //       )

    //       const parsedResponse = await response.json()
    //       return parsedResponse?.data ? parsedResponse.data : []
    //     })
    //   )
    //   set((state) => {
    //     state.tradeHistory = results
    //   })
    // },
  },
}))

export default useMangoStore
