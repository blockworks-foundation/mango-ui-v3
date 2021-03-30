import { useEffect, useMemo } from 'react'
import Wallet from '@project-serum/sol-wallet-adapter'
// import { notify } from './notifications'
import useLocalStorageState from './useLocalStorageState'
import useStore from './useStore'

export const WALLET_PROVIDERS = [
  { name: 'sollet.io', url: 'https://www.sollet.io' },
]

const ENDPOINT = process.env.CLUSTER ? process.env.CLUSTER : 'mainnet-beta'

export function useWallet() {
  const walletStore = useStore((state) => state.wallet)
  const [savedProviderUrl] = useLocalStorageState(
    'walletProvider',
    'https://www.sollet.io'
  )

  let providerUrl
  if (!savedProviderUrl) {
    providerUrl = 'https://www.sollet.io'
  } else {
    providerUrl = savedProviderUrl
  }

  const wallet =
    typeof window !== 'undefined'
      ? useMemo(() => new Wallet(providerUrl, ENDPOINT), [
          providerUrl,
          ENDPOINT,
        ])
      : {}

  useEffect(() => {
    wallet.on('connect', () => {
      walletStore.setConnected(true)
      console.log('connected!!!!')

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
      walletStore.setConnected(false)
      // notify({
      //   message: 'Wallet update',
      //   description: 'Disconnected from wallet',
      // })
      // localStorage.removeItem('feeDiscountKey')
    })
    return () => {
      wallet.disconnect()
      walletStore.setConnected(false)
    }
  }, [wallet])

  return wallet
}
