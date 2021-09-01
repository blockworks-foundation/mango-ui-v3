import Head from 'next/head'
import { ThemeProvider } from 'next-themes'
import '../node_modules/react-grid-layout/css/styles.css'
import '../node_modules/react-resizable/css/styles.css'
import '../styles/index.css'
import useWallet from '../hooks/useWallet'
import useHydrateStore from '../hooks/useHydrateStore'
import Notifications from '../components/Notification'
import useLocalStorageState from '../hooks/useLocalStorageState'
import { XIcon } from '@heroicons/react/solid'

const SHOW_MESSAGE_KEY = 'v3Message-0.2'

function App({ Component, pageProps }) {
  const [showMessage, setShowMessage] = useLocalStorageState(
    SHOW_MESSAGE_KEY,
    true
  )
  useHydrateStore()
  useWallet()

  return (
    <>
      <Head>
        <title>Mango Markets</title>
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="keywords"
          content="Mango Markets, Serum, SRM, Serum DEX, DEFI, Decentralized Finance, Decentralised Finance, Crypto, ERC20, Ethereum, Decentralize, Solana, SOL, SPL, Cross-Chain, Trading, Fastest, Fast, SerumBTC, SerumUSD, SRM Tokens, SPL Tokens"
        />
        <meta
          name="description"
          content="Mango Markets - Decentralised, cross-margin trading up to 10x leverage with lightning speed and near-zero fees."
        />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Mango Markets" />
        <meta
          name="twitter:description"
          content="Mango Markets - Decentralised, cross-margin trading up to 10x leverage with lightning speed and near-zero fees."
        />
        <meta name="twitter:image" content="/twitter-image.png" />

        <script src="/datafeeds/udf/dist/polyfills.js"></script>
        <script src="/datafeeds/udf/dist/bundle.js"></script>

        <link rel="manifest" href="/manifest.json"></link>
      </Head>
      <ThemeProvider defaultTheme="Mango">
        <div className="bg-th-bkg-1">
          {showMessage ? (
            <div className="bg-th-bkg-4 p-3 mx-auto">
              <div className="flex">
                <button onClick={() => setShowMessage(false)}>
                  <XIcon className={`h-5 w-5 text-th-primary`} />
                </button>
                <div className="ml-6 text-th-fgd-2">
                  Mango Market V3 is in public beta. Please use{' '}
                  <a
                    href="https://v2.mango.markets"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    v2.mango.markets
                  </a>{' '}
                  to access your accounts in Mango V2.
                </div>
              </div>
            </div>
          ) : null}
          <Component {...pageProps} />
        </div>
        <Notifications />
      </ThemeProvider>
    </>
  )
}

export default App
