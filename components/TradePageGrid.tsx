import dynamic from 'next/dynamic'
import { Responsive, WidthProvider } from 'react-grid-layout'
import { round, max } from 'lodash'
import MobileTradePage from './mobile/MobileTradePage'

const TVChartContainer = dynamic(
  () => import('../components/TradingView/index'),
  { ssr: false }
)
import { useEffect, useState } from 'react'
import FloatingElement from '../components/FloatingElement'
import Orderbook from '../components/Orderbook'
import AccountInfo from './AccountInfo'
import UserMarketInfo from './UserMarketInfo'
import TradeForm from './trade_form/TradeForm'
import UserInfo from './UserInfo'
import RecentMarketTrades from './RecentMarketTrades'
import useMangoStore from '../stores/useMangoStore'
import useLocalStorageState from '../hooks/useLocalStorageState'
import { useViewport } from '../hooks/useViewport'
import MarketDetails from './MarketDetails'
import useInterval from '../hooks/useInterval'
import useMangoGroupConfig from '../hooks/useMangoGroupConfig'

const ResponsiveGridLayout = WidthProvider(Responsive)

export const defaultLayouts = {
  xl: [
    { i: 'tvChart', x: 0, y: 0, w: 6, h: 27 },
    { i: 'marketPosition', x: 9, y: 4, w: 3, h: 13 },
    { i: 'accountInfo', x: 9, y: 3, w: 3, h: 14 },
    { i: 'orderbook', x: 6, y: 0, w: 3, h: 17 },
    { i: 'tradeForm', x: 9, y: 1, w: 3, h: 17 },
    { i: 'marketTrades', x: 6, y: 1, w: 3, h: 10 },
    { i: 'userInfo', x: 0, y: 2, w: 9, h: 19 },
  ],
  lg: [
    { i: 'tvChart', x: 0, y: 0, w: 6, h: 27, minW: 2 },
    { i: 'marketPosition', x: 9, y: 2, w: 3, h: 13, minW: 2 },
    { i: 'accountInfo', x: 9, y: 1, w: 3, h: 14, minW: 2 },
    { i: 'orderbook', x: 6, y: 2, w: 3, h: 17, minW: 2 },
    { i: 'tradeForm', x: 9, y: 0, w: 3, h: 17, minW: 3 },
    { i: 'marketTrades', x: 6, y: 2, w: 3, h: 10, minW: 2 },
    { i: 'userInfo', x: 0, y: 3, w: 9, h: 19, minW: 6 },
  ],
  md: [
    { i: 'tvChart', x: 0, y: 0, w: 8, h: 25, minW: 2 },
    { i: 'marketPosition', x: 8, y: 1, w: 4, h: 11, minW: 2 },
    { i: 'accountInfo', x: 8, y: 0, w: 4, h: 14, minW: 2 },
    { i: 'orderbook', x: 0, y: 2, w: 4, h: 19, minW: 2 },
    { i: 'tradeForm', x: 4, y: 2, w: 4, h: 19, minW: 3 },
    { i: 'marketTrades', x: 8, y: 2, w: 4, h: 19, minW: 2 },
    { i: 'userInfo', x: 0, y: 3, w: 12, h: 19, minW: 6 },
  ],
  sm: [
    { i: 'tvChart', x: 0, y: 0, w: 12, h: 20, minW: 6 },
    { i: 'marketPosition', x: 0, y: 1, w: 6, h: 14, minW: 6 },
    { i: 'accountInfo', x: 6, y: 1, w: 6, h: 14, minW: 6 },
    { i: 'tradeForm', x: 0, y: 2, w: 12, h: 17, minW: 6 },
    { i: 'orderbook', x: 0, y: 3, w: 6, h: 17, minW: 6 },
    { i: 'marketTrades', x: 6, y: 3, w: 6, h: 17, minW: 6 },
    { i: 'userInfo', x: 0, y: 4, w: 12, h: 19, minW: 6 },
  ],
}

export const GRID_LAYOUT_KEY = 'mangoSavedLayouts-3.1.6'
export const breakpoints = { xl: 1600, lg: 1280, md: 1024, sm: 768 }
const SECONDS = 1000

const getCurrentBreakpoint = () => {
  return Responsive.utils.getBreakpointFromWidth(
    breakpoints,
    window.innerWidth - 63
  )
}

const TradePageGrid = () => {
  const { uiLocked } = useMangoStore((s) => s.settings)
  const [savedLayouts, setSavedLayouts] = useLocalStorageState(
    GRID_LAYOUT_KEY,
    defaultLayouts
  )
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false
  const actions = useMangoStore((s) => s.actions)
  const groupConfig = useMangoGroupConfig()
  const markets = [...groupConfig.spotMarkets, ...groupConfig.perpMarkets]

  const onLayoutChange = (layouts) => {
    if (layouts) {
      setSavedLayouts(layouts)
    }
  }

  const onBreakpointChange = (newBreakpoint: string) => {
    console.log('new breakpoint', newBreakpoint)
    setCurrentBreakpoint(newBreakpoint)
  }

  const [orderbookDepth, setOrderbookDepth] = useState(10)
  const [currentBreakpoint, setCurrentBreakpoint] = useState(null)
  const [mounted, setMounted] = useState(false)
  const [trigger, setTrigger] = useState(true)

  useEffect(() => {
    const adjustOrderBook = (layouts, breakpoint?: string | null) => {
      const bp = breakpoint ? breakpoint : getCurrentBreakpoint()
      const orderbookLayout = layouts[bp].find((obj) => {
        return obj.i === 'orderbook'
      })
      let depth = orderbookLayout.h * 0.891 - 5
      depth = round(max([1, depth]))
      setOrderbookDepth(depth)
    }

    adjustOrderBook(savedLayouts, currentBreakpoint)
  }, [currentBreakpoint, savedLayouts])

  useEffect(() => setMounted(true), [])

  useInterval(() => {
    setTrigger(true)
  }, 120 * SECONDS)

  if (trigger) {
    actions.fetchMarketInfo(markets)
  }

  useEffect(() => {
    if (trigger) {
      setTrigger(false)
    }
  }, [trigger])

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
        <div key="accountInfo">
          <FloatingElement className="h-full" showConnect>
            <AccountInfo />
          </FloatingElement>
        </div>
        <div key="marketPosition">
          <FloatingElement className="h-full" showConnect>
            <UserMarketInfo />
          </FloatingElement>
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
