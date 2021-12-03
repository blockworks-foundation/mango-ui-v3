import { useEffect, useMemo } from 'react'
import Wallet from '@project-serum/sol-wallet-adapter'
import useLocalStorageState from './useLocalStorageState'
import useMangoStore from '../stores/useMangoStore'
import { notify } from '../utils/notifications'
import {
  PhantomWalletAdapter,
  SlopeWalletAdapter,
  SolletExtensionAdapter,
  SolflareExtensionWalletAdapter,
  BitpieWalletAdapter,
} from '../utils/wallet-adapters'
import { WalletAdapter } from '../@types/types'
import useInterval from './useInterval'
import { useTranslation } from 'next-i18next'

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
    name: 'Solflare',
    url: 'https://solflare.com',
    icon: `${ASSET_URL}/solflare.svg`,
    adapter: SolflareExtensionWalletAdapter,
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
  {
    name: 'Slope',
    url: 'https://www.slope.finance/#/wallet',
    icon: 'data:image/svg+xml;base64,PHN2ZyBmaWxsPSJub25lIiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIHdpZHRoPSIxMjgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNjQiIGN5PSI2NCIgZmlsbD0iIzZlNjZmYSIgcj0iNjQiLz48ZyBmaWxsPSIjZmZmIj48cGF0aCBkPSJtMzUuMTk2MyA1NC4zOTk4aDE5LjJ2MTkuMmgtMTkuMnoiLz48cGF0aCBkPSJtNzMuNTk3IDU0LjM5OTgtMTkuMiAxOS4ydi0xOS4ybDE5LjItMTkuMnoiIGZpbGwtb3BhY2l0eT0iLjQiLz48cGF0aCBkPSJtNzMuNTk3IDczLjU5OTgtMTkuMiAxOS4ydi0xOS4ybDE5LjItMTkuMnoiIGZpbGwtb3BhY2l0eT0iLjc1Ii8+PHBhdGggZD0ibTczLjYwNCA1NC4zOTk4aDE5LjJ2MTkuMmgtMTkuMnoiLz48cGF0aCBkPSJtNTQuMzk2OCAzNS4yIDE5LjItMTkuMnYxOS4ybC0xOS4yIDE5LjJoLTE5LjJ6IiBmaWxsLW9wYWNpdHk9Ii43NSIvPjxwYXRoIGQ9Im03My41OTE1IDkyLjgtMTkuMiAxOS4ydi0xOS4ybDE5LjItMTkuMmgxOS4yeiIgZmlsbC1vcGFjaXR5PSIuNCIvPjwvZz48L3N2Zz4=',
    adapter: SlopeWalletAdapter,
  },
  {
    name: 'Bitpie',
    url: 'https://bitpie.com',
    icon: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iNjRweCIgaGVpZ2h0PSI2NHB4IiB2aWV3Qm94PSIwIDAgNjQgNjQiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDYzLjEgKDkyNDUyKSAtIGh0dHBzOi8vc2tldGNoLmNvbSAtLT4KICAgIDx0aXRsZT5pY29uX2xvZ29AMng8L3RpdGxlPgogICAgPGRlc2M+Q3JlYXRlZCB3aXRoIFNrZXRjaC48L2Rlc2M+CiAgICA8ZGVmcz4KICAgICAgICA8bGluZWFyR3JhZGllbnQgeDE9IjUyLjU0NTc1MDElIiB5MT0iMTAwJSIgeDI9IjUyLjU0NTc1MDQlIiB5Mj0iMCUiIGlkPSJsaW5lYXJHcmFkaWVudC0xIj4KICAgICAgICAgICAgPHN0b3Agc3RvcC1jb2xvcj0iIzFFM0RBMCIgb2Zmc2V0PSIwJSI+PC9zdG9wPgogICAgICAgICAgICA8c3RvcCBzdG9wLWNvbG9yPSIjMzc1MERFIiBvZmZzZXQ9IjEwMCUiPjwvc3RvcD4KICAgICAgICA8L2xpbmVhckdyYWRpZW50PgogICAgICAgIDxsaW5lYXJHcmFkaWVudCB4MT0iNTAlIiB5MT0iMCUiIHgyPSI1MCUiIHkyPSIxMDAlIiBpZD0ibGluZWFyR3JhZGllbnQtMiI+CiAgICAgICAgICAgIDxzdG9wIHN0b3AtY29sb3I9IiMxRDNCQTMiIHN0b3Atb3BhY2l0eT0iMCIgb2Zmc2V0PSIwJSI+PC9zdG9wPgogICAgICAgICAgICA8c3RvcCBzdG9wLWNvbG9yPSIjMTczNzkzIiBzdG9wLW9wYWNpdHk9IjAuNjUyOTM4MTc5IiBvZmZzZXQ9IjEwMCUiPjwvc3RvcD4KICAgICAgICA8L2xpbmVhckdyYWRpZW50PgogICAgICAgIDxsaW5lYXJHcmFkaWVudCB4MT0iNTAlIiB5MT0iMTAwJSIgeDI9IjUwJSIgeTI9IjAlIiBpZD0ibGluZWFyR3JhZGllbnQtMyI+CiAgICAgICAgICAgIDxzdG9wIHN0b3AtY29sb3I9IiMxRTNEQTAiIG9mZnNldD0iMCUiPjwvc3RvcD4KICAgICAgICAgICAgPHN0b3Agc3RvcC1jb2xvcj0iIzM3NTBERSIgb2Zmc2V0PSIxMDAlIj48L3N0b3A+CiAgICAgICAgPC9saW5lYXJHcmFkaWVudD4KICAgIDwvZGVmcz4KICAgIDxnIGlkPSLorr7orqEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPgogICAgICAgIDxnIGlkPSJpY29uX2xvZ28iPgogICAgICAgICAgICA8cGF0aCBkPSJNMTgsMCBMNDYsMCBDNTUuOTQxMTI1NSwtMS44MjYxNTUxM2UtMTUgNjQsOC4wNTg4NzQ1IDY0LDE4IEw2NCw0NiBDNjQsNTUuOTQxMTI1NSA1NS45NDExMjU1LDY0IDQ2LDY0IEwxOCw2NCBDOC4wNTg4NzQ1LDY0IDEuMjE3NDM2NzVlLTE1LDU1Ljk0MTEyNTUgMCw0NiBMMCwxOCBDLTEuMjE3NDM2NzVlLTE1LDguMDU4ODc0NSA4LjA1ODg3NDUsMS44MjYxNTUxM2UtMTUgMTgsMCBaIiBpZD0iQ29tYmluZWQtU2hhcGUiIGZpbGw9InVybCgjbGluZWFyR3JhZGllbnQtMSkiPjwvcGF0aD4KICAgICAgICAgICAgPGNpcmNsZSBpZD0iT3ZhbC01IiBmaWxsPSIjRkZGRkZGIiBjeD0iMzIuMjg1NzE0MyIgY3k9IjMyLjI4NTcxNDMiIHI9IjI0LjI4NTcxNDMiPjwvY2lyY2xlPgogICAgICAgICAgICA8cGF0aCBkPSJNMzIsMCBDNDkuNjczMTEyLDAgNjQsMTQuMzI2ODg4IDY0LDMyIEM2NCw0OS42NzMxMTIgNDkuNjczMTEyLDY0IDMyLDY0IEMxNC4zMjY4ODgsNjQgMCw0OS42NzMxMTIgMCwzMiBDMCwxNC4zMjY4ODggMTQuMzI2ODg4LDAgMzIsMCBaIE0zMS44NTY1MDIyLDcuNjA1MzgxMTcgQzE4LjM4MzcyNjMsNy42MDUzODExNyA3LjQ2MTg4MzQxLDE4LjUyNzIyNCA3LjQ2MTg4MzQxLDMyIEM3LjQ2MTg4MzQxLDQ1LjQ3Mjc3NiAxOC4zODM3MjYzLDU2LjM5NDYxODggMzEuODU2NTAyMiw1Ni4zOTQ2MTg4IEM0NS4zMjkyNzgyLDU2LjM5NDYxODggNTYuMjUxMTIxMSw0NS40NzI3NzYgNTYuMjUxMTIxMSwzMiBDNTYuMjUxMTIxMSwxOC41MjcyMjQgNDUuMzI5Mjc4Miw3LjYwNTM4MTE3IDMxLjg1NjUwMjIsNy42MDUzODExNyBaIiBpZD0iQ29tYmluZWQtU2hhcGUiIGZpbGw9InVybCgjbGluZWFyR3JhZGllbnQtMikiPjwvcGF0aD4KICAgICAgICAgICAgPHBhdGggZD0iTTI5LjA5MDkwOTEsNDQuMzYzNjM2NCBDMjkuMDkwOTA5MSw0Ni4zNzE5NDQ1IDI3LjQ2Mjg1MzYsNDggMjUuNDU0NTQ1NSw0OCBDMjMuNDQ2MjM3Myw0OCAyMS44MTgxODE4LDQ2LjM3MTk0NDUgMjEuODE4MTgxOCw0NC4zNjM2MzY0IEwyMS44MTgsNDIuMTgxIEwxOS42MzYzNjM2LDQyLjE4MTgxODIgQzE3LjYyODA1NTUsNDIuMTgxODE4MiAxNiw0MC41NTM3NjI3IDE2LDM4LjU0NTQ1NDUgQzE2LDM2LjUzNzE0NjQgMTcuNjI4MDU1NSwzNC45MDkwOTA5IDE5LjYzNjM2MzYsMzQuOTA5MDkwOSBMMjEuODE4LDM0LjkwOSBMMjEuODE4LDI5LjA5IEwxOS42MzYzNjM2LDI5LjA5MDkwOTEgQzE3LjYyODA1NTUsMjkuMDkwOTA5MSAxNiwyNy40NjI4NTM2IDE2LDI1LjQ1NDU0NTUgQzE2LDIzLjQ0NjIzNzMgMTcuNjI4MDU1NSwyMS44MTgxODE4IDE5LjYzNjM2MzYsMjEuODE4MTgxOCBMMjEuODE4LDIxLjgxOCBMMjEuODE4MTgxOCwxOS42MzYzNjM2IEMyMS44MTgxODE4LDE3LjYyODA1NTUgMjMuNDQ2MjM3MywxNiAyNS40NTQ1NDU1LDE2IEMyNy40NjI4NTM2LDE2IDI5LjA5MDkwOTEsMTcuNjI4MDU1NSAyOS4wOTA5MDkxLDE5LjYzNjM2MzYgTDI5LjA5LDIxLjgxOCBMMzQuOTA5LDIxLjgxOCBMMzQuOTA5MDkwOSwxOS42MzYzNjM2IEMzNC45MDkwOTA5LDE3LjYyODA1NTUgMzYuNTM3MTQ2NCwxNiAzOC41NDU0NTQ1LDE2IEM0MC41NTM3NjI3LDE2IDQyLjE4MTgxODIsMTcuNjI4MDU1NSA0Mi4xODE4MTgyLDE5LjYzNjM2MzYgTDQyLjE4MSwyMS44MTggTDQ0LjM2MzYzNjQsMjEuODE4MTgxOCBDNDYuMzcxOTQ0NSwyMS44MTgxODE4IDQ4LDIzLjQ0NjIzNzMgNDgsMjUuNDU0NTQ1NSBDNDgsMjcuNDYyODUzNiA0Ni4zNzE5NDQ1LDI5LjA5MDkwOTEgNDQuMzYzNjM2NCwyOS4wOTA5MDkxIEw0Mi4xODEsMjkuMDkgTDQyLjE4MSwzNC45MDkgTDQ0LjM2MzYzNjQsMzQuOTA5MDkwOSBDNDYuMzcxOTQ0NSwzNC45MDkwOTA5IDQ4LDM2LjUzNzE0NjQgNDgsMzguNTQ1NDU0NSBDNDgsNDAuNTUzNzYyNyA0Ni4zNzE5NDQ1LDQyLjE4MTgxODIgNDQuMzYzNjM2NCw0Mi4xODE4MTgyIEw0Mi4xODEsNDIuMTgxIEw0Mi4xODE4MTgyLDQ0LjM2MzYzNjQgQzQyLjE4MTgxODIsNDYuMzcxOTQ0NSA0MC41NTM3NjI3LDQ4IDM4LjU0NTQ1NDUsNDggQzM2LjUzNzE0NjQsNDggMzQuOTA5MDkwOSw0Ni4zNzE5NDQ1IDM0LjkwOTA5MDksNDQuMzYzNjM2NCBMMzQuOTA5LDQyLjE4MSBMMjkuMDksNDIuMTgxIEwyOS4wOTA5MDkxLDQ0LjM2MzYzNjQgWiBNMjkuMDksMzQuOTA5IEwzNC45MDksMzQuOTA5IEwzNC45MDksMjkuMDkgTDI5LjA5LDI5LjA5IEwyOS4wOSwzNC45MDkgWiIgaWQ9IkNvbWJpbmVkLVNoYXBlIiBmaWxsPSJ1cmwoI2xpbmVhckdyYWRpZW50LTMpIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgzMi4wMDAwMDAsIDMyLjAwMDAwMCkgcm90YXRlKC0zMC4wMDAwMDApIHRyYW5zbGF0ZSgtMzIuMDAwMDAwLCAtMzIuMDAwMDAwKSAiPjwvcGF0aD4KICAgICAgICA8L2c+CiAgICA8L2c+Cjwvc3ZnPg==',
    adapter: BitpieWalletAdapter,
  },
]
export const PROVIDER_LOCAL_STORAGE_KEY = 'walletProvider-0.1'
export const DEFAULT_PROVIDER = WALLET_PROVIDERS[0]

export default function useWallet() {
  const { t } = useTranslation('common')
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
      await actions.fetchAllMangoAccounts()
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

  useInterval(() => {
    if (connected && mangoAccount) {
      actions.fetchWalletTokens()
      actions.fetchTradeHistory()
    }
  }, 90 * SECONDS)

  useInterval(() => {
    if (connected && mangoAccount) {
      actions.reloadMangoAccount()
    }
  }, 20 * SECONDS)

  return { connected, wallet }
}
