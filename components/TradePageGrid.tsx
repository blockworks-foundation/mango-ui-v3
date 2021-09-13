import dynamic from 'next/dynamic'
import { Responsive, WidthProvider } from 'react-grid-layout'
import { round, max } from 'lodash'

const TVChartContainer = dynamic(
  () => import('../components/TradingView/index'),
  { ssr: false }
)
import { useEffect, useState } from 'react'
import FloatingElement from '../components/FloatingElement'
import Orderbook from '../components/Orderbook'
import AccountInfo from './AccountInfo'
import UserMarketInfo from './UserMarketInfo'
import TradeForm from './TradeForm'
import UserInfo from './UserInfo'
import RecentMarketTrades from './RecentMarketTrades'
import useMangoStore from '../stores/useMangoStore'
import useLocalStorageState from '../hooks/useLocalStorageState'
import { useViewport } from '../hooks/useViewport'

const ResponsiveGridLayout = WidthProvider(Responsive)

export const defaultLayouts = {
  xl: [
    { i: 'tvChart', x: 0, y: 0, w: 6, h: 30 },
    { i: 'orderbook', x: 6, y: 0, w: 3, h: 17 },
    { i: 'tradeForm', x: 9, y: 1, w: 3, h: 14 },
    { i: 'marketTrades', x: 6, y: 1, w: 3, h: 13 },
    { i: 'accountInfo', x: 9, y: 3, w: 3, h: 15 },
    { i: 'userInfo', x: 0, y: 2, w: 9, h: 19 },
    { i: 'userMarketInfo', x: 9, y: 4, w: 3, h: 13 },
  ],
  lg: [
    { i: 'tvChart', x: 0, y: 0, w: 8, h: 28, minW: 2 },
    { i: 'userMarketInfo', x: 8, y: 0, w: 4, h: 13, minW: 2 },
    { i: 'accountInfo', x: 8, y: 1, w: 4, h: 15, minW: 2 },
    { i: 'orderbook', x: 0, y: 2, w: 4, h: 17, minW: 2 },
    { i: 'tradeForm', x: 4, y: 2, w: 4, h: 17, minW: 3 },
    { i: 'marketTrades', x: 8, y: 2, w: 4, h: 17, minW: 2 },
    { i: 'userInfo', x: 0, y: 3, w: 12, h: 19, minW: 6 },
  ],
  md: [
    { i: 'tvChart', x: 0, y: 0, w: 8, h: 28, minW: 2 },
    { i: 'userMarketInfo', x: 8, y: 0, w: 4, h: 13, minW: 2 },
    { i: 'accountInfo', x: 8, y: 1, w: 4, h: 15, minW: 2 },
    { i: 'orderbook', x: 0, y: 2, w: 4, h: 17, minW: 2 },
    { i: 'tradeForm', x: 4, y: 2, w: 4, h: 17, minW: 3 },
    { i: 'marketTrades', x: 8, y: 2, w: 4, h: 17, minW: 2 },
    { i: 'userInfo', x: 0, y: 3, w: 12, h: 19, minW: 6 },
  ],
  sm: [
    { i: 'tvChart', x: 0, y: 0, w: 12, h: 25, minW: 6 },
    { i: 'userMarketInfo', x: 0, y: 1, w: 6, h: 15, minW: 2 },
    { i: 'accountInfo', x: 6, y: 1, w: 6, h: 15, minW: 2 },
    { i: 'tradeForm', x: 0, y: 2, w: 12, h: 13, minW: 3 },
    { i: 'orderbook', x: 0, y: 3, w: 6, h: 17, minW: 3 },
    { i: 'marketTrades', x: 6, y: 3, w: 6, h: 17, minW: 2 },
    { i: 'userInfo', x: 0, y: 4, w: 12, h: 19, minW: 6 },
  ],
  xs: [
    { i: 'tvChart', x: 0, y: 0, w: 12, h: 15, minW: 6 },
    { i: 'userMarketInfo', x: 0, y: 1, w: 6, h: 13, minW: 2 },
    { i: 'accountInfo', x: 0, y: 2, w: 6, h: 15, minW: 2 },
    { i: 'tradeForm', x: 0, y: 3, w: 12, h: 13, minW: 3 },
    { i: 'orderbook', x: 0, y: 4, w: 6, h: 17, minW: 3 },
    { i: 'marketTrades', x: 0, y: 5, w: 6, h: 17, minW: 2 },
    { i: 'userInfo', x: 0, y: 6, w: 12, h: 19, minW: 6 },
  ],
}

export const GRID_LAYOUT_KEY = 'mangoSavedLayouts-3.0.8'
export const breakpoints = { xl: 1600, lg: 1200, md: 1110, sm: 768, xs: 0 }

const TradePageGrid = () => {
  const { uiLocked } = useMangoStore((s) => s.settings)
  const [savedLayouts, setSavedLayouts] = useLocalStorageState(
    GRID_LAYOUT_KEY,
    defaultLayouts
  )
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false

  const getCurrentBreakpoint = () => {
    return Responsive.utils.getBreakpointFromWidth(
      breakpoints,
      window.innerWidth - 63
    )
  }

  const onLayoutChange = (layouts) => {
    if (layouts) {
      setSavedLayouts(layouts)
    }
  }

  const onBreakpointChange = (newBreakpoint: string) => {
    setCurrentBreakpoint(newBreakpoint)
  }

  const [orderbookDepth, setOrderbookDepth] = useState(8)
  const [currentBreakpoint, setCurrentBreakpoint] = useState(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const adjustOrderBook = (layouts, breakpoint?: string | null) => {
      const bp = breakpoint ? breakpoint : getCurrentBreakpoint()
      const orderbookLayout = layouts[bp].find((obj) => {
        return obj.i === 'orderbook'
      })
      let depth = orderbookLayout.h * 0.891 - 7.2
      depth = round(max([1, depth]))
      setOrderbookDepth(depth)
    }

    adjustOrderBook(savedLayouts, currentBreakpoint)
  }, [currentBreakpoint, savedLayouts])

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return !isMobile ? (
    <ResponsiveGridLayout
      className="layout"
      layouts={savedLayouts || defaultLayouts}
      breakpoints={breakpoints}
      cols={{ xl: 12, lg: 12, md: 12, sm: 12, xs: 1 }}
      rowHeight={15}
      isDraggable={!uiLocked}
      isResizable={!uiLocked}
      onBreakpointChange={(newBreakpoint) => onBreakpointChange(newBreakpoint)}
      onLayoutChange={(layout, layouts) => onLayoutChange(layouts)}
    >
      <div key="tvChart">
        <FloatingElement className="pl-0">
          <TVChartContainer />
        </FloatingElement>
      </div>
      <div key="orderbook">
        <Orderbook depth={orderbookDepth} />
      </div>
      <div key="tradeForm">
        <TradeForm />
      </div>
      <div key="accountInfo">
        <AccountInfo />
      </div>
      <div key="userInfo">
        <UserInfo />
      </div>
      <div key="userMarketInfo">
        <UserMarketInfo />
      </div>
      <div key="marketTrades">
        <RecentMarketTrades />
      </div>
    </ResponsiveGridLayout>
  ) : (
    <>
      <div className="pb-16 pt-4 px-4">
        <div className="bg-th-bkg-2 h-96 mb-2 p-2 rounded-lg">
          <TVChartContainer />
        </div>
        <div className="mb-2">
          <UserMarketInfo />
        </div>
        <div className="mb-2">
          <AccountInfo />
        </div>
        <div className="mb-2">
          <Orderbook depth={orderbookDepth} />
        </div>
        <div className="mb-2">
          <RecentMarketTrades />
        </div>
        <UserInfo />
      </div>
      <div className="bottom-0 left-0 fixed w-full z-10">
        <TradeForm />
      </div>
    </>
  )
}

export default TradePageGrid
