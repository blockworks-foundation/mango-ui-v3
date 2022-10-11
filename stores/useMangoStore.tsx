import create, { GetState, SetState, Mutate, StoreApi } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
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
  msrmMints,
  MangoAccountLayout,
  BlockhashTimes,
  MarketMode,
  I80F48,
  PerpAccount,
  PerpMarketConfig,
} from '@blockworks-foundation/mango-client'
import { AccountInfo, Commitment, Connection, PublicKey } from '@solana/web3.js'
import { EndpointInfo } from '../@types/types'
import { isDefined, zipDict } from '../utils'
import { Notification, notify } from '../utils/notifications'
import {
  DEFAULT_MARKET_KEY,
  initialMarket,
  RPC_URL_KEY,
} from '../components/SettingsModal'
import { MSRM_DECIMALS } from '@project-serum/serum/lib/token-instructions'
import { decodeBook } from '../hooks/useHydrateStore'
import {
  IExecutionLineAdapter,
  IOrderLineAdapter,
} from '../public/charting_library/charting_library'
import { Wallet } from '@solana/wallet-adapter-react'
import { coingeckoIds, fetchNftsFromHolaplexIndexer } from 'utils/tokens'
import bs58 from 'bs58'
import { PerpMarketInfo } from '@blockworks-foundation/mango-client'

export const ENDPOINTS: EndpointInfo[] = [
  {
    name: 'mainnet',
    url: process.env.NEXT_PUBLIC_ENDPOINT || 'https://mango.rpcpool.com',
    websocket: process.env.NEXT_PUBLIC_ENDPOINT || 'https://mango.rpcpool.com',
    custom: false,
  },
  {
    name: 'devnet',
    // url: 'https://mango.devnet.rpcpool.com',
    // websocket: 'https://mango.devnet.rpcpool.com',
    url: 'https://api.devnet.solana.com',
    websocket: 'https://api.devnet.solana.com',
    custom: false,
  },
  {
    name: 'testnet',
    url: 'https://api.testnet.solana.com',
    websocket: 'https://api.testnet.solana.com',
    custom: false,
  },
]

type ClusterType = 'mainnet' | 'devnet' | 'testnet'
const DEFAULT_MANGO_GROUP_NAME = process.env.NEXT_PUBLIC_GROUP || 'mainnet.1'
export const CLUSTER = DEFAULT_MANGO_GROUP_NAME.split('.')[0] as ClusterType
const ENDPOINT = ENDPOINTS.find((e) => e.name === CLUSTER) as EndpointInfo

export const WEBSOCKET_CONNECTION = new Connection(
  ENDPOINT.websocket,
  'processed' as Commitment
)

export const DEFAULT_MANGO_GROUP_CONFIG = Config.ids().getGroup(
  CLUSTER,
  DEFAULT_MANGO_GROUP_NAME
) as GroupConfig
const defaultMangoGroupIds = IDS['groups'].find(
  (group) => group.name === DEFAULT_MANGO_GROUP_NAME
)
export const MNGO_INDEX = defaultMangoGroupIds!.oracles.findIndex(
  (t) => t.symbol === 'MNGO'
)

export const programId = new PublicKey(defaultMangoGroupIds!.mangoProgramId)
export const serumProgramId = new PublicKey(
  defaultMangoGroupIds!.serumProgramId
)
const mangoGroupPk = new PublicKey(defaultMangoGroupIds!.publicKey)

export const SECONDS = 1000
export const CLIENT_TX_TIMEOUT = 90000

export const LAST_ACCOUNT_KEY = 'lastAccountViewed-3.0'

// Used to retry loading the MangoGroup and MangoAccount if an rpc node error occurs
let mangoGroupRetryAttempt = 0
let mangoAccountRetryAttempt = 0

const initMangoClient = (connection: Connection): MangoClient => {
  return new MangoClient(connection, programId, {
    timeout: CLIENT_TX_TIMEOUT,
    prioritizationFee: 5000,
    postSendTxCallback: ({ txid }: { txid: string }) => {
      notify({
        title: 'Transaction sent',
        description: 'Waiting for confirmation',
        type: 'confirm',
        txid: txid,
      })
    },
    blockhashCommitment: 'confirmed',
  })
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

export interface Alert {
  acc: PublicKey
  alertProvider: 'mail'
  health: number
  _id: string
  open: boolean
  timestamp: number
  triggeredTimestamp: number | undefined
}

export interface AlertRequest {
  alertProvider: 'mail'
  health: number
  mangoGroupPk: string
  mangoAccountPk: string
  email: string | undefined
}

interface NFTFiles {
  type: string
  uri: string
}
interface NFTProperties {
  category: string
  files: NFTFiles[]
}

interface NFTData {
  image: string
  name: string
  description: string
  properties: NFTProperties
  collection: {
    family: string
    name: string
  }
}

interface NFTWithMint {
  val: NFTData
  mint: string
  tokenAddress: string
}

interface ProfileDetails {
  profile_image_url?: string
  profile_name: string
  trader_category: string
  wallet_pk: string
}

export interface SpotBalance {
  market: null
  key: string
  symbol: string
  deposits: I80F48
  borrows: I80F48
  orders: number
  unsettled: number
  net: I80F48
  value: I80F48
  depositRate: I80F48
  borrowRate: I80F48
  decimals: number
}

export interface PerpPosition {
  perpMarketInfo: PerpMarketInfo
  marketConfig: PerpMarketConfig
  perpMarket: PerpMarket
  perpAccount: PerpAccount
  basePosition: number
  indexPrice: number
  avgEntryPrice: number
  breakEvenPrice: number
  notionalSize: number
  unrealizedPnl: number
  unsettledPnl: number
}

export type MangoStore = {
  notificationIdCounter: number
  notifications: Array<Notification>
  accountInfos: AccountInfoList
  connection: {
    cluster: ClusterType
    current: Connection
    websocket: Connection
    endpoint: string
    client: MangoClient
    slot: number
    blockhashTimes: BlockhashTimes[]
  }
  selectedMarket: {
    config: MarketConfig
    current: Market | PerpMarket | null
    markPrice: number
    kind: string
    orderBook: Orderbook
    fills: any[]
  }
  mangoGroups: Array<MangoGroup>
  selectedMangoGroup: {
    config: GroupConfig
    name: string
    current: MangoGroup | null
    markets: {
      [address: string]: Market | PerpMarket | undefined
    }
    cache: MangoCache | null
  }
  mangoAccounts: MangoAccount[]
  referrals: {
    total: number
    history: any[]
  }
  referrerPk: PublicKey | null
  selectedMangoAccount: {
    current: MangoAccount | null
    initialLoad: boolean
    lastUpdatedAt: string
    lastSlot: number
    loading: boolean
    openOrders: any[]
    totalOpenOrders: number
    spotBalances: SpotBalance[]
    perpPositions: (PerpPosition | undefined)[]
    openPerpPositions: PerpPosition[]
    unsettledPerpPositions: PerpPosition[]
    totalOpenPerpPositions: number
  }
  tradeForm: {
    side: 'buy' | 'sell'
    price: number | ''
    baseSize: number | ''
    quoteSize: number | ''
    tradeType:
      | 'Market'
      | 'Limit'
      | 'Stop Loss'
      | 'Take Profit'
      | 'Stop Limit'
      | 'Take Profit Limit'
    triggerPrice: number | ''
    triggerCondition: 'above' | 'below'
  }
  wallet: {
    tokens: WalletToken[] | any[]
    nfts: {
      data: NFTWithMint[] | []
      loading: boolean
    }
  }
  settings: {
    uiLocked: boolean
  }
  tradeHistory: {
    initialLoad: boolean
    spot: any[]
    perp: any[]
    parsed: any[]
  }
  profile: {
    loadProfileFollowing: boolean
    loadFollowers: boolean
    loadDetails: boolean
    details: ProfileDetails
    following: any[]
  }
  set: (x: (x: MangoStore) => void) => void
  actions: {
    fetchWalletTokens: (wallet: Wallet) => void
    fetchNfts: (walletPk: PublicKey | null) => void
    fetchAllMangoAccounts: (wallet: Wallet) => Promise<void>
    fetchMangoGroup: () => Promise<void>
    fetchTradeHistory: () => void
    reloadMangoAccount: () => Promise<void>
    reloadOrders: () => void
    updateOpenOrders: () => void
    loadMarketFills: () => Promise<void | null>
    loadReferralData: () => void
    fetchMangoGroupCache: () => void
    updateConnection: (url: string) => void
    createAlert: (alert: AlertRequest) => void
    deleteAlert: (id: string) => void
    loadAlerts: (pk: PublicKey) => void
    fetchMarketsInfo: () => void
    fetchCoingeckoPrices: () => void
    fetchProfileDetails: (pk: string) => void
    fetchProfileFollowing: (pk: string) => void
    followAccount: (
      mangoAccountPk: string,
      publicKey: PublicKey,
      signMessage: any
    ) => void
    unfollowAccount: (
      mangoAccountPk: string,
      publicKey: PublicKey,
      signMessage: any
    ) => void
  }
  alerts: {
    activeAlerts: Array<Alert>
    triggeredAlerts: Array<Alert>
    loading: boolean
    error: string
    submitting: boolean
    success: string
  }
  marketsInfo: any[]
  tradingView: {
    orderLines: Map<string, IOrderLineAdapter>
    tradeExecutions: Map<string, IExecutionLineAdapter>
  }
  coingeckoPrices: { data: any[]; loading: boolean }
}

const useMangoStore = create<
  MangoStore,
  SetState<MangoStore>,
  GetState<MangoStore>,
  Mutate<StoreApi<MangoStore>, [['zustand/subscribeWithSelector', never]]>
>(
  subscribeWithSelector((set, get) => {
    let rpcUrl = ENDPOINT?.url
    if (typeof window !== 'undefined' && CLUSTER === 'mainnet') {
      const urlFromLocalStorage = localStorage.getItem(RPC_URL_KEY)
      rpcUrl = urlFromLocalStorage
        ? JSON.parse(urlFromLocalStorage)
        : ENDPOINT?.url
    }

    let defaultMarket = initialMarket
    if (typeof window !== 'undefined') {
      const marketFromLocalStorage = localStorage.getItem(DEFAULT_MARKET_KEY)
      defaultMarket = marketFromLocalStorage
        ? JSON.parse(marketFromLocalStorage)
        : initialMarket
    }

    const connection = new Connection(rpcUrl, 'processed' as Commitment)
    const client = initMangoClient(connection)
    return {
      marketsInfo: [],
      notificationIdCounter: 0,
      notifications: [],
      accountInfos: {},
      connection: {
        cluster: CLUSTER,
        current: connection,
        websocket: WEBSOCKET_CONNECTION,
        client,
        endpoint: ENDPOINT.url,
        slot: 0,
        blockhashTimes: [],
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
          defaultMarket.base,
          defaultMarket.kind
        ) as MarketConfig,
        kind: defaultMarket.kind,
        current: null,
        markPrice: 0,
        orderBook: { bids: [], asks: [] },
        fills: [],
      },
      mangoGroups: [],
      mangoAccounts: [],
      referrals: {
        total: 0,
        history: [],
      },
      referrerPk: null,
      selectedMangoAccount: {
        current: null,
        initialLoad: true,
        lastUpdatedAt: '0',
        lastSlot: 0,
        loading: false,
        openOrders: [],
        totalOpenOrders: 0,
        spotBalances: [],
        perpPositions: [],
        openPerpPositions: [],
        totalOpenPerpPositions: 0,
        unsettledPerpPositions: [],
      },
      tradeForm: {
        side: 'buy',
        baseSize: '',
        quoteSize: '',
        tradeType: 'Limit',
        price: '',
        triggerPrice: '',
        triggerCondition: 'above',
      },
      wallet: {
        tokens: [],
        nfts: {
          data: [],
          loading: false,
        },
      },
      settings: {
        uiLocked: true,
      },
      alerts: {
        activeAlerts: [],
        triggeredAlerts: [],
        loading: false,
        error: '',
        submitting: false,
        success: '',
      },
      tradeHistory: {
        initialLoad: false,
        spot: [],
        perp: [],
        parsed: [],
      },
      tradingView: {
        orderLines: new Map(),
        tradeExecutions: new Map(),
      },
      coingeckoPrices: { data: [], loading: false },
      profile: {
        loadProfileFollowing: false,
        loadFollowers: false,
        loadDetails: false,
        details: { profile_name: '', trader_category: '', wallet_pk: '' },
        following: [],
      },
      set: (fn) => set(produce(fn)),
      actions: {
        async fetchWalletTokens(wallet: Wallet) {
          const groupConfig = get().selectedMangoGroup.config
          const connected = wallet?.adapter?.connected
          const connection = get().connection.current
          const cluster = get().connection.cluster
          const set = get().set

          if (wallet?.adapter?.publicKey && connected) {
            const ownedTokenAccounts =
              await getTokenAccountsByOwnerWithWrappedSol(
                connection,
                wallet.adapter.publicKey
              )
            const tokens: any = []
            ownedTokenAccounts?.forEach((account) => {
              const config = getTokenByMint(groupConfig, account.mint)
              if (config) {
                const uiBalance = nativeToUi(account.amount, config.decimals)
                tokens.push({ account, config, uiBalance })
              } else if (msrmMints[cluster].equals(account.mint)) {
                const uiBalance = nativeToUi(account.amount, 6)
                tokens.push({
                  account,
                  config: {
                    symbol: 'MSRM',
                    mintKey: msrmMints[cluster],
                    decimals: MSRM_DECIMALS,
                  },
                  uiBalance,
                })
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
        async fetchNfts(ownerPk: PublicKey) {
          const set = get().set
          set((state) => {
            state.wallet.nfts.loading = true
          })
          try {
            const data = await fetchNftsFromHolaplexIndexer(ownerPk)
            set((state) => {
              state.wallet.nfts.data = data.nfts
              state.wallet.nfts.loading = false
            })
          } catch (error) {
            notify({
              type: 'error',
              title: 'Unable to fetch nfts',
            })
          }
          return []
        },
        async fetchAllMangoAccounts(wallet) {
          const set = get().set
          const mangoGroup = get().selectedMangoGroup.current
          const mangoClient = get().connection.client
          const actions = get().actions

          if (!wallet?.adapter?.publicKey || !mangoGroup) return

          const delegateFilter = [
            {
              memcmp: {
                offset: MangoAccountLayout.offsetOf('delegate'),
                bytes: wallet.adapter.publicKey?.toBase58(),
              },
            },
          ]
          const accountSorter = (a, b) =>
            a.publicKey.toBase58() > b.publicKey.toBase58() ? 1 : -1

          return Promise.all([
            mangoClient.getMangoAccountsForOwner(
              mangoGroup,
              wallet.adapter.publicKey,
              true
            ),
            mangoClient.getAllMangoAccounts(mangoGroup, delegateFilter, false),
          ])
            .then((values) => {
              const [mangoAccounts, delegatedAccounts] = values
              if (mangoAccounts.length + delegatedAccounts.length > 0) {
                const sortedAccounts = mangoAccounts
                  .slice()
                  .sort(accountSorter)
                  .concat(delegatedAccounts.sort(accountSorter))

                set((state) => {
                  state.selectedMangoAccount.initialLoad = false
                  state.mangoAccounts = sortedAccounts
                  if (!state.selectedMangoAccount.current) {
                    const lastAccount = localStorage.getItem(LAST_ACCOUNT_KEY)
                    let currentAcct = sortedAccounts[0]
                    if (lastAccount) {
                      currentAcct =
                        mangoAccounts.find(
                          (ma) =>
                            ma.publicKey.toString() === JSON.parse(lastAccount)
                        ) || sortedAccounts[0]
                    }

                    state.selectedMangoAccount.current = currentAcct
                  }
                })
              } else {
                set((state) => {
                  state.selectedMangoAccount.initialLoad = false
                })
              }
            })
            .catch((err) => {
              if (mangoAccountRetryAttempt < 2) {
                actions.fetchAllMangoAccounts(wallet)
                mangoAccountRetryAttempt++
              } else {
                notify({
                  type: 'error',
                  title: 'Unable to load mango account',
                  description: err.message,
                })
                console.log('Could not get margin accounts for wallet', err)
              }
            })
        },
        async fetchMangoGroup() {
          const set = get().set
          const mangoGroupConfig = get().selectedMangoGroup.config
          const selectedMarketConfig = get().selectedMarket.config
          const mangoClient = get().connection.client
          const connection = get().connection.current
          const actions = get().actions

          return mangoClient
            .getMangoGroup(mangoGroupPk)
            .then(async (mangoGroup) => {
              mangoGroup.loadCache(connection).then((mangoCache) => {
                set((state) => {
                  state.selectedMangoGroup.cache = mangoCache
                })
              })
              mangoGroup.loadRootBanks(connection).then(() => {
                set((state) => {
                  state.selectedMangoGroup.current = mangoGroup
                })
              })

              const allMarketConfigs = getAllMarkets(mangoGroupConfig)
              const allMarketPks = allMarketConfigs.map((m) => m.publicKey)
              const allBidsAndAsksPks = allMarketConfigs
                .map((m) => [m.bidsKey, m.asksKey])
                .flat()

              let allMarketAccountInfos, allBidsAndAsksAccountInfos
              try {
                const resp = await Promise.all([
                  getMultipleAccounts(connection, allMarketPks),
                  getMultipleAccounts(connection, allBidsAndAsksPks),
                ])
                allMarketAccountInfos = resp[0]
                allBidsAndAsksAccountInfos = resp[1]
              } catch {
                notify({
                  type: 'error',
                  title: 'Failed to load the mango group. Please refresh.',
                })
              }

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

              const allMarkets = zipDict(
                allMarketPks.map((pk) => pk.toBase58()),
                allMarketAccounts
              )

              const currentSelectedMarket = allMarketAccounts.find((mkt) =>
                mkt?.publicKey.equals(selectedMarketConfig.publicKey)
              )

              set((state) => {
                state.selectedMangoGroup.markets = allMarkets
                state.selectedMarket.current = currentSelectedMarket
                  ? currentSelectedMarket
                  : null

                allBidsAndAsksAccountInfos.forEach(
                  ({ publicKey, context, accountInfo }) => {
                    if (context.slot >= state.connection.slot) {
                      state.connection.slot = context.slot
                      const perpMarket = allMarketAccounts.find((mkt) => {
                        if (mkt instanceof PerpMarket) {
                          return (
                            mkt.bids.equals(publicKey) ||
                            mkt.asks.equals(publicKey)
                          )
                        }
                      })
                      if (perpMarket) {
                        accountInfo['parsed'] = decodeBook(
                          perpMarket,
                          accountInfo
                        )
                      }
                      state.accountInfos[publicKey.toBase58()] = accountInfo
                    }
                  }
                )
              })
            })
            .catch((err) => {
              if (mangoGroupRetryAttempt < 2) {
                actions.fetchMangoGroup()
                mangoGroupRetryAttempt++
              } else {
                notify({
                  title: 'Failed to load mango group. Please refresh',
                  description: `${err}`,
                  type: 'error',
                })
                console.log('Could not get mango group: ', err)
              }
            })
        },
        async fetchTradeHistory() {
          const selectedMangoAccount = get().selectedMangoAccount.current
          const set = get().set
          if (!selectedMangoAccount) return

          fetch(
            `https://trade-history-api-v3.onrender.com/perp_trades/${selectedMangoAccount.publicKey.toString()}`
          )
            .then((response) => response.json())
            .then((jsonPerpHistory) => {
              const perpHistory = jsonPerpHistory?.data || []
              if (perpHistory.length === 5000) {
                fetch(
                  `https://trade-history-api-v3.onrender.com/perp_trades/${selectedMangoAccount.publicKey.toString()}?page=2`
                )
                  .then((response) => response.json())
                  .then((jsonPerpHistory) => {
                    const perpHistory2 = jsonPerpHistory?.data || []
                    set((state) => {
                      state.tradeHistory.perp = perpHistory.concat(perpHistory2)
                    })
                  })
                  .catch((e) => {
                    console.error('Error fetching trade history', e)
                  })
              } else {
                set((state) => {
                  state.tradeHistory.perp = perpHistory
                })
              }
            })
            .catch((e) => {
              console.error('Error fetching trade history', e)
            })

          if (selectedMangoAccount.spotOpenOrdersAccounts.length) {
            const openOrdersAccounts =
              selectedMangoAccount.spotOpenOrdersAccounts.filter(isDefined)
            const publicKeys = openOrdersAccounts.map((act) =>
              act.publicKey.toString()
            )
            Promise.all(
              publicKeys.map(async (pk) => {
                const response = await fetch(
                  `https://trade-history-api-v3.onrender.com/trades/open_orders/${pk.toString()}`
                )
                const parsedResponse = await response.json()
                return parsedResponse?.data ? parsedResponse.data : []
              })
            )
              .then((serumTradeHistory) => {
                set((state) => {
                  state.tradeHistory.spot = serumTradeHistory
                })
              })
              .catch((e) => {
                console.error('Error fetching trade history', e)
              })
          }
          set((state) => {
            state.tradeHistory.initialLoad = true
          })
        },
        async reloadMangoAccount() {
          const set = get().set
          const mangoAccount = get().selectedMangoAccount.current
          const connection = get().connection.current
          const mangoClient = get().connection.client

          if (!mangoAccount) return

          set((state) => {
            state.selectedMangoAccount.loading = true
          })

          const [reloadedMangoAccount, lastSlot] =
            await mangoAccount.reloadFromSlot(connection, mangoClient.lastSlot)
          const lastSeenSlot = get().selectedMangoAccount.lastSlot

          set((state) => {
            state.selectedMangoAccount.loading = false
          })

          if (lastSlot > lastSeenSlot) {
            set((state) => {
              state.selectedMangoAccount.current = reloadedMangoAccount
              state.selectedMangoAccount.lastUpdatedAt =
                new Date().toISOString()
              state.selectedMangoAccount.lastSlot = lastSlot
            })
          }
        },
        async reloadOrders() {
          const set = get().set
          const mangoAccount = get().selectedMangoAccount.current
          const connection = get().connection.current
          if (mangoAccount) {
            const [spotOpenOrdersAccounts, advancedOrders] = await Promise.all([
              mangoAccount.loadOpenOrders(
                connection,
                new PublicKey(serumProgramId)
              ),
              mangoAccount.loadAdvancedOrders(connection),
            ])
            mangoAccount.spotOpenOrdersAccounts = spotOpenOrdersAccounts
            mangoAccount.advancedOrders = advancedOrders
            set((state) => {
              state.selectedMangoAccount.current = mangoAccount
              state.selectedMangoAccount.lastUpdatedAt =
                new Date().toISOString()
            })
          }
        },
        async updateOpenOrders() {
          const set = get().set
          const connection = get().connection.current
          const bidAskAccounts = Object.keys(get().accountInfos).map(
            (pk) => new PublicKey(pk)
          )
          const markets = Object.values(
            useMangoStore.getState().selectedMangoGroup.markets
          )
          const allBidsAndAsksAccountInfos = await getMultipleAccounts(
            connection,
            bidAskAccounts
          )

          set((state) => {
            allBidsAndAsksAccountInfos.forEach(
              ({ publicKey, context, accountInfo }) => {
                state.connection.slot = context.slot

                const perpMarket = markets.find((mkt) => {
                  if (mkt instanceof PerpMarket) {
                    return (
                      mkt.bids.equals(publicKey) || mkt.asks.equals(publicKey)
                    )
                  }
                })
                if (perpMarket) {
                  accountInfo['parsed'] = decodeBook(perpMarket, accountInfo)
                }
                state.accountInfos[publicKey.toBase58()] = accountInfo
              }
            )
          })
        },
        async loadMarketFills() {
          const set = get().set
          const selectedMarket = get().selectedMarket.current
          const connection = get().connection.current
          if (!selectedMarket) {
            return null
          }
          try {
            const loadedFills = await selectedMarket.loadFills(
              connection,
              10000
            )
            set((state) => {
              state.selectedMarket.fills = loadedFills
            })
          } catch (err) {
            console.log('Error fetching fills:', err)
          }
        },
        async loadReferralData() {
          const set = get().set
          const mangoAccount = get().selectedMangoAccount.current
          const pk = mangoAccount?.publicKey.toString()
          if (!pk) {
            return
          }

          const getData = async (type: 'history' | 'total') => {
            const res = await fetch(
              `https://mango-transaction-log.herokuapp.com/v3/stats/referral-fees-${type}?referrer-account=${pk}`
            )
            const data =
              type === 'history' ? await res.json() : await res.text()
            return data
          }

          const data = await getData('history')
          const totalBalance = await getData('total')

          set((state) => {
            state.referrals.total = parseFloat(totalBalance)
            state.referrals.history = data
          })
        },
        async fetchMangoGroupCache() {
          const set = get().set
          const mangoGroup = get().selectedMangoGroup.current
          const connection = get().connection.current
          if (mangoGroup) {
            try {
              const mangoCache = await mangoGroup.loadCache(connection)

              set((state) => {
                state.selectedMangoGroup.cache = mangoCache
              })
            } catch (e) {
              console.warn('Error fetching mango group cache:', e)
            }
          }
        },
        updateConnection(endpointUrl) {
          const set = get().set

          const newConnection = new Connection(endpointUrl, 'processed')

          const newClient = initMangoClient(newConnection)

          set((state) => {
            state.connection.endpoint = endpointUrl
            state.connection.current = newConnection
            state.connection.client = newClient
          })
        },
        async createAlert(req: AlertRequest) {
          const set = get().set
          const alert = {
            acc: new PublicKey(req.mangoAccountPk),
            alertProvider: req.alertProvider,
            health: req.health,
            open: true,
            timestamp: Date.now(),
          }

          set((state) => {
            state.alerts.submitting = true
            state.alerts.error = ''
            state.alerts.success = ''
          })

          const mangoAccount = get().selectedMangoAccount.current
          const mangoGroup = get().selectedMangoGroup.current
          const mangoCache = get().selectedMangoGroup.cache
          if (!mangoGroup || !mangoAccount || !mangoCache) return
          const currentAccHealth = await mangoAccount.getHealthRatio(
            mangoGroup,
            mangoCache,
            'Maint'
          )

          if (currentAccHealth && currentAccHealth.toNumber() <= req.health) {
            set((state) => {
              state.alerts.submitting = false
              state.alerts.error = `Current account health is already below ${req.health}%`
            })
            return false
          }

          const fetchUrl = `https://mango-alerts-v3.herokuapp.com/alerts`
          const headers = { 'Content-Type': 'application/json' }

          const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(req),
          })

          if (response.ok) {
            const alerts = get().alerts.activeAlerts

            set((state) => {
              state.alerts.activeAlerts = [alert as Alert].concat(alerts)
              state.alerts.submitting = false
              state.alerts.success = 'Alert saved'
            })
            notify({
              title: 'Alert saved',
              type: 'success',
            })
            return true
          } else {
            set((state) => {
              state.alerts.error = 'Something went wrong'
              state.alerts.submitting = false
            })
            notify({
              title: 'Something went wrong',
              type: 'error',
            })
            return false
          }
        },
        async deleteAlert(id: string) {
          const set = get().set

          set((state) => {
            state.alerts.submitting = true
            state.alerts.error = ''
            state.alerts.success = ''
          })

          const fetchUrl = `https://mango-alerts-v3.herokuapp.com/delete-alert`
          const headers = { 'Content-Type': 'application/json' }

          const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ id }),
          })

          if (response.ok) {
            const alerts = get().alerts.activeAlerts
            set((state) => {
              state.alerts.activeAlerts = alerts.filter(
                (alert) => alert._id !== id
              )
              state.alerts.submitting = false
              state.alerts.success = 'Alert deleted'
            })
            notify({
              title: 'Alert deleted',
              type: 'success',
            })
          } else {
            set((state) => {
              state.alerts.error = 'Something went wrong'
              state.alerts.submitting = false
            })
            notify({
              title: 'Something went wrong',
              type: 'error',
            })
          }
        },
        async loadAlerts(mangoAccountPk: PublicKey) {
          const set = get().set

          set((state) => {
            state.alerts.error = ''
            state.alerts.loading = true
          })

          const headers = { 'Content-Type': 'application/json' }
          const response = await fetch(
            `https://mango-alerts-v3.herokuapp.com/alerts/${mangoAccountPk}`,
            {
              method: 'GET',
              headers: headers,
            }
          )

          if (response.ok) {
            const parsedResponse = await response.json()
            // sort active by latest creation time first
            const activeAlerts = parsedResponse.alerts
              .filter((alert) => alert.open)
              .sort((a, b) => {
                return b.timestamp - a.timestamp
              })

            // sort triggered by latest trigger time first
            const triggeredAlerts = parsedResponse.alerts
              .filter((alert) => !alert.open)
              .sort((a, b) => {
                return b.triggeredTimestamp - a.triggeredTimestamp
              })

            set((state) => {
              state.alerts.activeAlerts = activeAlerts
              state.alerts.triggeredAlerts = triggeredAlerts
              state.alerts.loading = false
            })
          } else {
            set((state) => {
              state.alerts.error = 'Error loading alerts'
              state.alerts.loading = false
            })
          }
        },
        async fetchMarketsInfo() {
          const set = get().set
          const groupConfig = get().selectedMangoGroup.config
          const mangoGroup = get().selectedMangoGroup.current

          try {
            const data = await fetch(
              `https://all-market-stats-api.onrender.com/markets/`
            )

            if (data?.status === 200) {
              const parsedMarketsInfo = (await data.json()).filter((market) => {
                const marketKind = market.name.includes('PERP')
                  ? 'perp'
                  : 'spot'

                const marketConfig = getMarketByBaseSymbolAndKind(
                  groupConfig,
                  market.baseSymbol,
                  marketKind
                )
                if (!marketConfig || !marketConfig.publicKey) return false

                const marketMode: MarketMode =
                  mangoGroup?.tokens[marketConfig.marketIndex][
                    marketKind + 'MarketMode'
                  ]
                const isInactive =
                  marketMode == MarketMode.ForceCloseOnly ||
                  marketMode == MarketMode.Inactive

                return !isInactive
              })

              set((state) => {
                state.marketsInfo = parsedMarketsInfo
              })
            }
          } catch (e) {
            console.log('ERORR: Unable to load all market info')
          }
        },
        async fetchCoingeckoPrices() {
          const set = get().set
          set((state) => {
            state.coingeckoPrices.loading = true
          })
          try {
            const promises: any = []
            for (const asset of coingeckoIds) {
              promises.push(
                fetch(
                  `https://api.coingecko.com/api/v3/coins/${asset.id}/market_chart?vs_currency=usd&days=1`
                ).then((res) => res.json())
              )
            }

            const data = await Promise.all(promises)
            for (let i = 0; i < data.length; i++) {
              data[i].symbol = coingeckoIds[i].symbol
            }
            set((state) => {
              state.coingeckoPrices.data = data
              state.coingeckoPrices.loading = false
            })
          } catch (e) {
            console.log('ERORR: Unable to load Coingecko prices')
            set((state) => {
              state.coingeckoPrices.loading = false
            })
          }
        },
        async fetchProfileDetails(walletPk: string) {
          const set = get().set
          set((state) => {
            state.profile.loadDetails = true
          })
          try {
            const response = await fetch(
              `https://mango-transaction-log.herokuapp.com/v3/user-data/profile-details?wallet-pk=${walletPk}`
            )
            const data = await response.json()
            set((state) => {
              state.profile.details = data
              state.profile.loadDetails = false
            })
          } catch (e) {
            // notify({ type: 'error', title: t('profile:profile-fetch-fail') })
            console.log(e)
            set((state) => {
              state.profile.loadDetails = false
            })
          }
        },
        async fetchProfileFollowing(pk: string) {
          const set = get().set
          if (!pk) return
          set((state) => {
            state.profile.loadProfileFollowing = true
          })
          try {
            const followingRes = await fetch(
              `https://mango-transaction-log.herokuapp.com/v3/user-data/following?wallet-pk=${pk}`
            )
            const parsedResponse = await followingRes.json()
            if (Array.isArray(parsedResponse)) {
              set((state) => {
                state.profile.following = parsedResponse
              })
            } else {
              set((state) => {
                state.profile.following = []
              })
            }
            set((state) => {
              state.profile.loadProfileFollowing = false
            })
          } catch {
            notify({
              type: 'error',
              title: 'Unable to load following',
            })
            set((state) => {
              state.profile.loadProfileFollowing = false
            })
          }
        },
        async followAccount(
          mangoAccountPk: string,
          publicKey: PublicKey,
          signMessage: (x) => Uint8Array
        ) {
          const actions = get().actions
          try {
            if (!publicKey) throw new Error('Wallet not connected!')
            if (!signMessage)
              throw new Error('Wallet does not support message signing!')

            const messageString = JSON.stringify({
              mango_account: mangoAccountPk,
              action: 'insert',
            })
            const message = new TextEncoder().encode(messageString)
            const signature = await signMessage(message)

            const requestOptions = {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                wallet_pk: publicKey.toString(),
                message: messageString,
                signature: bs58.encode(signature),
              }),
            }
            const response = await fetch(
              'https://mango-transaction-log.herokuapp.com/v3/user-data/following',
              requestOptions
            )
            if (response.status === 200) {
              await actions.fetchProfileFollowing(publicKey.toString())
              notify({ type: 'success', title: 'Account followed' })
            }
          } catch (error: any) {
            notify({ type: 'error', title: 'Failed to follow account' })
          }
        },
        async unfollowAccount(
          mangoAccountPk: string,
          publicKey: PublicKey,
          signMessage: (x) => Uint8Array
        ) {
          const actions = get().actions
          try {
            if (!publicKey) throw new Error('Wallet not connected!')
            if (!signMessage)
              throw new Error('Wallet does not support message signing!')

            const messageString = JSON.stringify({
              mango_account: mangoAccountPk,
              action: 'delete',
            })
            const message = new TextEncoder().encode(messageString)
            const signature = await signMessage(message)

            const requestOptions = {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                wallet_pk: publicKey.toString(),
                message: messageString,
                signature: bs58.encode(signature),
              }),
            }
            const response = await fetch(
              'https://mango-transaction-log.herokuapp.com/v3/user-data/following',
              requestOptions
            )
            if (response.status === 200) {
              await actions.fetchProfileFollowing(publicKey.toString())
              notify({ type: 'success', title: 'Account unfollowed' })
            }
          } catch (error: any) {
            notify({ type: 'error', title: 'Failed to unfollow account' })
          }
        },
      },
    }
  })
)

export default useMangoStore
