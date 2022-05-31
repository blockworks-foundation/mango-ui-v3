import { useState } from 'react'
import PageBodyContainer from '../components/PageBodyContainer'
import TopBar from '../components/TopBar'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import { PerpMarketsTable, SpotMarketsTable } from '../components/MarketsTable'
import Tabs from '../components/Tabs'
import SwipeableTabs from '../components/mobile/SwipeableTabs'
import Swipeable from '../components/mobile/Swipeable'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from '../components/TradePageGrid'

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
  const [viewIndex, setViewIndex] = useState(0)
  const { t } = useTranslation(['common'])
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false

  const handleTabChange = (tabName) => {
    setActiveTab(tabName)
  }

  const handleChangeViewIndex = (index) => {
    setViewIndex(index)
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
            {!isMobile ? (
              <Tabs
                activeTab={activeTab}
                onChange={handleTabChange}
                tabs={TABS}
              />
            ) : (
              <SwipeableTabs
                onChange={handleChangeViewIndex}
                items={TABS}
                tabIndex={viewIndex}
                width="w-full"
              />
            )}
          </div>
          {!isMobile ? (
            activeTab === 'futures' ? (
              <PerpMarketsTable />
            ) : (
              <SpotMarketsTable />
            )
          ) : (
            <Swipeable index={viewIndex} onChangeIndex={handleChangeViewIndex}>
              <div className="px-1">
                <PerpMarketsTable />
              </div>
              <div className="px-1">
                <SpotMarketsTable />
              </div>
            </Swipeable>
          )}
        </div>
      </PageBodyContainer>
    </div>
  )
}
