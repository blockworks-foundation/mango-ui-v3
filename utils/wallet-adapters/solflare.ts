import Solflare from '@solflare-wallet/sdk'

export function SolflareWalletAdapter(_, network) {
  return new Solflare({ network })
}
