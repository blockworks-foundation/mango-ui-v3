import { useEffect, useState } from 'react'
import StatsTotals from '../components/stats_page/StatsTotals'
import StatsAssets from '../components/stats_page/StatsAssets'
import StatsPerps from '../components/stats_page/StatsPerps'
import useMangoStats from '../hooks/useMangoStats'
import Swipeable from '../components/mobile/Swipeable'
import SwipeableTabs from '../components/mobile/SwipeableTabs'
import Tabs from '../components/Tabs'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from '../components/TradePageGrid'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import useLocalStorageState from 'hooks/useLocalStorageState'
import dayjs from 'dayjs'

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

export default function StatsPage() {
  const { t } = useTranslation('common')
  const TABS = ['Totals', 'Assets', 'Perps']
  const {
    latestStats,
    loadLatestStats,
    stats,
    perpStats,
    loadHistoricalStats,
    loadPerpStats,
  } = useMangoStats()
  const [viewIndex, setViewIndex] = useState(0)
  const [activeTab, setActiveTab] = useState(TABS[0])
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false
  const [savedLanguage] = useLocalStorageState('language', '')

  useEffect(() => {
    dayjs.locale(savedLanguage == 'zh_tw' ? 'zh-tw' : savedLanguage)
  })

  const handleChangeViewIndex = (index) => {
    setViewIndex(index)
  }

  const handleTabChange = (tabName) => {
    setActiveTab(tabName)
  }

  return (
    <div className="pt-6">
      <div className="pb-4">
        <h1>{t('stats')}</h1>
      </div>
      {!isMobile ? (
        <Tabs activeTab={activeTab} onChange={handleTabChange} tabs={TABS} />
      ) : (
        <SwipeableTabs
          onChange={handleChangeViewIndex}
          items={TABS}
          tabIndex={viewIndex}
          width="w-full"
        />
      )}
      {!isMobile ? (
        <TabContent
          activeTab={activeTab}
          latestStats={latestStats}
          perpStats={perpStats}
          stats={stats}
          loadHistoricalStats={loadHistoricalStats}
          loadPerpStats={loadPerpStats}
          loadLatestStats={loadLatestStats}
        />
      ) : (
        <Swipeable index={viewIndex} onChangeIndex={handleChangeViewIndex}>
          <StatsTotals
            latestStats={latestStats}
            stats={stats}
            loadHistoricalStats={loadHistoricalStats}
            loadLatestStats={loadLatestStats}
          />
          <StatsAssets
            latestStats={latestStats}
            stats={stats}
            loadHistoricalStats={loadHistoricalStats}
          />
          <StatsPerps perpStats={perpStats} loadPerpStats={loadPerpStats} />
        </Swipeable>
      )}
    </div>
  )
}

const TabContent = ({
  activeTab,
  latestStats,
  perpStats,
  stats,
  loadHistoricalStats,
  loadPerpStats,
  loadLatestStats,
}) => {
  switch (activeTab) {
    case 'Totals':
      return (
        <StatsTotals
          latestStats={latestStats}
          stats={stats}
          loadHistoricalStats={loadHistoricalStats}
          loadLatestStats={loadLatestStats}
        />
      )
    case 'Assets':
      return (
        <StatsAssets
          latestStats={latestStats}
          stats={stats}
          loadHistoricalStats={loadHistoricalStats}
        />
      )
    case 'Perps':
      return <StatsPerps perpStats={perpStats} loadPerpStats={loadPerpStats} />
    default:
      return (
        <StatsTotals
          latestStats={latestStats}
          stats={stats}
          loadHistoricalStats={loadHistoricalStats}
          loadLatestStats={loadLatestStats}
        />
      )
  }
}
