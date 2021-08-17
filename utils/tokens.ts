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
