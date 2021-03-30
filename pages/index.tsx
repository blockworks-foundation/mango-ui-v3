import xw from 'xwind'
import dynamic from 'next/dynamic'
import { Responsive, WidthProvider } from 'react-grid-layout'

const TVChartContainer = dynamic(
  () => import('../components/TradingView/index'),
  { ssr: false }
)
import TopBar from '../components/TopBar'
import Notifications from '../components/Notification'
import FloatingElement from '../components/FloatingElement'
// import Orderbook from '../components/Orderbook'
import useConnection from '../hooks/useConnection'
import useMarkets from '../hooks/useMarket'

const ResponsiveGridLayout = WidthProvider(Responsive)

const LAYOUTS = {
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

const Index = () => {
  useConnection()
  useMarkets()

  return (
    <div css={xw`bg-mango-dark text-white`}>
      <Notifications
        notifications={[
          { title: 'test', message: 'ok' },
          { title: 'test2', message: 'ok2' },
        ]}
      />
      <TopBar />
      <div css={xw`min-h-screen p-6`}>
        <ResponsiveGridLayout
          className="layout"
          layouts={LAYOUTS}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 0 }}
          cols={{ lg: 4, md: 3, sm: 2, xs: 1 }}
        >
          <div key="1">
            <FloatingElement>
              <TVChartContainer />
            </FloatingElement>
          </div>
          <div key="2">
            <FloatingElement>{/* <Orderbook /> */}</FloatingElement>
          </div>
          <div key="3">3</div>
          <div key="4">4</div>
          <div key="5">5</div>
          <div key="6">6</div>
          <div key="7">7</div>
        </ResponsiveGridLayout>
      </div>
    </div>
  )
}

export default Index
