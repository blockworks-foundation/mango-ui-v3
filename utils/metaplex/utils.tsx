import { PublicKey } from '@solana/web3.js'

export const findProgramAddress = async (
  seeds: (Buffer | Uint8Array)[],
  programId: PublicKey
) => {
  const key =
    'pda-' +
    seeds.reduce((agg, item) => agg + item.toString('hex'), '') +
    programId.toString()
  const cached = localStorage.getItem(key)
  if (cached) {
    const value = JSON.parse(cached)

    return [new PublicKey(value.key), parseInt(value.nonce)] as [
      PublicKey,
      number
    ]
  }

  const result = await PublicKey.findProgramAddress(seeds, programId)

  return [result[0], result[1]] as [PublicKey, number]
}
