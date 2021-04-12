import { useEffect } from 'react'
import Wallet from '@project-serum/sol-wallet-adapter'
import useLocalStorageState from './useLocalStorageState'
import useMangoStore from '../stores/useMangoStore'
import { notify } from '../utils/notifications'

export const WALLET_PROVIDERS = [
  { name: 'sollet.io', url: 'https://www.sollet.io' },
]

const ENDPOINT = process.env.CLUSTER ? process.env.CLUSTER : 'mainnet-beta'

export default function useWallet() {
  const setMangoStore = useMangoStore((state) => state.set)
  const { current: wallet, connected } = useMangoStore((state) => state.wallet)
  const endpoint = useMangoStore((state) => state.connection.endpoint)
  const fetchWalletBalances = useMangoStore(
    (s) => s.actions.fetchWalletBalances
  )
  const [savedProviderUrl] = useLocalStorageState(
    'walletProvider',
    'https://www.sollet.io'
  )
  const providerUrl = savedProviderUrl
    ? savedProviderUrl
    : 'https://www.sollet.io'

  useEffect(() => {
    if (wallet) return
    console.log('creating wallet', endpoint)

    const newWallet = new Wallet(providerUrl, ENDPOINT)
    setMangoStore((state) => {
      state.wallet.current = newWallet
    })
    // eslint-disable-next-line
  }, [endpoint])

  useEffect(() => {
    if (!wallet) return
    wallet.on('connect', () => {
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
        state.wallet.connected = false
        state.marginAccounts = []
        state.selectedMarginAccount.current = null
      })
      notify({
        type: 'info',
        message: 'Disconnected from wallet',
      })
    })
    return () => {
      wallet.disconnect()
      setMangoStore((state) => {
        state.wallet.connected = false
      })
    }
  }, [wallet])

  useEffect(() => {
    fetchWalletBalances()
  }, [connected, fetchWalletBalances])

  return { wallet, connected }
}
