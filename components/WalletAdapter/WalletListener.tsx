import React, { useEffect } from 'react'
import useMangoStore from 'stores/useMangoStore'
import { useWallet } from '@solana/wallet-adapter-react'

/*
 * This component listens for when the Solana Wallet Adapter connects to a wallet.
 * When a wallet is connected we stitch the Solana Wallet Adapter wallet to our Mango Store's wallet.
 * Eventually we can remove this listener when we move to only use one Wallet, preferably the Wallet Adapter Wallet.
 */
export const WalletListener: React.FC = () => {
  const set = useMangoStore((s) => s.set)

  const actions = useMangoStore((s) => s.actions)

  const { wallet } = useWallet()

  const connecting = wallet?.adapter?.connecting

  useEffect(() => {
    const onConnect = async () => {
      if (!wallet) return
      set((state) => {
        state.selectedMangoAccount.initialLoad = true
      })

      await actions.fetchAllMangoAccounts(wallet)
      actions.fetchProfilePicture(wallet)

      actions.reloadOrders()
      actions.fetchTradeHistory()
      actions.fetchWalletTokens()
    }

    if (connecting) {
      onConnect()
    }
  }, [connecting, set, actions, wallet])

  return null
}
