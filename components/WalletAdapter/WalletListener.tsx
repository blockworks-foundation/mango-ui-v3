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

  const {
    publicKey,
    wallet,
    signTransaction,
    signAllTransactions,
    connect,
    disconnect,
    connected,
  } = useWallet()

  const connecting = wallet?.adapter?.connecting

  useEffect(() => {
    const onConnect = async () => {
      set((state) => {
        state.selectedMangoAccount.initialLoad = true
        state.wallet.providerUrl = wallet.adapter.url
        state.wallet.connected = true
        state.wallet.current = {
          publicKey,
          connected: true,
          signTransaction,
          signAllTransactions,
          connect,
          disconnect,
        }
      })

      await actions.fetchAllMangoAccounts()

      actions.fetchProfilePicture()
      actions.reloadOrders()
      actions.fetchTradeHistory()
      actions.fetchWalletTokens()
    }

    if (connecting) {
      onConnect()
    }
  }, [
    connecting,
    connected,
    set,
    actions,
    wallet,
    publicKey,
    signAllTransactions,
    signTransaction,
    connect,
    disconnect,
  ])

  return null
}
