import { useEffect, useMemo } from 'react'
import Wallet from '@project-serum/sol-wallet-adapter'
import useLocalStorageState from './useLocalStorageState'
import useMangoStore from '../stores/useMangoStore'
import { notify } from '../utils/notifications'
import {
  PhantomWalletAdapter,
  SolletExtensionAdapter,
} from '../utils/wallet-adapters'
import { WalletAdapter } from '../@types/types'
import useInterval from './useInterval'

const SECONDS = 1000
const ASSET_URL =
  'https://cdn.jsdelivr.net/gh/solana-labs/oyster@main/assets/wallets'

export const WALLET_PROVIDERS = [
  {
    name: 'Phantom',
    url: 'https://www.phantom.app',
    icon: `https://www.phantom.app/img/logo.png`,
    adapter: PhantomWalletAdapter,
  },
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
]
export const PROVIDER_LOCAL_STORAGE_KEY = 'walletProvider-0.1'
export const DEFAULT_PROVIDER = WALLET_PROVIDERS[0]

export default function useWallet() {
  const setMangoStore = useMangoStore((state) => state.set)
  const {
    current: wallet,
    connected,
    providerUrl: selectedProviderUrl,
  } = useMangoStore((state) => state.wallet)
  const endpoint = useMangoStore((state) => state.connection.endpoint)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const actions = useMangoStore((s) => s.actions)
  const [savedProviderUrl, setSavedProviderUrl] = useLocalStorageState(
    PROVIDER_LOCAL_STORAGE_KEY,
    DEFAULT_PROVIDER.url
  )
  const provider = useMemo(
    () => WALLET_PROVIDERS.find(({ url }) => url === savedProviderUrl),
    [savedProviderUrl]
  )

  useEffect(() => {
    if (selectedProviderUrl) {
      setSavedProviderUrl(selectedProviderUrl)
    }
  }, [selectedProviderUrl])

  useEffect(() => {
    if (provider) {
      const updateWallet = () => {
        // hack to also update wallet synchronously in case it disconnects
        // eslint-disable-next-line react-hooks/exhaustive-deps
        const wallet = new (provider.adapter || Wallet)(
          savedProviderUrl,
          endpoint
        ) as WalletAdapter
        setMangoStore((state) => {
          state.wallet.current = wallet
        })
      }

      if (document.readyState !== 'complete') {
        // wait to ensure that browser extensions are loaded
        const listener = () => {
          updateWallet()
          window.removeEventListener('load', listener)
        }
        window.addEventListener('load', listener)
        return () => window.removeEventListener('load', listener)
      } else {
        updateWallet()
      }
    }
  }, [provider, savedProviderUrl, endpoint])

  useEffect(() => {
    if (!wallet) return
    wallet.on('connect', async () => {
      setMangoStore((state) => {
        state.wallet.connected = true
      })
      // set connected before fetching data

      await actions.fetchMangoAccounts()
      actions.fetchTradeHistory()
      actions.fetchWalletTokens()
      notify({
        title: 'Wallet connected',
        description:
          'Connected to wallet ' +
          wallet.publicKey.toString().substr(0, 5) +
          '...' +
          wallet.publicKey.toString().substr(-5),
      })
    })
    wallet.on('disconnect', () => {
      console.log('disconnecting wallet')
      setMangoStore((state) => {
        state.wallet.connected = false
        state.mangoAccounts = []
        state.selectedMangoAccount.current = null
        state.tradeHistory = []
      })
      notify({
        type: 'info',
        title: 'Disconnected from wallet',
      })
    })
    return () => {
      if (wallet && wallet.connected) {
        console.log('DISCONNECTING')

        wallet.disconnect()
      }
      setMangoStore((state) => {
        state.wallet.connected = false
      })
    }
  }, [wallet, setMangoStore])

  useInterval(() => {
    if (connected && mangoAccount) {
      actions.fetchWalletTokens()
      actions.fetchTradeHistory()
    }
  }, 60 * SECONDS)

  useInterval(() => {
    if (connected && mangoAccount) {
      actions.fetchMangoAccounts()
    }
  }, 30 * SECONDS)

  return { connected, wallet }
}
