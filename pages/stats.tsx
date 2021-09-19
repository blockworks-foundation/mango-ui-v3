import { useState } from 'react'
import TopBar from '../components/TopBar'
import PageBodyContainer from '../components/PageBodyContainer'
import StatsTotals from '../components/stats-page/StatsTotals'
import StatsAssets from '../components/stats-page/StatsAssets'
import StatsPerps from '../components/stats-page/StatsPerps'
import useMangoStats from '../hooks/useMangoStats'
import Swipeable from '../components/mobile/Swipeable'
import SwipeableTabs from '../components/mobile/SwipeableTabs'

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

  const handleChangeViewIndex = (index) => {
    setViewIndex(index)
  }

  return (
    <div className={`bg-th-bkg-1 text-th-fgd-1 transition-all`}>
      <TopBar />
      <PageBodyContainer>
        <div className="flex flex-col sm:flex-row py-4 md:pb-4 md:pt-10">
          <h1 className={`text-th-fgd-1 text-2xl font-semibold`}>Stats</h1>
        </div>
        <SwipeableTabs
          onChange={handleChangeViewIndex}
          tabs={TABS}
          tabIndex={viewIndex}
        />
        <div className="bg-th-bkg-2 p-4 sm:p-6 rounded-lg">
          <Swipeable index={viewIndex} onChangeIndex={handleChangeViewIndex}>
            <StatsTotals latestStats={latestStats} stats={stats} />
            <StatsAssets latestStats={latestStats} stats={stats} />
            <StatsPerps perpStats={perpStats} />
          </Swipeable>
        </div>
      </PageBodyContainer>
    </div>
  )
}
