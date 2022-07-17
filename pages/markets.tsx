import { useState } from 'react'
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
      ...(await serverSideTranslations(locale, [
        'common',
        'delegate',
        'profile',
      ])),
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
    <div className="pt-6">
      <div className="flex flex-col pb-4 sm:flex-row">
        <h1>{t('markets')}</h1>
      </div>
      <div>
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
    </div>
  )
}
