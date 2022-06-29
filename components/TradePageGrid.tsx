import dynamic from 'next/dynamic'
import { Responsive, WidthProvider } from 'react-grid-layout'
import round from 'lodash/round'
import max from 'lodash/max'
import MobileTradePage from './mobile/MobileTradePage'

const TVChartContainer = dynamic(
  () => import('../components/TradingView/index'),
  { ssr: false }
)
import { useEffect, useState } from 'react'
import FloatingElement from '../components/FloatingElement'
import Orderbook from '../components/Orderbook'
import TradeForm from './trade_form/TradeForm'
import UserInfo from './UserInfo'
import RecentMarketTrades from './RecentMarketTrades'
import useMangoStore from '../stores/useMangoStore'
import useLocalStorageState from '../hooks/useLocalStorageState'
import { useViewport } from '../hooks/useViewport'
import MarketDetails from './MarketDetails'

const ResponsiveGridLayout = WidthProvider(Responsive)

export const defaultLayouts = {
  xxl: [
    { i: 'tvChart', x: 0, y: 0, w: 8, h: 19 },
    { i: 'tradeForm', x: 8, y: 0, w: 2, h: 19 },
    { i: 'orderbook', x: 10, y: 0, w: 2, h: 25 },
    { i: 'marketTrades', x: 10, y: 1, w: 2, h: 13 },
    { i: 'userInfo', x: 0, y: 1, w: 10, h: 19 },
  ],
  xl: [
    { i: 'tvChart', x: 0, y: 0, w: 6, h: 19, minW: 2 },
    { i: 'tradeForm', x: 6, y: 0, w: 3, h: 19, minW: 3 },
    { i: 'orderbook', x: 9, y: 0, w: 3, h: 25, minW: 2 },
    { i: 'marketTrades', x: 9, y: 0, w: 3, h: 13, minW: 2 },
    { i: 'userInfo', x: 0, y: 1, w: 9, h: 19, minW: 6 },
  ],
  lg: [
    { i: 'tvChart', x: 0, y: 0, w: 6, h: 19, minW: 2 },
    { i: 'tradeForm', x: 6, y: 0, w: 3, h: 19, minW: 2 },
    { i: 'orderbook', x: 9, y: 0, w: 3, h: 25, minW: 2 },
    { i: 'marketTrades', x: 9, y: 1, w: 3, h: 13, minW: 2 },
    { i: 'userInfo', x: 0, y: 1, w: 9, h: 19, minW: 6 },
  ],
  md: [
    { i: 'tvChart', x: 0, y: 0, w: 12, h: 16, minW: 2 },
    { i: 'tradeForm', x: 0, y: 1, w: 4, h: 19, minW: 3 },
    { i: 'orderbook', x: 4, y: 1, w: 4, h: 19, minW: 2 },
    { i: 'marketTrades', x: 8, y: 1, w: 4, h: 19, minW: 2 },
    { i: 'userInfo', x: 0, y: 2, w: 12, h: 19, minW: 6 },
  ],
  sm: [
    { i: 'tvChart', x: 0, y: 0, w: 12, h: 20, minW: 6 },
    { i: 'tradeForm', x: 0, y: 1, w: 12, h: 17, minW: 6 },
    { i: 'orderbook', x: 0, y: 2, w: 6, h: 19, minW: 3 },
    { i: 'marketTrades', x: 6, y: 2, w: 6, h: 19, minW: 3 },
    { i: 'userInfo', x: 0, y: 3, w: 12, h: 19, minW: 6 },
  ],
}

export const GRID_LAYOUT_KEY = 'mangoSavedLayouts-3.1.9'
export const breakpoints = { xxl: 1600, xl: 1440, lg: 1170, md: 960, sm: 768 }

const getCurrentBreakpoint = () => {
  return Responsive.utils.getBreakpointFromWidth(
    breakpoints,
    window.innerWidth - 63
  )
}

const TradePageGrid: React.FC = () => {
  const [mounted, setMounted] = useState(false)
  const { uiLocked } = useMangoStore((s) => s.settings)
  const [savedLayouts, setSavedLayouts] = useLocalStorageState(
    GRID_LAYOUT_KEY,
    defaultLayouts
  )
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false

  const onLayoutChange = (layouts) => {
    if (layouts) {
      setSavedLayouts(layouts)
    }
  }

  const [orderbookDepth, setOrderbookDepth] = useState(10)
  const [currentBreakpoint, setCurrentBreakpoint] = useState<string | null>(
    null
  )

  const onBreakpointChange = (newBreakpoint: string) => {
    setCurrentBreakpoint(newBreakpoint)
  }

  useEffect(() => {
    const adjustOrderBook = (layouts, breakpoint?: string | null) => {
      const bp = breakpoint ? breakpoint : getCurrentBreakpoint()
      const orderbookLayout = layouts[bp].find((obj) => {
        return obj.i === 'orderbook'
      })
      let depth = orderbookLayout.h * 0.921 - 5
      const maxNum = max([1, depth])
      if (typeof maxNum === 'number') {
        depth = round(maxNum)
      }
      setOrderbookDepth(depth)
    }

    adjustOrderBook(savedLayouts, currentBreakpoint)
  }, [currentBreakpoint, savedLayouts])

  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  return !isMobile ? (
    <>
      <div className="pt-2">
        <MarketDetails />
      </div>
      <ResponsiveGridLayout
        layouts={savedLayouts ? savedLayouts : defaultLayouts}
        breakpoints={breakpoints}
        cols={{ xl: 12, lg: 12, md: 12, sm: 12 }}
        rowHeight={15}
        isDraggable={!uiLocked}
        isResizable={!uiLocked}
        onBreakpointChange={(newBreakpoint) =>
          onBreakpointChange(newBreakpoint)
        }
        onLayoutChange={(layout, layouts) => onLayoutChange(layouts)}
        measureBeforeMount
      >
        <div key="tvChart">
          <FloatingElement className="h-full pl-0 md:pl-0 md:pr-1 md:pb-1 md:pt-2.5">
            <TVChartContainer />
          </FloatingElement>
        </div>
        <div key="orderbook">
          <Orderbook depth={orderbookDepth} />
        </div>
        <div key="tradeForm">
          <TradeForm />
        </div>
        <div key="marketTrades">
          <FloatingElement className="h-full">
            <RecentMarketTrades />
          </FloatingElement>
        </div>
        <div key="userInfo">
          <FloatingElement className="h-full">
            <UserInfo />
          </FloatingElement>
        </div>
      </ResponsiveGridLayout>
    </>
  ) : (
    <MobileTradePage />
  )
}

export default TradePageGrid
