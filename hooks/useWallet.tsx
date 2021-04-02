import { useEffect } from 'react'
import Wallet from '@project-serum/sol-wallet-adapter'
// import { notify } from './notifications'
import useLocalStorageState from './useLocalStorageState'
import useSolanaStore from '../stores/useSolanaStore'

export const WALLET_PROVIDERS = [
  { name: 'sollet.io', url: 'https://www.sollet.io' },
]

const ENDPOINT = process.env.CLUSTER ? process.env.CLUSTER : 'mainnet-beta'

export default function useWallet() {
  const setSolanaStore = useSolanaStore((state) => state.set)
  const { current: wallet, connected } = useSolanaStore((state) => state.wallet)
  const endpoint = useSolanaStore((state) => state.connection.endpoint)
  const [savedProviderUrl] = useLocalStorageState(
    'walletProvider',
    'https://www.sollet.io'
  )
  const providerUrl = savedProviderUrl
    ? savedProviderUrl
    : 'https://www.sollet.io'

  useEffect(() => {
    console.log('creating wallet', endpoint)

    const newWallet = new Wallet(providerUrl, ENDPOINT)
    setSolanaStore((state) => {
      state.wallet.current = newWallet
    })
  }, [endpoint])

  useEffect(() => {
    if (!wallet) return
    wallet.on('connect', () => {
      setSolanaStore((state) => {
        state.wallet.connected = true
      })
      console.log('connected!')

      // const walletPublicKey = wallet.publicKey.toBase58()
      // const keyToDisplay =
      //   walletPublicKey.length > 20
      //     ? `${walletPublicKey.substring(0, 7)}.....${walletPublicKey.substring(
      //         walletPublicKey.length - 7,
      //         walletPublicKey.length
      //       )}`
      //     : walletPublicKey
      // notify({
      //   message: 'Wallet update',
      //   description: 'Connected to wallet ' + keyToDisplay,
      // })
    })
    wallet.on('disconnect', () => {
      setSolanaStore((state) => {
        state.wallet.connected = false
      })
      // notify({
      //   message: 'Wallet update',
      //   description: 'Disconnected from wallet',
      // })
      // localStorage.removeItem('feeDiscountKey')
    })
    return () => {
      wallet.disconnect()
      setSolanaStore((state) => {
        state.wallet.connected = false
      })
    }
  }, [wallet])

  return { wallet, connected }
}
