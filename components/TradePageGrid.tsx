import dynamic from 'next/dynamic'
import { Responsive, WidthProvider } from 'react-grid-layout'

const TVChartContainer = dynamic(
  () => import('../components/TradingView/index'),
  { ssr: false }
)
import { useEffect, useState } from 'react'
import FloatingElement from '../components/FloatingElement'
import Orderbook from '../components/Orderbook'
import MarginInfo from './MarginInfo'
import MarginBalances from './MarginBalances'
import TradeForm from './TradeForm'
import UserInfo from './UserInfo'
import RecentMarketTrades from './RecentMarketTrades'
import useMangoStore from '../stores/useMangoStore'
import useLocalStorageState from '../hooks/useLocalStorageState'

const ResponsiveGridLayout = WidthProvider(Responsive)

export const defaultLayouts = {
  xl: [
    { i: 'tvChart', x: 0, y: 0, w: 4, h: 30 },
    { i: 'orderbook', x: 4, y: 0, w: 2, h: 17 },
    { i: 'tradeForm', x: 6, y: 0, w: 2, h: 17 },
    { i: 'marketTrades', x: 4, y: 1, w: 2, h: 13 },
    { i: 'balanceInfo', x: 6, y: 1, w: 2, h: 13 },
    { i: 'userInfo', x: 0, y: 2, w: 6, h: 17 },
    { i: 'marginInfo', x: 6, y: 2, w: 2, h: 12 },
  ],
  lg: [
    { i: 'tvChart', x: 0, y: 0, w: 2, h: 24 },
    { i: 'balanceInfo', x: 2, y: 0, w: 1, h: 13 },
    { i: 'marginInfo', x: 2, y: 1, w: 1, h: 11 },
    { i: 'orderbook', x: 0, y: 2, w: 1, h: 17 },
    { i: 'tradeForm', x: 1, y: 2, w: 1, h: 17 },
    { i: 'marketTrades', x: 2, y: 2, w: 1, h: 17 },
    { i: 'userInfo', x: 0, y: 3, w: 3, h: 17 },
  ],
}

const TradePageGrid = () => {
  const { uiLocked } = useMangoStore((s) => s.settings)
  const [savedLayouts, setSavedLayouts] = useLocalStorageState(
    'savedLayouts',
    defaultLayouts
  )

  const onLayoutChange = (layouts) => {
    if (layouts) {
      setSavedLayouts(layouts)
    }
  }

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={savedLayouts || defaultLayouts}
      breakpoints={{ xl: 1600, lg: 1200, md: 1110, sm: 768, xs: 0 }}
      cols={{ xl: 8, lg: 3, md: 3, sm: 2, xs: 1 }}
      rowHeight={15}
      isDraggable={!uiLocked}
      isResizable={!uiLocked}
      onLayoutChange={(layout, layouts) => onLayoutChange(layouts)}
    >
      <div key="tvChart">
        <FloatingElement>
          <TVChartContainer />
        </FloatingElement>
      </div>
      <div key="orderbook">
        <FloatingElement>
          <Orderbook />
        </FloatingElement>
      </div>
      <div key="tradeForm">
        <TradeForm />
      </div>
      <div key="marginInfo">
        <MarginInfo />
      </div>
      <div key="userInfo">
        <UserInfo />
      </div>
      <div key="balanceInfo">
        <MarginBalances />
      </div>
      <div key="marketTrades">
        <RecentMarketTrades />
      </div>
    </ResponsiveGridLayout>
  )
}

export default TradePageGrid
