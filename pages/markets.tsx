import { useState, useEffect } from 'react'
import PageBodyContainer from '../components/PageBodyContainer'
import TopBar from '../components/TopBar'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import MarketsTable from '../components/MarketsTable'
import Tabs from '../components/Tabs'

const TABS = ['perp', 'spot']

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
      // Will be passed to the page component as props
    },
  }
}

export default function Markets() {
  const [activeTab, setActiveTab] = useState('perp')
  const { t } = useTranslation(['common'])

  const handleTabChange = (tabName) => {
    setActiveTab(tabName)
  }

  useEffect(() => {
    // @ts-ignore
    if (window.solana) {
      // @ts-ignore
      window.solana.connect({ onlyIfTrusted: true })
    }
  }, [])

  const isPerp = activeTab === 'perp'

  return (
    <div className={`bg-th-bkg-1 text-th-fgd-1 transition-all`}>
      <TopBar />
      <PageBodyContainer>
        <div className="flex flex-col py-4 sm:flex-row md:pb-4 md:pt-10">
          <h1 className={`text-2xl font-semibold text-th-fgd-1`}>
            {t('markets')}
          </h1>
        </div>
        <div className="rounded-lg bg-th-bkg-2 p-4 sm:p-6">
          <Tabs activeTab={activeTab} onChange={handleTabChange} tabs={TABS} />
          <h2 className="mb-4">
            {isPerp
              ? `${t('perp')} ${t('markets')}`
              : `${t('spot')} ${t('markets')}`}
          </h2>
          <MarketsTable isPerpMarket={activeTab === 'perp'} />
        </div>
      </PageBodyContainer>
    </div>
  )
}
