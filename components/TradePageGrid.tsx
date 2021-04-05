// import xw from 'xwind'
import dynamic from 'next/dynamic'
import { Responsive, WidthProvider } from 'react-grid-layout'

const TVChartContainer = dynamic(
  () => import('../components/TradingView/index'),
  { ssr: false }
)
import FloatingElement from '../components/FloatingElement'
import Orderbook from '../components/Orderbook'
import MarginInfo from './MarginInfo'
import TradeForm from './TradeForm'
import UserInfo from './UserInfo'

const ResponsiveGridLayout = WidthProvider(Responsive)

const layouts = {
  xl: [
    { i: '1', x: 0, y: 0, w: 3, h: 2 },
    { i: '2', x: 3, y: 0, w: 1, h: 2 },
    { i: '3', x: 4, y: 0, w: 1, h: 1 },
    { i: '4', x: 4, y: 1, w: 1, h: 1 },
    { i: '5', x: 0, y: 2, w: 3, h: 1 },
    { i: '6', x: 3, y: 2, w: 1, h: 1 },
    { i: '7', x: 4, y: 2, w: 1, h: 1 },
  ],
  lg: [
    { i: '1', x: 0, y: 0, w: 2, h: 2 },
    { i: '2', x: 2, y: 0, w: 1, h: 2 },
    { i: '3', x: 3, y: 0, w: 1, h: 1 },
    { i: '4', x: 3, y: 1, w: 1, h: 1 },
    { i: '5', x: 0, y: 2, w: 2, h: 1 },
    { i: '6', x: 2, y: 2, w: 1, h: 1 },
    { i: '7', x: 3, y: 2, w: 1, h: 1 },
  ],
}

const TradePageGrid = () => {
  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={layouts}
      breakpoints={{ xl: 1600, lg: 1200, md: 996, sm: 768, xs: 0 }}
      cols={{ xl: 5, lg: 4, md: 3, sm: 2, xs: 1 }}
      rowHeight={300}
    >
      <div key="1">
        <FloatingElement>
          <TVChartContainer />
        </FloatingElement>
      </div>
      <div key="2">
        <FloatingElement>
          <Orderbook />
        </FloatingElement>
      </div>
      <div key="3">
        <TradeForm />
      </div>
      <div key="4">
        <MarginInfo />
      </div>
      <div key="5">
        <UserInfo />
      </div>
      <div key="6">6</div>
      <div key="7">7</div>
    </ResponsiveGridLayout>
  )
}

export default TradePageGrid
