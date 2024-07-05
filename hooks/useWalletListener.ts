import { useEffect } from 'react'
import useMangoStore from 'stores/useMangoStore'
import { useWallet } from '@solana/wallet-adapter-react'

/*
 * This hook listens for when the Solana Wallet Adapter connects to a wallet.
 * When a wallet is connected we stitch the Solana Wallet Adapter wallet to our Mango Store's wallet.
 * Eventually we can remove this listener when we move to only use one Wallet, preferably the Wallet Adapter Wallet.
 */
export function useWalletListener() {
  const set = useMangoStore((s) => s.set)
  const actions = useMangoStore((s) => s.actions)
  const { wallet, connecting } = useWallet()

  useEffect(() => {
    const onConnect = async () => {
      if (!wallet) return
      set((state) => {
        state.selectedMangoAccount.initialLoad = true
      })

      await actions.fetchAllMangoAccounts(wallet)

      actions.fetchWalletTokens(wallet)
      actions.reloadOrders()
      actions.fetchTradeHistory()
    }

    if (connecting) {
      onConnect()
    }
  }, [connecting, set, actions, wallet])
}
