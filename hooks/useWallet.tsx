import { useEffect } from 'react'
import Wallet from '@project-serum/sol-wallet-adapter'
import useLocalStorageState from './useLocalStorageState'
import useMangoStore, { INITIAL_STATE } from '../stores/useMangoStore'
import { notify } from '../utils/notifications'
import {
  PhantomWalletAdapter,
  SolletExtensionAdapter,
} from '../utils/wallet-adapters'

const ASSET_URL =
  'https://cdn.jsdelivr.net/gh/solana-labs/oyster@main/assets/wallets'

export const WALLET_PROVIDERS = [
  {
    name: 'Sollet.io',
    url: 'https://www.sollet.io',
    icon: `${ASSET_URL}/sollet.svg`,
  },
  {
    name: 'Sollet Extension',
    url: 'https://www.sollet.io/extension',
    icon: `${ASSET_URL}/sollet.svg`,
    adapter: SolletExtensionAdapter as any,
  },
  {
    name: 'Phantom',
    url: 'https://www.phantom.app',
    icon: `https://www.phantom.app/img/logo.png`,
    adapter: PhantomWalletAdapter,
  },
]

export default function useWallet() {
  const setMangoStore = useMangoStore((state) => state.set)
  const { current: wallet, connected, providerUrl } = useMangoStore(
    (state) => state.wallet
  )
  const endpoint = useMangoStore((state) => state.connection.endpoint)
  const fetchWalletBalances = useMangoStore(
    (s) => s.actions.fetchWalletBalances
  )
  const [savedProviderUrl, setSavedProviderUrl] = useLocalStorageState(
    'walletProvider',
    'https://www.sollet.io'
  )

  useEffect(() => {
    if (providerUrl !== savedProviderUrl) {
      setSavedProviderUrl(providerUrl || savedProviderUrl)
      setMangoStore((state) => {
        state.wallet.providerUrl = providerUrl || savedProviderUrl
      })
    }
  }, [providerUrl, savedProviderUrl, setSavedProviderUrl])

  useEffect(() => {
    if (!providerUrl) return
    const provider = WALLET_PROVIDERS.find(({ url }) => url === providerUrl)
    const newWallet = new (provider?.adapter || Wallet)(providerUrl, endpoint)
    console.log('wallet', newWallet)

    setMangoStore((state) => {
      state.wallet.current = newWallet
    })
  }, [endpoint, providerUrl, setMangoStore])

  useEffect(() => {
    if (!wallet) return
    wallet.on('connect', () => {
      console.log('connected')

      setMangoStore((state) => {
        state.wallet.connected = true
      })
      notify({
        message: 'Wallet connected',
        description:
          'Connected to wallet ' +
          wallet.publicKey.toString().substr(0, 5) +
          '...' +
          wallet.publicKey.toString().substr(-5),
      })
    })
    wallet.on('disconnect', () => {
      setMangoStore((state) => {
        state.wallet = INITIAL_STATE.WALLET
        state.marginAccounts = []
        state.selectedMarginAccount.current = null
      })
      notify({
        type: 'info',
        message: 'Disconnected from wallet',
      })
    })
    return () => {
      if (wallet && wallet.connected) {
        console.log('DISCONNECTING')

        wallet.disconnect()
      }
      setMangoStore((state) => {
        state.wallet = INITIAL_STATE.WALLET
      })
    }
  }, [wallet, setMangoStore])

  useEffect(() => {
    fetchWalletBalances()
  }, [connected, fetchWalletBalances])

  return { connected, wallet }
}
