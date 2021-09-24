import { useState } from 'react'
import TopBar from '../components/TopBar'
import PageBodyContainer from '../components/PageBodyContainer'
import StatsTotals from '../components/stats-page/StatsTotals'
import StatsAssets from '../components/stats-page/StatsAssets'
import StatsPerps from '../components/stats-page/StatsPerps'
import useMangoStats from '../hooks/useMangoStats'
import Swipeable from '../components/mobile/Swipeable'
import SwipeableTabs from '../components/mobile/SwipeableTabs'
import Tabs from '../components/Tabs'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from '../components/TradePageGrid'

const TABS = [
  'Totals',
  'Assets',
  'Perps',
  // 'Markets',
  // 'Liquidations',
]

export default function StatsPage() {
  const { latestStats, stats, perpStats } = useMangoStats()
  const [viewIndex, setViewIndex] = useState(0)
  const [activeTab, setActiveTab] = useState(TABS[0])
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false

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
        <div className="flex flex-col sm:flex-row py-4 md:pb-4 md:pt-10">
          <h1 className={`text-th-fgd-1 text-2xl font-semibold`}>Stats</h1>
        </div>
        {!isMobile ? (
          <Tabs activeTab={activeTab} onChange={handleTabChange} tabs={TABS} />
        ) : (
          <SwipeableTabs
            onChange={handleChangeViewIndex}
            tabs={TABS}
            tabIndex={viewIndex}
          />
        )}
        <div className="bg-th-bkg-2 p-4 sm:p-6 rounded-lg">
          {!isMobile ? (
            <TabContent
              activeTab={activeTab}
              latestStats={latestStats}
              perpStats={perpStats}
              stats={stats}
            />
          ) : (
            <Swipeable index={viewIndex} onChangeIndex={handleChangeViewIndex}>
              <StatsTotals latestStats={latestStats} stats={stats} />
              <StatsAssets latestStats={latestStats} stats={stats} />
              <StatsPerps perpStats={perpStats} />
            </Swipeable>
          )}
        </div>
      </PageBodyContainer>
    </div>
  )
}

const TabContent = ({ activeTab, latestStats, perpStats, stats }) => {
  switch (activeTab) {
    case 'Totals':
      return <StatsTotals latestStats={latestStats} stats={stats} />
    case 'Assets':
      return <StatsAssets latestStats={latestStats} stats={stats} />
    case 'Perps':
      return <StatsPerps perpStats={perpStats} />
    default:
      return <StatsTotals latestStats={latestStats} stats={stats} />
  }
}
