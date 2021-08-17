import create, { State } from 'zustand'
import produce from 'immer'
import { Market } from '@project-serum/serum'
import {
  IDS,
  Config,
  MangoClient,
  MangoGroup,
  MangoAccount,
  MarketConfig,
  getMarketByBaseSymbolAndKind,
  GroupConfig,
  TokenConfig,
  getTokenAccountsByOwnerWithWrappedSol,
  getTokenByMint,
  TokenAccount,
  nativeToUi,
  MangoCache,
  PerpMarket,
  getAllMarkets,
  getMultipleAccounts,
  PerpMarketLayout,
} from '@blockworks-foundation/mango-client'
// import { SRM_DECIMALS } from '@project-serum/serum/lib/token-instructions'
import { AccountInfo, Commitment, Connection, PublicKey } from '@solana/web3.js'
import { EndpointInfo, WalletAdapter } from '../@types/types'
import { isDefined, zipDict } from '../utils'
import { notify } from '../utils/notifications'
import { LAST_ACCOUNT_KEY } from '../components/AccountsModal'

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

const DEFAULT_MANGO_GROUP_NAME = 'devnet.1'
const DEFAULT_MANGO_GROUP_CONFIG = Config.ids().getGroup(
  CLUSTER,
  DEFAULT_MANGO_GROUP_NAME
)
const defaultMangoGroupIds = IDS['groups'].find(
  (group) => group.name === DEFAULT_MANGO_GROUP_NAME
)
export const MNGO_INDEX = defaultMangoGroupIds.oracles.findIndex(
  (t) => t.symbol === 'MNGO'
)

export const programId = new PublicKey(defaultMangoGroupIds.mangoProgramId)
export const serumProgramId = new PublicKey(defaultMangoGroupIds.serumProgramId)
const mangoGroupPk = new PublicKey(defaultMangoGroupIds.publicKey)

export const mangoClient = new MangoClient(DEFAULT_CONNECTION, programId)

export const INITIAL_STATE = {
  WALLET: {
    providerUrl: null,
    connected: false,
    current: null,
    tokens: [],
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
    title: string
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
    fills: any[]
  }
  mangoGroups: Array<MangoGroup>
  selectedMangoGroup: {
    config: GroupConfig
    name: string
    current: MangoGroup | null
    markets: {
      [address: string]: Market | PerpMarket
    }
    cache: MangoCache | null
  }
  mangoAccounts: MangoAccount[]
  selectedMangoAccount: {
    current: MangoAccount | null
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
  }
  settings: {
    uiLocked: boolean
  }
  tradeHistory: any[]
  set: (x: any) => void
  actions: {
    [key: string]: (args?) => void
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
    fills: [],
  },
  mangoGroups: [],
  mangoAccounts: [],
  selectedMangoAccount: {
    current: null,
    initialLoad: true,
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
        const ownedTokenAccounts = await getTokenAccountsByOwnerWithWrappedSol(
          DEFAULT_CONNECTION,
          wallet.publicKey
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
    async fetchMangoAccounts() {
      const mangoGroup = get().selectedMangoGroup.current
      const wallet = get().wallet.current
      const set = get().set

      if (!wallet?.publicKey || !wallet.publicKey) return

      return mangoClient
        .getMangoAccountsForOwner(mangoGroup, wallet.publicKey, true)
        .then((mangoAccounts) => {
          if (mangoAccounts.length > 0) {
            const sortedAccounts = mangoAccounts
              .slice()
              .sort((a, b) =>
                a.publicKey.toBase58() > b.publicKey.toBase58() ? 1 : -1
              )

            set((state) => {
              state.mangoAccounts = sortedAccounts
              if (state.selectedMangoAccount.current) {
                state.selectedMangoAccount.current = mangoAccounts.find((ma) =>
                  ma.publicKey.equals(
                    state.selectedMangoAccount.current.publicKey
                  )
                )
              } else {
                const lastAccount = localStorage.getItem(LAST_ACCOUNT_KEY)
                state.selectedMangoAccount.current =
                  mangoAccounts.find(
                    (ma) => ma.publicKey.toString() === JSON.parse(lastAccount)
                  ) || sortedAccounts[0]
              }
            })
          }
          set((state) => {
            state.selectedMangoAccount.initialLoad = false
          })
        })
        .catch((err) => {
          console.error('Could not get margin accounts for wallet', err)
        })
    },
    async fetchMangoGroup() {
      const set = get().set
      const mangoGroupConfig = get().selectedMangoGroup.config
      const selectedMarketConfig = get().selectedMarket.config

      return mangoClient
        .getMangoGroup(mangoGroupPk)
        .then(async (mangoGroup) => {
          mangoGroup.loadRootBanks(DEFAULT_CONNECTION)
          const mangoCache = await mangoGroup.loadCache(DEFAULT_CONNECTION)
          const allMarketConfigs = getAllMarkets(mangoGroupConfig)
          const allMarketPks = allMarketConfigs.map((m) => m.publicKey)

          const allMarketAccountInfos = await getMultipleAccounts(
            DEFAULT_CONNECTION,
            allMarketPks
          )
          const allMarketAccounts = allMarketConfigs.map((config, i) => {
            if (config.kind == 'spot') {
              const decoded = Market.getLayout(programId).decode(
                allMarketAccountInfos[i].accountInfo.data
              )
              return new Market(
                decoded,
                config.baseDecimals,
                config.quoteDecimals,
                undefined,
                mangoGroupConfig.serumProgramId
              )
            }
            if (config.kind == 'perp') {
              const decoded = PerpMarketLayout.decode(
                allMarketAccountInfos[i].accountInfo.data
              )
              return new PerpMarket(
                config.publicKey,
                config.baseDecimals,
                config.quoteDecimals,
                decoded
              )
            }
          })

          const allBidsAndAsksPks = allMarketConfigs
            .map((m) => [m.bidsKey, m.asksKey])
            .flat()
          const allBidsAndAsksAccountInfos = await getMultipleAccounts(
            DEFAULT_CONNECTION,
            allBidsAndAsksPks
          )

          const allMarkets = zipDict(
            allMarketPks.map((pk) => pk.toBase58()),
            allMarketAccounts
          )

          set((state) => {
            state.selectedMangoGroup.current = mangoGroup
            state.selectedMangoGroup.cache = mangoCache
            state.selectedMangoGroup.markets = allMarkets
            state.selectedMarket.current =
              allMarkets[selectedMarketConfig.publicKey.toBase58()]

            allMarketAccountInfos
              .concat(allBidsAndAsksAccountInfos)
              .forEach(({ publicKey, accountInfo }) => {
                state.accountInfos[publicKey.toBase58()] = accountInfo
              })
          })
        })
        .catch((err) => {
          notify({
            title: 'Could not get mango group',
            description: `${err}`,
            type: 'error',
          })
          console.log('Could not get mango group: ', err)
        })
    },
    async fetchTradeHistory(mangoAccount = null) {
      const selectedMangoAccount =
        mangoAccount || get().selectedMangoAccount.current
      const set = get().set
      if (!selectedMangoAccount) return
      console.log('selectedMangoAccount', selectedMangoAccount)

      if (selectedMangoAccount.spotOpenOrdersAccounts.length === 0) return
      const openOrdersAccounts =
        selectedMangoAccount.spotOpenOrdersAccounts.filter(isDefined)
      const publicKeys = openOrdersAccounts.map((act) =>
        act.publicKey.toString()
      )
      const perpHistory = await fetch(
        `https://event-history-api.herokuapp.com/perp_trades/${selectedMangoAccount.publicKey.toString()}`
      )
      let parsedPerpHistory = await perpHistory.json()
      parsedPerpHistory = parsedPerpHistory?.data || []

      const serumHistory = await Promise.all(
        publicKeys.map(async (pk) => {
          const response = await fetch(
            `https://stark-fjord-45757.herokuapp.com/trades/open_orders/${pk.toString()}`
          )
          const parsedResponse = await response.json()
          return parsedResponse?.data ? parsedResponse.data : []
        })
      )
      set((state) => {
        state.tradeHistory = [...serumHistory, ...parsedPerpHistory]
      })
    },
    async updateOpenOrders() {
      const set = get().set
      const mangoGroupConfig = get().selectedMangoGroup.config
      const allMarketConfigs = getAllMarkets(mangoGroupConfig)

      const allBidsAndAsksPks = allMarketConfigs
        .map((m) => [m.bidsKey, m.asksKey])
        .flat()

      const allBidsAndAsksAccountInfos = await getMultipleAccounts(
        DEFAULT_CONNECTION,
        allBidsAndAsksPks
      )

      set((state) => {
        allBidsAndAsksAccountInfos.forEach(({ publicKey, accountInfo }) => {
          state.accountInfos[publicKey.toBase58()] = accountInfo
        })
      })
    },
  },
}))

export default useMangoStore
