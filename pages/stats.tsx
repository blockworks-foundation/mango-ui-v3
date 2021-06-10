import { useState } from 'react'
import TopBar from '../components/TopBar'
import PageBodyContainer from '../components/PageBodyContainer'
import StatsTotals from '../components/stats-page/StatsTotals'
import StatsAssets from '../components/stats-page/StatsAssets'

const TABS = [
  'Totals',
  'Assets',
  // 'Markets',
  // 'Liquidations',
]

export default function StatsPage() {
  const [activeTab, setActiveTab] = useState(TABS[0])

  const handleTabChange = (tabName) => {
    setActiveTab(tabName)
  }

  return (
    <div className={`bg-th-bkg-1 text-th-fgd-1 transition-all`}>
      <TopBar />
      <PageBodyContainer>
        <div className="flex flex-col sm:flex-row pt-8 pb-3 sm:pb-6 md:pt-10">
          <h1 className={`text-th-fgd-1 text-2xl font-semibold`}>Stats</h1>
        </div>
        <div className="bg-th-bkg-2 overflow-none p-6 rounded-lg">
          <div className="border-b border-th-fgd-4 mb-4">
            <nav className={`-mb-px flex space-x-6`} aria-label="Tabs">
              {TABS.map((tabName) => (
                <a
                  key={tabName}
                  onClick={() => handleTabChange(tabName)}
                  className={`whitespace-nowrap pb-4 px-1 border-b-2 font-semibold cursor-pointer default-transition hover:opacity-100
                  ${
                    activeTab === tabName
                      ? `border-th-primary text-th-primary`
                      : `border-transparent text-th-fgd-4 hover:text-th-primary`
                  }
                `}
                >
                  {tabName}
                </a>
              ))}
            </nav>
          </div>
          <TabContent activeTab={activeTab} />
        </div>
      </PageBodyContainer>
    </div>
  )
}

const TabContent = ({ activeTab }) => {
  switch (activeTab) {
    case 'Totals':
      return <StatsTotals />
    case 'Assets':
      return <StatsAssets />
    case 'Markets':
      return <div>Markets</div>
    case 'Liquidations':
      return <div>Liquidations</div>
    default:
      return <StatsTotals />
  }
}
