import {
  AccountInfo,
  Connection,
  PublicKey,
  Transaction,
} from '@solana/web3.js'
import Wallet from '@project-serum/sol-wallet-adapter'
import { Market, OpenOrders } from '@project-serum/serum'
import { Event } from '@project-serum/serum/lib/queue'
import { Order } from '@project-serum/serum/lib/market'
import {
  MangoGroup,
  MarginAccount,
  MangoClient,
} from '@blockworks-foundation/mango-client'
import { MangoSrmAccount } from '@blockworks-foundation/mango-client/lib/client'

export interface ConnectionContextValues {
  endpoint: string
  setEndpoint: (newEndpoint: string) => void
  connection: Connection
  sendConnection: Connection
  availableEndpoints: EndpointInfo[]
  setCustomEndpoints: (newCustomEndpoints: EndpointInfo[]) => void
}

export interface WalletContextValues {
  wallet: Wallet
  connected: boolean
  providerUrl: string
  setProviderUrl: (newProviderUrl: string) => void
  providerName: string
}

export interface MarketInfo {
  address: PublicKey
  name: string
  programId: PublicKey
  deprecated: boolean
  quoteLabel?: string
  baseLabel?: string
}

export interface CustomMarketInfo {
  address: string
  name: string
  programId: string
  quoteLabel?: string
  baseLabel?: string
}

export interface FullMarketInfo {
  address?: PublicKey
  name?: string
  programId?: PublicKey
  deprecated?: boolean
  quoteLabel?: string
  baseLabel?: string
  marketName?: string
  baseCurrency?: string
  quoteCurrency?: string
  marketInfo?: MarketInfo
}

export interface MarketContextValues extends FullMarketInfo {
  market: Market | undefined | null
  setMarketAddress: (newMarketAddress: string) => void
}

export interface TokenAccount {
  pubkey: PublicKey
  account: AccountInfo<Buffer> | null
  effectiveMint: PublicKey
}

export interface Trade extends Event {
  side: string
  price: number
  feeCost: number
  size: number
}

export interface OrderWithMarket extends Order {
  marketName: string
}

export interface OrderWithMarketAndMarketName extends Order {
  market: Market
  marketName: string | undefined
}

interface BalancesBase {
  key: string
  coin: string
  wallet?: number | null | undefined
  orders?: number | null | undefined
  openOrders?: OpenOrders | null | undefined
  unsettled?: number | null | undefined
}

export interface Balances extends BalancesBase {
  market?: Market | null | undefined
  marginDeposits?: number | null | undefined
  borrows?: number | null | undefined
  net?: number | null | undefined
}

export interface OpenOrdersBalances extends BalancesBase {
  market?: string | null | undefined
  baseCurrencyAccount:
    | { pubkey: PublicKey; account: AccountInfo<Buffer> }
    | null
    | undefined
  quoteCurrencyAccount:
    | { pubkey: PublicKey; account: AccountInfo<Buffer> }
    | null
    | undefined
}

export interface DeprecatedOpenOrdersBalances extends BalancesBase {
  market: Market | null | undefined
  marketName: string | null | undefined
}

export interface PreferencesContextValues {
  autoSettleEnabled: boolean
  setAutoSettleEnabled: (newAutoSettleEnabled: boolean) => void
}

export interface EndpointInfo {
  name: string
  endpoint: string
  custom: boolean
}

/**
 * {tokenMint: preferred token account's base58 encoded public key}
 */
export interface SelectedTokenAccounts {
  [tokenMint: string]: string
}

export interface ChartTradeType {
  market: string
  size: number
  price: number
  orderId: string
  time: number
  side: string
  feeCost: number
  marketAddress: string
}

export interface FeeRates {
  taker: number
  maker: number
}

export interface SwapContextValues {
  slippage: number
  setSlippage: (newSlippage: number) => void
  tokenProgramId: PublicKey
  swapProgramId: PublicKey
  legacySwapProgramIds: PublicKey[]
  programIds: () => { token: PublicKey; swap: PublicKey }
}

// Margin Account Type declaration
export interface MarginAccountContextValues {
  marginAccount: MarginAccount | null // The current margin account trading with
  marginAccounts: MarginAccount[] | [] // List of all margin account pk in a mango group
  mango_groups: Array<string> // Identifier for the mango group
  mangoOptions: any //The different parameters for our mango program
  mangoClient: MangoClient // Instance of mango clinet
  mangoGroup: MangoGroup | null // The current mango group
  setMarginAccount: (marginAccount: null | MarginAccount) => void
  setMarginAccounts: (marginAccounts: MarginAccount[]) => void
  createMarginAccount: () => Promise<MarginAccount | null> // For creating a margin account
  maPending: any // Is the context updating
  setMAPending: (any) => void // Set the pending states on margin account transactions
  getMarginAccount: (
    pubKey: PublicKey | undefined
  ) => Promise<MarginAccount | null>
  size: { currency: string; size: number } // The size of buy or sell on tradeform
  setSize: (size: { currency: string; size: number }) => void // Set the size on trade form
  srmFeeRates: FeeRates | null
  totalSrm: number
  contributedSrm: number
  mangoSrmAccounts: MangoSrmAccount[] | null
  getUserSrmInfo: () => void
}

// Type declaration for the margin accounts for the mango group
export type mangoTokenAccounts = {
  mango_group: string
  accounts: TokenAccount[]
}

// Token infos
export interface KnownToken {
  tokenSymbol: string
  tokenName: string
  icon?: string
  mintAddress: string
}

export const DEFAULT_PUBLIC_KEY = new PublicKey(
  '11111111111111111111111111111111'
)

export interface WalletAdapter {
  publicKey: PublicKey
  autoApprove: boolean
  connected: boolean
  signTransaction: (transaction: Transaction) => Promise<Transaction>
  signAllTransactions: (transaction: Transaction[]) => Promise<Transaction[]>
  connect: () => any
  disconnect: () => any
  on<T>(event: string, fn: () => void): this
}
