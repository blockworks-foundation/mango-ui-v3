import { useEffect, useMemo } from 'react'
import Wallet from '@project-serum/sol-wallet-adapter'
import useLocalStorageState from './useLocalStorageState'
import useMangoStore from '../stores/useMangoStore'
import useAlertsStore from '../stores/useAlertsStore'
import { notify } from '../utils/notifications'
import {
  PhantomWalletAdapter,
  SolletExtensionAdapter,
} from '../utils/wallet-adapters'
import { WalletAdapter } from '../@types/types'
import useInterval from './useInterval'
import { sleep } from '@blockworks-foundation/mango-client'

const SECONDS = 1000
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

export const DEFAULT_PROVIDER = WALLET_PROVIDERS[0]

export default function useWallet() {
  const setMangoStore = useMangoStore((state) => state.set)
  const {
    current: wallet,
    connected,
    providerUrl: selectedProviderUrl,
  } = useMangoStore((state) => state.wallet)
  const endpoint = useMangoStore((state) => state.connection.endpoint)
  const marginAccount = useMangoStore((s) => s.selectedMarginAccount.current)
  const marginAccounts = useMangoStore((s) => s.marginAccounts)
  const marginAccountsPublicKey = marginAccounts.map((acc) => acc.publicKey)
  const actions = useMangoStore((s) => s.actions)
  const alertActions = useAlertsStore((s) => s.actions)
  const [savedProviderUrl, setSavedProviderUrl] = useLocalStorageState(
    'walletProvider',
    DEFAULT_PROVIDER.url
  )
  const provider = useMemo(
    () => WALLET_PROVIDERS.find(({ url }) => url === savedProviderUrl),
    [savedProviderUrl]
  )

  useEffect(() => {
    console.log('provider url changed', selectedProviderUrl)
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
      console.log('connected wallet')
      sleep(250)
      await actions.fetchMarginAccounts()
      setMangoStore((state) => {
        state.wallet.connected = true
      })
      // set connected before fetching data
      actions.fetchTradeHistory()
      // actions.fetchMangoSrmAccounts()
      actions.fetchWalletBalances()
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
      console.log('disconnecting wallet')
      setMangoStore((state) => {
        state.wallet.connected = false
        state.marginAccounts = []
        state.selectedMarginAccount.current = null
        state.tradeHistory = []
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
        state.wallet.connected = false
      })
    }
  }, [wallet, setMangoStore])

  useEffect(() => {
    if (connected && marginAccounts.length > 0) {
      alertActions.loadAlerts(marginAccountsPublicKey)
    }
  }, [connected, marginAccounts])

  useInterval(() => {
    if (connected && marginAccount) {
      actions.fetchMarginAccounts()
      actions.fetchWalletBalances()
      actions.fetchTradeHistory()
    }
  }, 180 * SECONDS)

  return { connected, wallet }
}
