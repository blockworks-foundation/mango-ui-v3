import Head from 'next/head'
import { ThemeProvider } from 'next-themes'
import '../node_modules/react-grid-layout/css/styles.css'
import '../node_modules/react-resizable/css/styles.css'
import 'intro.js/introjs.css'
import '../styles/index.css'
import 'react-nice-dates/build/style.css'
import '../styles/datepicker.css'
import useHydrateStore from '../hooks/useHydrateStore'
import Notifications from '../components/Notification'
import useMangoStore from '../stores/useMangoStore'
import useOraclePrice from '../hooks/useOraclePrice'
import { getDecimalCount } from '../utils'
import { useRouter } from 'next/router'
import { ViewportProvider } from '../hooks/useViewport'
import BottomBar from '../components/mobile/BottomBar'
import { appWithTranslation } from 'next-i18next'
import ErrorBoundary from '../components/ErrorBoundary'
import GlobalNotification from '../components/GlobalNotification'
import { useOpenOrders } from '../hooks/useOpenOrders'
import usePerpPositions from '../hooks/usePerpPositions'
import { useEffect, useMemo } from 'react'
import { PublicKey } from '@solana/web3.js'
import { connectionSelector, mangoGroupSelector } from '../stores/selectors'
import {
  ReferrerIdRecordLayout,
  ReferrerIdRecord,
} from '@blockworks-foundation/mango-client'
import useTradeHistory from '../hooks/useTradeHistory'
import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'

import { WalletProvider, WalletListener } from 'components/WalletAdapter'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare'
import { SolletWalletAdapter } from '@solana/wallet-adapter-sollet'
import { SlopeWalletAdapter } from '@solana/wallet-adapter-slope'
import { BitpieWalletAdapter } from '@solana/wallet-adapter-bitpie'
import { HuobiWalletAdapter } from '@solana/wallet-adapter-huobi'
import { GlowWalletAdapter } from '@solana/wallet-adapter-glow'

const SENTRY_URL = process.env.NEXT_PUBLIC_SENTRY_URL
if (SENTRY_URL) {
  Sentry.init({
    dsn: SENTRY_URL,
    integrations: [new BrowserTracing()],
  })
}

const MangoStoreUpdater = () => {
  useHydrateStore()
  return null
}

const OpenOrdersStoreUpdater = () => {
  useOpenOrders()
  return null
}

const PerpPositionsStoreUpdater = () => {
  usePerpPositions()
  return null
}

const TradeHistoryStoreUpdater = () => {
  useTradeHistory()
  return null
}

const FetchReferrer = () => {
  const setMangoStore = useMangoStore((s) => s.set)
  const router = useRouter()
  const mangoGroup = useMangoStore(mangoGroupSelector)
  const connection = useMangoStore(connectionSelector)
  const { query } = router

  useEffect(() => {
    const storeReferrer = async () => {
      if (query.ref && mangoGroup) {
        let referrerPk
        if (query.ref.length === 44) {
          referrerPk = new PublicKey(query.ref)
        } else {
          let decodedRefLink: string | null = null
          try {
            decodedRefLink = decodeURIComponent(query.ref as string)
          } catch (e) {
            console.log('Failed to decode referrer link', e)
          }
          const mangoClient = useMangoStore.getState().connection.client
          if (!decodedRefLink) return

          const { referrerPda } = await mangoClient.getReferrerPda(
            mangoGroup,
            decodedRefLink
          )
          const info = await connection.getAccountInfo(referrerPda)
          if (info) {
            const decoded = ReferrerIdRecordLayout.decode(info.data)
            const referrerRecord = new ReferrerIdRecord(decoded)
            referrerPk = referrerRecord.referrerMangoAccount
          }
        }
        setMangoStore((state) => {
          state.referrerPk = referrerPk
        })
      }
    }

    storeReferrer()
  }, [query, mangoGroup])

  return null
}

const PageTitle = () => {
  const router = useRouter()
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const market = useMangoStore((s) => s.selectedMarket.current)
  const oraclePrice = useOraclePrice()
  const selectedMarketName = marketConfig.name
  const marketTitleString =
    marketConfig && router.pathname == '/'
      ? `${
          oraclePrice
            ? oraclePrice.toFixed(getDecimalCount(market?.tickSize)) + ' | '
            : ''
        }${selectedMarketName} - `
      : ''

  return (
    <Head>
      <title>{marketTitleString}Mango Markets</title>
    </Head>
  )
}

function App({ Component, pageProps }) {
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new SolletWalletAdapter(),
      new SlopeWalletAdapter(),
      new BitpieWalletAdapter(),
      new HuobiWalletAdapter(),
      new GlowWalletAdapter(),
    ],
    []
  )

  return (
    <>
      <Head>
        <title>Mango Markets</title>
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:title" content="Mango Markets" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="keywords"
          content="Mango Markets, Serum, SRM, Serum DEX, DEFI, Decentralized Finance, Decentralised Finance, Crypto, ERC20, Ethereum, Decentralize, Solana, SOL, SPL, Cross-Chain, Trading, Fastest, Fast, SerumBTC, SerumUSD, SRM Tokens, SPL Tokens"
        />
        <meta
          name="description"
          content="Mango Markets - Decentralised, cross-margin trading up to 10x leverage with lightning speed and near-zero fees."
        />
        <link
          rel="apple-touch-icon"
          sizes="192x192"
          href="/apple-touch-icon.png"
        />
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Mango Markets" />
        <meta
          name="twitter:description"
          content="Mango Markets - Decentralised, cross-margin trading up to 20x leverage with lightning speed and near-zero fees."
        />
        <meta
          name="twitter:image"
          content="https://www.mango.markets/socials/twitter-image-1200x600.png?34567878"
        />
        <meta name="google" content="notranslate" />
        <link rel="manifest" href="/manifest.json"></link>
      </Head>
      <ErrorBoundary>
        <PageTitle />
        <MangoStoreUpdater />
        <OpenOrdersStoreUpdater />
        <PerpPositionsStoreUpdater />
        <TradeHistoryStoreUpdater />
        <FetchReferrer />

        <ThemeProvider defaultTheme="Mango">
          <WalletProvider wallets={wallets}>
            <WalletListener />
            <ViewportProvider>
              <div className="min-h-screen bg-th-bkg-1">
                <GlobalNotification />
                <Component {...pageProps} />
              </div>
              <div className="fixed bottom-0 left-0 z-20 w-full md:hidden">
                <BottomBar />
              </div>

              <Notifications />
            </ViewportProvider>
          </WalletProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </>
  )
}

export default appWithTranslation(App)
