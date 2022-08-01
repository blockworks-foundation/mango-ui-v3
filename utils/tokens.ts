import { TokenAccountLayout } from '@blockworks-foundation/mango-client'
import { PublicKey, Connection } from '@solana/web3.js'
import { AccountInfo } from '@solana/spl-token'

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
  { id: 'stepn', symbol: 'GMT' },
]

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

export const fetchNftsFromHolaplexIndexer = async (owner: PublicKey) => {
  const result = await fetch('https://graph.holaplex.com/v1', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
        query nfts($owners: [PublicKey!]) {
            nfts(
              owners: $owners,
               limit: 10000, offset: 0) {
              name
              mintAddress
              address
              image
              updateAuthorityAddress
              collection {
                creators {
                  verified
                  address
                }
                mintAddress
              }

            }

        }
      `,
      variables: {
        owners: [owner.toBase58()],
      },
    }),
  })

  const body = await result.json()
  return body.data
}

export type TokenProgramAccount<T> = {
  publicKey: PublicKey
  account: T
}

export type TokenAccount = AccountInfo
