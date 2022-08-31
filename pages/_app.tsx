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
import useMangoStore, { CLUSTER } from '../stores/useMangoStore'
import useOraclePrice from '../hooks/useOraclePrice'
import { getDecimalCount } from '../utils'
import { useRouter } from 'next/router'
import { ViewportProvider } from '../hooks/useViewport'
import { appWithTranslation } from 'next-i18next'
import ErrorBoundary from '../components/ErrorBoundary'
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
import {
  BackpackWalletAdapter,
  CoinbaseWalletAdapter,
  ExodusWalletAdapter,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  SolletWalletAdapter,
  SlopeWalletAdapter,
  BitpieWalletAdapter,
  GlowWalletAdapter,
  WalletConnectWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { HuobiWalletAdapter } from '@solana/wallet-adapter-huobi'
import useSpotBalances from 'hooks/useSpotBalances'
import Layout from 'components/Layout'
import Script from 'next/script'

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

const SpotBalancesStoreUpdater = () => {
  useSpotBalances()
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
      new BackpackWalletAdapter(),
      new CoinbaseWalletAdapter(),
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new ExodusWalletAdapter(),
      new SolletWalletAdapter(),
      new GlowWalletAdapter(),
      new SlopeWalletAdapter(),
      new BitpieWalletAdapter(),
      new HuobiWalletAdapter(),
      new WalletConnectWalletAdapter({
        network:
          CLUSTER === 'mainnet'
            ? WalletAdapterNetwork.Mainnet
            : WalletAdapterNetwork.Devnet,
        options: {
          // TODO: register Mango Markets to https://cloud.walletconnect.com/ and obtain projectId
          // projectId: 'e899c82be21d4acca2c8aec45e893598',
          metadata: {
            name: 'Mango Markets',
            description: 'Mango Markets',
            url: 'https://trade.mango.markets/',
            icons: ['https://trade.mango.markets/assets/icons/logo.svg'],
          },
        },
      }),
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
      <Script
        strategy="lazyOnload"
        src="https://www.googletagmanager.com/gtag/js?id=G-DH0283BKHZ"
      ></Script>
      <Script strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', 'G-DH0283BKHZ');
        `}
      </Script>
      <ThemeProvider defaultTheme="Mango">
        <ErrorBoundary>
          <WalletProvider wallets={wallets}>
            <PageTitle />
            <MangoStoreUpdater />
            <OpenOrdersStoreUpdater />
            <SpotBalancesStoreUpdater />
            <PerpPositionsStoreUpdater />
            <TradeHistoryStoreUpdater />
            <FetchReferrer />
            <WalletListener />
            <ViewportProvider>
              <div className="min-h-screen bg-th-bkg-1">
                <ErrorBoundary>
                  <Layout>
                    <Component {...pageProps} />
                  </Layout>
                </ErrorBoundary>
              </div>

              <Notifications />
            </ViewportProvider>
          </WalletProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </>
  )
}

export default appWithTranslation(App)
