import { JupiterProvider } from '@jup-ag/react-hook'
import { useEffect } from 'react'
import useMangoStore from '../stores/useMangoStore'
import PageBodyContainer from '../components/PageBodyContainer'
import TopBar from '../components/TopBar'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
// import { useTranslation } from 'next-i18next'
import {
  actionsSelector,
  connectionSelector,
  walletConnectedSelector,
  walletSelector,
} from '../stores/selectors'
import JupiterForm from '../components/JupiterForm'
import { zeroKey } from '@blockworks-foundation/mango-client'

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
      // Will be passed to the page component as props
    },
  }
}

export default function Swap() {
  // const { t } = useTranslation('common')
  const connection = useMangoStore(connectionSelector)
  const connected = useMangoStore(walletConnectedSelector)
  const wallet = useMangoStore(walletSelector)
  const actions = useMangoStore(actionsSelector)

  useEffect(() => {
    // @ts-ignore
    if (window.solana) {
      // @ts-ignore
      window.solana.connect({ onlyIfTrusted: true })
    }
  }, [])

  useEffect(() => {
    if (connected) {
      actions.fetchWalletTokens()
    }
  }, [connected])

  if (!connection) return null

  const userPublicKey =
    wallet?.publicKey && !zeroKey.equals(wallet.publicKey)
      ? wallet.publicKey
      : null

  return (
    <JupiterProvider
      connection={connection}
      cluster="mainnet-beta"
      userPublicKey={connected ? userPublicKey : null}
    >
      <div className={`bg-th-bkg-1 text-th-fgd-1 transition-all`}>
        <TopBar />
        <PageBodyContainer>
          <div className="grid grid-cols-12">
            <div className="col-span-12 lg:col-span-10 lg:col-start-2 pt-8 pb-3 sm:pb-4 md:pt-10">
              <div className="flex flex-col items-start md:flex-row md:items-end md:justify-between mb-1">
                <h1
                  className={`mb-1.5 md:mb-0 text-th-fgd-1 text-2xl font-semibold`}
                >
                  Swap
                </h1>
                <div className="flex flex-col md:items-end">
                  <p className="mb-0 text-xs">
                    Swap between 100s of tokens at the best rates.
                  </p>
                  <a
                    className="mb-0 text-th-fgd-2 text-xs"
                    href="https://jup.ag/swap/USDC-MNGO"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Powered by Jupiter
                  </a>
                </div>
              </div>
            </div>
          </div>
          {wallet ? (
            <JupiterForm />
          ) : (
            <div className="bg-th-bkg-2 overflow-none p-4 sm:p-6 rounded-lg">
              test
            </div>
          )}
        </PageBodyContainer>
      </div>
    </JupiterProvider>
  )
}
