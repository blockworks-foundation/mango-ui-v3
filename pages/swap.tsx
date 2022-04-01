import { JupiterProvider } from '@jup-ag/react-hook'
import { useEffect } from 'react'
import useMangoStore from '../stores/useMangoStore'
import PageBodyContainer from '../components/PageBodyContainer'
import TopBar from '../components/TopBar'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { actionsSelector, connectionSelector } from '../stores/selectors'
import JupiterForm from '../components/JupiterForm'
import { zeroKey } from '@blockworks-foundation/mango-client'
import { useTranslation } from 'next-i18next'
import { useWallet } from '@solana/wallet-adapter-react'

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'swap'])),
      // Will be passed to the page component as props
    },
  }
}

export default function Swap() {
  const { t } = useTranslation(['common', 'swap'])
  const connection = useMangoStore(connectionSelector)
  const { connected, publicKey } = useWallet()
  const actions = useMangoStore(actionsSelector)

  useEffect(() => {
    if (connected) {
      actions.fetchWalletTokens()
    }
  }, [connected, actions])

  if (!connection) return null

  const userPublicKey =
    publicKey && !zeroKey.equals(publicKey) ? publicKey : undefined

  return (
    <JupiterProvider
      connection={connection}
      cluster="mainnet-beta"
      userPublicKey={connected ? userPublicKey : undefined}
    >
      <div className={`bg-th-bkg-1 text-th-fgd-1 transition-all`}>
        <TopBar />
        <PageBodyContainer>
          <div className="grid grid-cols-12">
            <div className="col-span-12 pt-8 pb-3 sm:pb-4 md:pt-10 xl:col-span-10 xl:col-start-2">
              <div className="mb-1 flex flex-col items-start md:flex-row md:items-end md:justify-between">
                <h1 className={`mb-1.5 md:mb-0`}>{t('swap')}</h1>
                <div className="flex flex-col md:items-end">
                  <p className="mb-0 text-xs">
                    {t('swap:swap-between-hundreds')}
                  </p>
                  <a
                    className="mb-0 text-xs text-th-fgd-2"
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
          <JupiterForm />
        </PageBodyContainer>
      </div>
    </JupiterProvider>
  )
}
