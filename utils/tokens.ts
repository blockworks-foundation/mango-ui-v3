import { TokenAccountLayout } from '@blockworks-foundation/mango-client'
import { PublicKey } from '@solana/web3.js'

export const TOKEN_PROGRAM_ID = new PublicKey(
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
)

export type ProgramAccount<T> = {
  publicKey: PublicKey
  account: T
}

export function parseTokenAccountData(data: Buffer): {
  mint: PublicKey
  owner: PublicKey
  amount: number
} {
  const { mint, owner, amount } = TokenAccountLayout.decode(data)
  return {
    mint: new PublicKey(mint),
    owner: new PublicKey(owner),
    amount,
  }
}

export const coingeckoIds = [
  { id: 'bitcoin', symbol: 'BTC' },
  { id: 'ethereum', symbol: 'ETH' },
  { id: 'solana', symbol: 'SOL' },
  { id: 'mango-markets', symbol: 'MNGO' },
  { id: 'binancecoin', symbol: 'BNB' },
  { id: 'serum', symbol: 'SRM' },
  { id: 'raydium', symbol: 'RAY' },
  { id: 'ftx-token', symbol: 'FTT' },
  { id: 'avalanche-2', symbol: 'AVAX' },
  { id: 'terra-luna', symbol: 'LUNA' },
  { id: 'cope', symbol: 'COPE' },
  { id: 'cardano', symbol: 'ADA' },
  { id: 'msol', symbol: 'MSOL' },
  { id: 'tether', symbol: 'USDT' },
]
