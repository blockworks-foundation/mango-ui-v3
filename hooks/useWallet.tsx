import { useEffect, useMemo } from 'react'
import Wallet from '@project-serum/sol-wallet-adapter'
import useLocalStorageState from './useLocalStorageState'
import useMangoStore from '../stores/useMangoStore'
import { notify } from '../utils/notifications'
import { WalletAdapter } from '../@types/types'
import { useTranslation } from 'next-i18next'
import { DEFAULT_PROVIDER, WALLET_PROVIDERS } from '../utils/wallet-adapters'

export const PROVIDER_LOCAL_STORAGE_KEY = 'walletProvider-0.1'

export default function useWallet() {
  const { t } = useTranslation('common')
  const setMangoStore = useMangoStore((state) => state.set)
  const {
    current: wallet,
    connected,
    providerUrl: selectedProviderUrl,
  } = useMangoStore((state) => state.wallet)
  const endpoint = useMangoStore((state) => state.connection.endpoint)
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
      await actions.fetchAllMangoAccounts()
      actions.fetchProfilePicture()
      actions.reloadOrders()
      actions.fetchTradeHistory()
      actions.fetchWalletTokens()

      // notify({
      //   title: t('wallet-connected'),
      //   description:
      //     t('connected-to') +
      //     wallet.publicKey.toString().substr(0, 5) +
      //     '...' +
      //     wallet.publicKey.toString().substr(-5),
      // })
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
        title: t('wallet-disconnected'),
      })
    })
  }, [wallet, setMangoStore])

  return { connected, wallet }
}
