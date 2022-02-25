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
  msrmMints,
  MangoAccountLayout,
} from '@blockworks-foundation/mango-client'
import { AccountInfo, Commitment, Connection, PublicKey } from '@solana/web3.js'
import { EndpointInfo, WalletAdapter } from '../@types/types'
import { isDefined, patchInternalMarketName, zipDict } from '../utils'
import { Notification, notify } from '../utils/notifications'
import { LAST_ACCOUNT_KEY } from '../components/AccountsModal'
import {
  DEFAULT_MARKET_KEY,
  initialMarket,
  NODE_URL_KEY,
} from '../components/SettingsModal'
import { MSRM_DECIMALS } from '@project-serum/serum/lib/token-instructions'
import { getProfilePicture, ProfilePicture } from '@solflare-wallet/pfp'

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
]

type ClusterType = 'mainnet' | 'devnet'
const DEFAULT_MANGO_GROUP_NAME = process.env.NEXT_PUBLIC_GROUP || 'mainnet.1'
export const CLUSTER = DEFAULT_MANGO_GROUP_NAME.split('.')[0] as ClusterType
const ENDPOINT = ENDPOINTS.find((e) => e.name === CLUSTER)

export const WEBSOCKET_CONNECTION = new Connection(
  ENDPOINT.websocket,
  'processed' as Commitment
)

export const DEFAULT_MANGO_GROUP_CONFIG = Config.ids().getGroup(
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

export const SECONDS = 1000

// Used to retry loading the MangoGroup and MangoAccount if an rpc node error occurs
let mangoGroupRetryAttempt = 0
let mangoAccountRetryAttempt = 0

export const INITIAL_STATE = {
  WALLET: {
    providerUrl: null,
    connected: false,
    current: null,
    tokens: [],
    pfp: null,
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

export interface Alert {
  acc: PublicKey
  alertProvider: 'mail'
  health: number
  _id: string
  open: boolean
  timestamp: number
  triggeredTimestamp: number | undefined
}

interface AlertRequest {
  alertProvider: 'mail'
  health: number
  mangoGroupPk: string
  mangoAccountPk: string
  email: string | undefined
}

export interface MangoStore extends State {
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
      [address: string]: Market | PerpMarket
    }
    cache: MangoCache | null
  }
  mangoAccounts: MangoAccount[]
  referrerPk: PublicKey | null
  selectedMangoAccount: {
    current: MangoAccount | null
    initialLoad: boolean
    lastUpdatedAt: string
    lastSlot: number
    openOrders: any[]
    totalOpenOrders: number
    perpAccounts: any[]
    openPerpPositions: any[]
    totalOpenPerpPositions: number
    unsettledPerpPositions: any[]
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
    providerUrl: string
    connected: boolean
    current: WalletAdapter | undefined
    tokens: WalletToken[]
    pfp: ProfilePicture
  }
  settings: {
    uiLocked: boolean
  }
  tradeHistory: {
    spot: any[]
    perp: any[]
  }
  set: (x: (x: MangoStore) => void) => void
  actions: {
    fetchAllMangoAccounts: () => Promise<void>
    fetchMangoGroup: () => Promise<void>
    [key: string]: (args?) => void
  }
  alerts: {
    activeAlerts: Array<Alert>
    triggeredAlerts: Array<Alert>
    loading: boolean
    error: string
    submitting: boolean
    success: string
  }
  marketInfo: any[]
}

const useMangoStore = create<MangoStore>((set, get) => {
  const rpcUrl =
    typeof window !== 'undefined' && CLUSTER === 'mainnet'
      ? JSON.parse(localStorage.getItem(NODE_URL_KEY)) || ENDPOINT.url
      : ENDPOINT.url

  const defaultMarket =
    typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem(DEFAULT_MARKET_KEY)) || initialMarket
      : initialMarket

  const connection = new Connection(rpcUrl, 'processed' as Commitment)
  return {
    marketInfo: [],
    notificationIdCounter: 0,
    notifications: [],
    accountInfos: {},
    connection: {
      cluster: CLUSTER,
      current: connection,
      websocket: WEBSOCKET_CONNECTION,
      client: new MangoClient(connection, programId, {
        postSendTxCallback: ({ txid }: { txid: string }) => {
          notify({
            title: 'Transaction sent',
            description: 'Waiting for confirmation',
            type: 'confirm',
            txid: txid,
          })
        },
      }),
      endpoint: ENDPOINT.url,
      slot: 0,
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
    referrerPk: null,
    selectedMangoAccount: {
      current: null,
      initialLoad: true,
      lastUpdatedAt: '0',
      lastSlot: 0,
      openOrders: [],
      totalOpenOrders: 0,
      perpAccounts: [],
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
    wallet: INITIAL_STATE.WALLET,
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
      spot: [],
      perp: [],
    },
    set: (fn) => set(produce(fn)),
    actions: {
      async fetchWalletTokens() {
        const groupConfig = get().selectedMangoGroup.config
        const wallet = get().wallet.current
        const connected = get().wallet.connected
        const connection = get().connection.current
        const cluster = get().connection.cluster
        const set = get().set

        if (wallet?.publicKey && connected) {
          const ownedTokenAccounts =
            await getTokenAccountsByOwnerWithWrappedSol(
              connection,
              wallet.publicKey
            )
          const tokens = []
          ownedTokenAccounts.forEach((account) => {
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
      async fetchProfilePicture() {
        const set = get().set
        const wallet = get().wallet.current
        const walletPk = wallet?.publicKey
        const connection = get().connection.current

        if (!walletPk) return

        try {
          const result = await getProfilePicture(connection, walletPk)

          set((state) => {
            state.wallet.pfp = result
          })
        } catch (e) {
          console.log('Could not get profile picture', e)
        }
      },
      async fetchAllMangoAccounts() {
        const set = get().set
        const mangoGroup = get().selectedMangoGroup.current
        const mangoClient = get().connection.client
        const wallet = get().wallet.current
        const actions = get().actions

        const delegateFilter = [
          {
            memcmp: {
              offset: MangoAccountLayout.offsetOf('delegate'),
              bytes: wallet?.publicKey.toBase58(),
            },
          },
        ]
        const accountSorter = (a, b) =>
          a.publicKey.toBase58() > b.publicKey.toBase58() ? 1 : -1

        if (!wallet?.publicKey || !mangoGroup) return

        return Promise.all([
          mangoClient.getMangoAccountsForOwner(
            mangoGroup,
            wallet?.publicKey,
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
              actions.fetchAllMangoAccounts()
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

            set((state) => {
              state.selectedMangoGroup.markets = allMarkets
              state.selectedMarket.current = allMarketAccounts.find((mkt) =>
                mkt.publicKey.equals(selectedMarketConfig.publicKey)
              )
              allMarketAccountInfos
                .concat(allBidsAndAsksAccountInfos)
                .forEach(({ publicKey, context, accountInfo }) => {
                  if (context.slot >= state.connection.slot) {
                    state.connection.slot = context.slot
                    state.accountInfos[publicKey.toBase58()] = accountInfo
                  }
                })
            })
            // actions.fetchMarketInfo()
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
      async fetchTradeHistory(mangoAccount = null) {
        const selectedMangoAccount =
          mangoAccount || get().selectedMangoAccount.current
        const set = get().set
        if (!selectedMangoAccount) return

        fetch(
          `https://event-history-api.herokuapp.com/perp_trades/${selectedMangoAccount.publicKey.toString()}`
        )
          .then((response) => response.json())
          .then((jsonPerpHistory) => {
            const perpHistory = jsonPerpHistory?.data || []

            set((state) => {
              state.tradeHistory.perp = perpHistory
            })
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
                `https://event-history-api.herokuapp.com/trades/open_orders/${pk.toString()}`
              )
              const parsedResponse = await response.json()
              return parsedResponse?.data ? parsedResponse.data : []
            })
          )
            .then((serumTradeHistory) => {
              console.log('serum Trade History', serumTradeHistory)

              set((state) => {
                state.tradeHistory.spot = serumTradeHistory
              })
            })
            .catch((e) => {
              console.error('Error fetching trade history', e)
            })
        }
      },
      async reloadMangoAccount() {
        const set = get().set
        const mangoAccount = get().selectedMangoAccount.current
        const connection = get().connection.current
        const mangoClient = get().connection.client

        const [reloadedMangoAccount, lastSlot] =
          await mangoAccount.reloadFromSlot(connection, mangoClient.lastSlot)
        const lastSeenSlot = get().selectedMangoAccount.lastSlot

        if (lastSlot > lastSeenSlot) {
          set((state) => {
            state.selectedMangoAccount.current = reloadedMangoAccount
            state.selectedMangoAccount.lastUpdatedAt = new Date().toISOString()
            state.selectedMangoAccount.lastSlot = lastSlot
          })
          console.log('reloaded mango account')
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
            state.selectedMangoAccount.lastUpdatedAt = new Date().toISOString()
          })
        }
      },
      async updateOpenOrders() {
        const set = get().set
        const connection = get().connection.current
        const bidAskAccounts = Object.keys(get().accountInfos).map(
          (pk) => new PublicKey(pk)
        )

        const allBidsAndAsksAccountInfos = await getMultipleAccounts(
          connection,
          bidAskAccounts
        )

        set((state) => {
          allBidsAndAsksAccountInfos.forEach(
            ({ publicKey, context, accountInfo }) => {
              state.connection.slot = context.slot
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
          const loadedFills = await selectedMarket.loadFills(connection, 10000)
          set((state) => {
            state.selectedMarket.fills = loadedFills
          })
        } catch (err) {
          console.log('Error fetching fills:', err)
        }
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
      async updateConnection(endpointUrl) {
        const set = get().set

        const newConnection = new Connection(endpointUrl, 'processed')

        const newClient = new MangoClient(newConnection, programId)

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
      async fetchMarketInfo() {
        const set = get().set
        const marketInfos = []
        const groupConfig = get().selectedMangoGroup.config
        const markets = [...groupConfig.spotMarkets, ...groupConfig.perpMarkets]

        if (!markets) return

        await Promise.all(
          markets.map(async (market) => {
            const response = await fetch(
              `https://event-history-api-candles.herokuapp.com/markets/${patchInternalMarketName(
                market.name
              )}`
            )
            const parsedResponse = await response.json()
            marketInfos.push(parsedResponse)
          })
        )
        set((state) => {
          state.marketInfo = marketInfos
        })
      },
    },
  }
})

export default useMangoStore
