import { TokenAccountLayout } from '@blockworks-foundation/mango-client'
import { PublicKey, Connection } from '@solana/web3.js'

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

export async function getTokenAccountsByMint(
  connection: Connection,
  mint: string
): Promise<ProgramAccount<any>[]> {
  const results = await connection.getProgramAccounts(TOKEN_PROGRAM_ID, {
    filters: [
      {
        dataSize: 165,
      },
      {
        memcmp: {
          offset: 0,
          bytes: mint,
        },
      },
    ],
  })
  return results.map((r) => {
    const publicKey = r.pubkey
    const data = Buffer.from(r.account.data)
    const account = parseTokenAccountData(data)
    return { publicKey, account }
  })
}
