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

export const INITIAL_STATE = {
  WALLET: {
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
    cluster: string
    current: Connection
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
    connected: boolean
    current: Wallet
    balances: Array<{ account: any; publicKey: PublicKey }>
    srmAccountsForOwner: any[]
    contributedSrm: number
  }
  settings: {
    uiLocked: boolean
  }
  set: (x: any) => void
  actions: any
}

const useMangoStore = create<MangoStore>((set, get) => ({
  notifications: [],
  accountInfos: {},
  connection: {
    cluster: CLUSTER,
    current: DEFAULT_CONNECTION,
    endpoint: ENDPOINT_URL,
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
    async fetchMangoSrmAccounts() {
      const connection = get().connection.current
      const wallet = get().wallet.current
      const connected = get().wallet.connected
      const selectedMangoGroup = get().selectedMangoGroup.current
      const cluster = get().connection.cluster
      const mangoClient = get().mangoClient
      const set = get().set

      if (wallet && connected) {
        const usersMangoSrmAccounts = await mangoClient.getMangoSrmAccountsForOwner(
          connection,
          new PublicKey(IDS[cluster].mango_program_id),
          selectedMangoGroup,
          wallet
        )
        if (usersMangoSrmAccounts.length) {
          set((state) => {
            state.selectedMangoGroup.srmAccountsForOwner = usersMangoSrmAccounts
            const totalSrmDeposits = usersMangoSrmAccounts.reduce(
              (prev, cur) => prev + cur.amount,
              0
            )
            state.selectedMangoGroup.contributedSrm = nativeToUi(
              totalSrmDeposits,
              SRM_DECIMALS
            )
          })
        }
      }
    },
    async fetchMarginAcccount() {
      const connection = get().connection.current
      const mangoGroup = get().selectedMangoGroup.current
      const wallet = get().wallet.current
      const cluster = get().connection.cluster
      const mangoClient = get().mangoClient
      const programId = IDS[cluster].mango_program_id
      const set = get().set

      if (!wallet || !wallet.publicKey) return

      mangoClient
        .getMarginAccountsForOwner(
          connection,
          new PublicKey(programId),
          mangoGroup,
          wallet
        )
        .then((marginAccounts) => {
          if (marginAccounts.length > 0) {
            set((state) => {
              state.marginAcccounts = marginAccounts
              state.selectedMarginAccount.current = marginAccounts[0]
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

      mangoClient
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
          console.error('Could not get mango group: ', err)
        })
    },
  },
}))

export default useMangoStore
