import Head from 'next/head'
import { ThemeProvider } from 'next-themes'
import '../node_modules/react-grid-layout/css/styles.css'
import '../node_modules/react-resizable/css/styles.css'
import 'intro.js/introjs.css'
import '../styles/index.css'
import useWallet from '../hooks/useWallet'
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
import { useEffect } from 'react'
import { PublicKey } from '@solana/web3.js'
import { connectionSelector, mangoGroupSelector } from '../stores/selectors'
import {
  ReferrerIdRecordLayout,
  ReferrerIdRecord,
} from '@blockworks-foundation/mango-client'

const MangoStoreUpdater = () => {
  useHydrateStore()
  return null
}

const WalletStoreUpdater = () => {
  useWallet()
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

const FetchReferrer = () => {
  const setMangoStore = useMangoStore((s) => s.set)
  const mangoGroup = useMangoStore(mangoGroupSelector)
  const connection = useMangoStore(connectionSelector)
  const router = useRouter()
  const { query } = router

  useEffect(() => {
    const storeReferrer = async () => {
      if (query.ref && mangoGroup) {
        let referrerPk
        if (query.ref.length === 44) {
          referrerPk = new PublicKey(query.ref)
        } else {
          let decodedRefLink: string
          try {
            decodedRefLink = decodeURIComponent(query.ref as string)
          } catch (e) {
            console.log('Failed to decode referrer link', e)
          }

          const mangoClient = useMangoStore.getState().connection.client
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
        <ErrorBoundary>
          <PageTitle />
          <MangoStoreUpdater />
          <WalletStoreUpdater />
          <OpenOrdersStoreUpdater />
          <PerpPositionsStoreUpdater />
          <FetchReferrer />
        </ErrorBoundary>

        <ThemeProvider defaultTheme="Mango">
          <ViewportProvider>
            <div className="min-h-screen bg-th-bkg-1">
              <ErrorBoundary>
                <GlobalNotification />
                <Component {...pageProps} />
              </ErrorBoundary>
            </div>
            <div className="fixed bottom-0 left-0 z-20 w-full md:hidden">
              <ErrorBoundary>
                <BottomBar />
              </ErrorBoundary>
            </div>

            <Notifications />
          </ViewportProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </>
  )
}

export default appWithTranslation(App)
