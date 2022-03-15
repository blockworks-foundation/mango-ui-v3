import React, { useEffect, useMemo } from 'react'
import {
  ConnectionProvider,
  useWallet,
  WalletProvider as SolanaWalletProvider,
} from '@solana/wallet-adapter-react'
import { useTranslation } from 'next-i18next'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { getWalletAdapters } from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'
import { notify } from 'utils/notifications'

import useMangoStore from 'stores/useMangoStore'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'

require('@solana/wallet-adapter-react-ui/styles.css')

const WalletListener: React.FC = () => {
  const set = useMangoStore((s) => s.set)
  const { t } = useTranslation('common')

  const actions = useMangoStore((s) => s.actions)

  const {
    publicKey,
    wallet,
    signTransaction,
    signAllTransactions,
    connect,
    disconnect,
    disconnecting,
    connecting,
  } = useWallet()

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

      await actions.fetchMangoGroup()

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
    set,
    actions,
    wallet,
    publicKey,
    signAllTransactions,
    signTransaction,
    connect,
    disconnect,
  ])

  useEffect(() => {
    if (disconnecting) {
      set((state) => {
        state.wallet.connected = false
        state.mangoAccounts = []
        state.selectedMangoAccount.current = null
        state.tradeHistory = { spot: [], perp: [] }
      })
      notify({
        type: 'info',
        title: t('wallet-disconnected'),
      })
    }
  }, [disconnecting, set, t])

  return null
}

export const WalletProvider: React.FC = ({ children }) => {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const network = WalletAdapterNetwork.Mainnet

  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => clusterApiUrl(network), [network])

  // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading --
  // Only the wallets you configure here will be compiled into your application, and only the dependencies
  // of wallets that your users connect to will be loaded.
  const wallets = getWalletAdapters({ network })

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletListener />
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  )
}
