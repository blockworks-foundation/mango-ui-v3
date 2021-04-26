import create, { State } from 'zustand'
import produce from 'immer'
import { Market } from '@project-serum/serum'
import {
  IDS,
  MangoClient,
  MangoGroup,
  MarginAccount,
  nativeToUi,
} from '@blockworks-foundation/mango-client'
import { SRM_DECIMALS } from '@project-serum/serum/lib/token-instructions'
import { AccountInfo, Connection, PublicKey } from '@solana/web3.js'
import { EndpointInfo, WalletAdapter } from '../@types/types'
import { getOwnedTokenAccounts } from '../utils/tokens'
import { isDefined } from '../utils/index'
import { notify } from '../utils/notifications'

export const ENDPOINTS: EndpointInfo[] = [
  {
    name: 'mainnet-beta',
    url: 'https://solana-api.projectserum.com/',
    websocket: 'https://api.mainnet-beta.solana.com/',
    custom: false,
  },
  {
    name: 'devnet',
    url: 'https://devnet.solana.com',
    websocket: 'https://devnet.solana.com',
    custom: false,
  },
]

type ClusterType = 'mainnet-beta' | 'devnet'

const CLUSTER =
  (process.env.NEXT_PUBLIC_CLUSTER as ClusterType) || 'mainnet-beta'
const ENDPOINT = ENDPOINTS.find((e) => e.name === CLUSTER)
const DEFAULT_CONNECTION = new Connection(ENDPOINT.url, 'recent')
const WEBSOCKET_CONNECTION = new Connection(ENDPOINT.websocket, 'recent')
const DEFAULT_MANGO_GROUP_NAME = 'BTC_ETH_USDT'

export const INITIAL_STATE = {
  WALLET: {
    providerUrl: null,
    connected: false,
    current: null,
    balances: [],
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
    srmMint: string
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
  marginAccounts: MarginAccount[]
  selectedMarginAccount: {
    current: MarginAccount | null
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
    balances: Array<{ account: any; publicKey: PublicKey }>
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
    srmMint: IDS[CLUSTER].symbols['SRM'],
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
    async fetchWalletBalances() {
      const connection = get().connection.current
      const wallet = get().wallet.current
      const connected = get().wallet.connected
      const set = get().set

      if (wallet?.publicKey && connected) {
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
    async fetchMangoSrmAccounts() {
      const connection = get().connection.current
      const wallet = get().wallet.current
      const connected = get().wallet.connected
      const selectedMangoGroup = get().selectedMangoGroup.current
      const cluster = get().connection.cluster
      const mangoClient = get().mangoClient
      const set = get().set

      if (wallet?.publicKey && connected) {
        const usersMangoSrmAccounts = await mangoClient.getMangoSrmAccountsForOwner(
          connection,
          new PublicKey(IDS[cluster].mango_program_id),
          selectedMangoGroup,
          wallet
        )
        if (usersMangoSrmAccounts.length) {
          set((state) => {
            state.wallet.srmAccountsForOwner = usersMangoSrmAccounts
            const totalSrmDeposits = usersMangoSrmAccounts.reduce(
              (prev, cur) => prev + cur.amount,
              0
            )
            state.wallet.contributedSrm = nativeToUi(
              totalSrmDeposits,
              SRM_DECIMALS
            )
          })
        }
      }
    },
    async fetchMarginAccounts() {
      const connection = get().connection.current
      const mangoGroup = get().selectedMangoGroup.current
      const wallet = get().wallet.current
      const cluster = get().connection.cluster
      const mangoClient = get().mangoClient
      const programId = IDS[cluster].mango_program_id
      const set = get().set

      if (!wallet?.publicKey || !wallet.publicKey) return

      return mangoClient
        .getMarginAccountsForOwner(
          connection,
          new PublicKey(programId),
          mangoGroup,
          wallet
        )
        .then((marginAccounts) => {
          if (marginAccounts.length > 0) {
            set((state) => {
              state.marginAccounts = marginAccounts
              if (state.selectedMarginAccount.current) {
                state.selectedMarginAccount.current = marginAccounts.find(
                  (ma) =>
                    ma.publicKey.equals(
                      state.selectedMarginAccount.current.publicKey
                    )
                )
              } else {
                state.selectedMarginAccount.current = marginAccounts[0]
              }
            })
          }
        })
        .catch((err) => {
          console.error(
            'Could not get margin accounts for user in effect ',
            err
          )
        })
    },
    async fetchAllMangoGroups() {
      const connection = get().connection.current
      const cluster = get().connection.cluster
      const mangoClient = get().mangoClient
      const set = get().set
      const mangoGroups = Object.keys(IDS[cluster].mango_groups)

      const allMangoGroups = await Promise.all(
        mangoGroups.map((mangoGroupName) => {
          const mangoGroupIds = IDS[cluster].mango_groups[mangoGroupName]
          const mangoGroupPk = new PublicKey(mangoGroupIds.mango_group_pk)
          const srmVaultPk = new PublicKey(mangoGroupIds.srm_vault_pk)

          return mangoClient.getMangoGroup(connection, mangoGroupPk, srmVaultPk)
        })
      )

      set((state) => {
        state.mangoGroups = allMangoGroups
      })
    },
    async fetchMangoGroup() {
      const connection = get().connection.current
      const mangoGroupName = get().selectedMangoGroup.name
      const cluster = get().connection.cluster
      const mangoClient = get().mangoClient
      const set = get().set
      const mangoGroupIds = IDS[cluster].mango_groups[mangoGroupName]
      if (!mangoClient) return

      const mangoGroupPk = new PublicKey(mangoGroupIds.mango_group_pk)
      const srmVaultPk = new PublicKey(mangoGroupIds.srm_vault_pk)

      return mangoClient
        .getMangoGroup(connection, mangoGroupPk, srmVaultPk)
        .then(async (mangoGroup) => {
          const srmAccountInfo = await connection.getAccountInfo(
            mangoGroup.srmVault
          )
          // Set the mango group
          set((state) => {
            state.selectedMangoGroup.current = mangoGroup
            state.selectedMangoGroup.srmAccount = srmAccountInfo
            state.selectedMangoGroup.mintDecimals = mangoGroup.mintDecimals
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
    async fetchTradeHistory(marginAccount = null) {
      const selectedMarginAccount =
        marginAccount || get().selectedMarginAccount.current
      const set = get().set

      if (!selectedMarginAccount) return
      if (selectedMarginAccount.openOrdersAccounts.length === 0) return

      const openOrdersAccounts = selectedMarginAccount.openOrdersAccounts.filter(
        isDefined
      )
      const publicKeys = openOrdersAccounts.map((act) =>
        act.publicKey.toString()
      )
      const results = await Promise.all(
        publicKeys.map(async (pk) => {
          const response = await fetch(
            `https://stark-fjord-45757.herokuapp.com/trades/open_orders/${pk.toString()}`
          )

          const parsedResponse = await response.json()
          return parsedResponse?.data ? parsedResponse.data : []
        })
      )
      set((state) => {
        state.tradeHistory = results
      })
    },
  },
}))

export default useMangoStore
