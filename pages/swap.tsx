import { JupiterProvider } from '@jup-ag/react-hook'
import { useEffect } from 'react'
import useMangoStore from '../stores/useMangoStore'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { actionsSelector, connectionSelector } from '../stores/selectors'
import JupiterForm from '../components/JupiterForm'
import { zeroKey } from '@blockworks-foundation/mango-client'
import { useTranslation } from 'next-i18next'
import { useWallet } from '@solana/wallet-adapter-react'
import useLocalStorageState from 'hooks/useLocalStorageState'
import dayjs from 'dayjs'
import {
  InformationCircleIcon,
  LightningBoltIcon,
} from '@heroicons/react/solid'

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'common',
        'delegate',
        'swap',
        'profile',
      ])),
      // Will be passed to the page component as props
    },
  }
}

export default function Swap() {
  const { t } = useTranslation(['common', 'swap'])
  const connection = useMangoStore(connectionSelector)
  const { connected, publicKey, wallet } = useWallet()
  const actions = useMangoStore(actionsSelector)
  const [savedLanguage] = useLocalStorageState('language', '')

  useEffect(() => {
    dayjs.locale(savedLanguage == 'zh_tw' ? 'zh-tw' : savedLanguage)
  })

  useEffect(() => {
    if (wallet && connected) {
      actions.fetchWalletTokens(wallet)
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
      <div className="mb-1 flex flex-col items-start pt-6 pb-4 md:flex-row md:items-end md:justify-between">
        <div className="pb-1 md:pb-0">
          <h1 className={`mb-1`}>{t('swap')}</h1>
          <div className="flex items-center">
            <InformationCircleIcon className="mr-1 h-4 w-4 text-th-fgd-4" />
            <p className="mb-0 text-xs text-th-fgd-4">{t('swap:swap-desc')}</p>
          </div>
        </div>
        <div className="flex flex-col md:items-end md:pl-4">
          <a
            className="mb-0 flex items-center whitespace-nowrap text-xs text-th-fgd-2"
            href="https://jup.ag/swap/USDC-MNGO"
            target="_blank"
            rel="noopener noreferrer"
          >
            <LightningBoltIcon className="mr-1 h-4 w-4 text-th-fgd-4" />
            Powered by Jupiter
          </a>
        </div>
      </div>
      <JupiterForm />
    </JupiterProvider>
  )
}
