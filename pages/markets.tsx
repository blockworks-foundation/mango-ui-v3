import { useState } from 'react'
import PageBodyContainer from '../components/PageBodyContainer'
import TopBar from '../components/TopBar'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import MarketsTable from '../components/MarketsTable'
import Tabs from '../components/Tabs'

const TABS = ['futures', 'spot']

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'profile'])),
      // Will be passed to the page component as props
    },
  }
}

export default function Markets() {
  const [activeTab, setActiveTab] = useState('futures')
  const { t } = useTranslation(['common'])

  const handleTabChange = (tabName) => {
    setActiveTab(tabName)
  }

  return (
    <div className={`bg-th-bkg-1 text-th-fgd-1 transition-all`}>
      <TopBar />
      <PageBodyContainer>
        <div className="flex flex-col py-4 sm:flex-row md:pb-4 md:pt-10">
          <h1>{t('markets')}</h1>
        </div>
        <div className="md:rounded-lg md:bg-th-bkg-2 md:p-6">
          <div className="mb-0 sm:mb-6">
            <Tabs
              activeTab={activeTab}
              onChange={handleTabChange}
              tabs={TABS}
            />
          </div>
          <MarketsTable isPerpMarket={activeTab === 'futures'} />
        </div>
      </PageBodyContainer>
    </div>
  )
}
