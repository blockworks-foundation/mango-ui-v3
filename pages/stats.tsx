import { useEffect, useState } from 'react'
import TopBar from '../components/TopBar'
import PageBodyContainer from '../components/PageBodyContainer'
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
      ...(await serverSideTranslations(locale, ['common', 'profile'])),
      // Will be passed to the page component as props
    },
  }
}

export default function StatsPage() {
  const { t } = useTranslation('common')
  const TABS = ['Totals', 'Assets', 'Perps']
  const { latestStats, stats, perpStats, loadHistoricalStats, loadPerpStats } =
    useMangoStats()
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
    <div className={`bg-th-bkg-1 text-th-fgd-1 transition-all`}>
      <TopBar />
      <PageBodyContainer>
        <div className="flex flex-col py-4 sm:flex-row md:pb-4 md:pt-10">
          <h1>{t('stats')}</h1>
        </div>
        <div className="md:rounded-lg md:bg-th-bkg-2 md:p-6">
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
          {!isMobile ? (
            <TabContent
              activeTab={activeTab}
              latestStats={latestStats}
              perpStats={perpStats}
              stats={stats}
              loadHistoricalStats={loadHistoricalStats}
              loadPerpStats={loadPerpStats}
            />
          ) : (
            <Swipeable index={viewIndex} onChangeIndex={handleChangeViewIndex}>
              <StatsTotals
                latestStats={latestStats}
                stats={stats}
                loadHistoricalStats={loadHistoricalStats}
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
      </PageBodyContainer>
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
}) => {
  switch (activeTab) {
    case 'Totals':
      return (
        <StatsTotals
          latestStats={latestStats}
          stats={stats}
          loadHistoricalStats={loadHistoricalStats}
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
        />
      )
  }
}
