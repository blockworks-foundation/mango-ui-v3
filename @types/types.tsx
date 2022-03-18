import { AccountInfo, PublicKey, Transaction } from '@solana/web3.js'
import { Market, OpenOrders } from '@project-serum/serum'
import { Event } from '@project-serum/serum/lib/queue'
import { I80F48 } from '@blockworks-foundation/mango-client'

export interface Token {
  chainId: number // 101,
  address: string // 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  symbol: string // 'USDC',
  name: string // 'Wrapped USDC',
  decimals: number // 6,
  logoURI: string // 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/BXXkv6z8ykpG1yuvUDPgh732wzVHB69RnB9YgSYh3itW/logo.png',
  tags: string[] // [ 'stablecoin' ]
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

interface BalancesBase {
  key: string
  symbol: string
  wallet?: number | null | undefined
  orders?: number | null | undefined
  openOrders?: OpenOrders | null | undefined
  unsettled?: number | null | undefined
}

export interface Balances extends BalancesBase {
  market?: Market | null | undefined
  deposits?: I80F48 | null | undefined
  borrows?: I80F48 | null | undefined
  net?: I80F48 | null | undefined
  value?: I80F48 | null | undefined
  depositRate?: I80F48 | null | undefined
  borrowRate?: I80F48 | null | undefined
  decimals?: number | null | undefined
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

export interface EndpointInfo {
  name: string
  url: string
  websocket: string
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
  on(event: string, fn: () => void): this
}

export interface PerpTriggerOrder {
  orderId: number
  marketIndex: number
  orderType: 'limit' | 'ioc' | 'postOnly' | 'market'
  side: 'buy' | 'sell'
  price: number
  size: number
  triggerCondition: 'above' | 'below'
  triggerPrice: number
}
