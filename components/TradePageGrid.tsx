import dynamic from 'next/dynamic'
import { Responsive, WidthProvider } from 'react-grid-layout'

const TVChartContainer = dynamic(
  () => import('../components/TradingView/index'),
  { ssr: false }
)
import FloatingElement from '../components/FloatingElement'
import Orderbook from '../components/Orderbook'
import MarginStats from './MarginStats'
import MarginBalances from './MarginBalances'
import TradeForm from './TradeForm'
import UserInfo from './UserInfo'
import RecentMarketTrades from './RecentMarketTrades'
import useMangoStore from '../stores/useMangoStore'

const ResponsiveGridLayout = WidthProvider(Responsive)

const layouts = {
  xl: [
    { i: 'tvChart', x: 0, y: 0, w: 3, h: 30 },
    { i: 'orderbook', x: 3, y: 0, w: 1, h: 17 },
    { i: 'tradeForm', x: 4, y: 0, w: 1, h: 17 },
    { i: 'marginStats', x: 4, y: 2, w: 1, h: 12 },
    { i: 'marketTrades', x: 3, y: 1, w: 1, h: 13 },
    { i: 'userInfo', x: 0, y: 2, w: 4, h: 17 },
    { i: 'balanceInfo', x: 4, y: 1, w: 1, h: 13 },
  ],
  lg: [
    { i: 'tvChart', x: 0, y: 0, w: 2, h: 24 },
    { i: 'balanceInfo', x: 2, y: 0, w: 1, h: 13 },
    { i: 'marginStats', x: 2, y: 1, w: 1, h: 11 },
    { i: 'orderbook', x: 0, y: 2, w: 1, h: 17 },
    { i: 'tradeForm', x: 1, y: 2, w: 1, h: 17 },
    { i: 'marketTrades', x: 2, y: 2, w: 1, h: 17 },
    { i: 'userInfo', x: 0, y: 3, w: 3, h: 17 },
  ],
}

const TradePageGrid = () => {
  const { uiLocked } = useMangoStore((s) => s.settings)

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={layouts}
      breakpoints={{ xl: 1600, lg: 1200, md: 996, sm: 768, xs: 0 }}
      cols={{ xl: 5, lg: 3, md: 3, sm: 2, xs: 1 }}
      rowHeight={15}
      isDraggable={!uiLocked}
      isResizable={!uiLocked}
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
      <div key="marginStats">
        <MarginStats />
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
