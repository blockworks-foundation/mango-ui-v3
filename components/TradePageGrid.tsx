import dynamic from 'next/dynamic'
import { Responsive, WidthProvider } from 'react-grid-layout'
import { Disclosure } from '@headlessui/react'
import { XIcon } from '@heroicons/react/outline'
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
import MarketPosition from './MarketPosition'
import { PerpMarket } from '@blockworks-foundation/mango-client'
import OpenOrdersTable from './OpenOrdersTable'
import MarketDetails from './MarketDetails'
import { CandlesIcon } from './icons'

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
    { i: 'tvChart', x: 0, y: 0, w: 12, h: 12, minW: 6 },
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

const TabContent = ({ activeTab, orderbookDepth }) => {
  const connected = useMangoStore((s) => s.wallet.connected)
  switch (activeTab) {
    case 'Trade':
      return (
        <>
          <div className="bg-th-bkg-2 grid grid-cols-12 grid-rows-1 gap-4 mb-2 px-2 py-3 rounded-lg">
            <div className="col-span-7">
              <TradeForm />
            </div>
            <div className="col-span-5">
              <Orderbook depth={orderbookDepth} />
            </div>
          </div>
          <RecentMarketTrades />
        </>
      )
    case 'Details':
      return (
        <div className="bg-th-bkg-2 px-2 py-3 rounded-lg">
          <MarketDetails />
        </div>
      )
    case 'Position':
      return (
        <FloatingElement className="py-0" showConnect>
          <div
            className={`${
              !connected ? 'filter blur-sm' : ''
            } bg-th-bkg-2 py-3 rounded-lg`}
          >
            <MarketPosition />
          </div>
        </FloatingElement>
      )
    case 'Orders':
      return (
        <FloatingElement
          className={`${!connected ? 'min-h-[216px]' : ''} py-0`}
          showConnect
        >
          <div
            className={`${
              !connected ? 'filter blur-sm' : ''
            } bg-th-bkg-2 py-3 rounded-lg`}
          >
            <OpenOrdersTable />
          </div>
        </FloatingElement>
      )
    default:
      return (
        <>
          <div className="bg-th-bkg-2 grid grid-cols-12 grid-rows-1 gap-4 mb-2 px-2 py-3 rounded-lg">
            <div className="col-span-7">
              <TradeForm />
            </div>
            <div className="col-span-5">
              <Orderbook depth={orderbookDepth} />
            </div>
          </div>
          <RecentMarketTrades />
        </>
      )
  }
}

const TradePageGrid = () => {
  const { uiLocked } = useMangoStore((s) => s.settings)
  const selectedMarket = useMangoStore((s) => s.selectedMarket.current)
  const [savedLayouts, setSavedLayouts] = useLocalStorageState(
    GRID_LAYOUT_KEY,
    defaultLayouts
  )
  const groupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const baseSymbol = marketConfig.baseSymbol
  const isPerpMarket = marketConfig.kind === 'perp'
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
  const [activeTab, setActiveTab] = useState('Trade')

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

  const TABS =
    selectedMarket instanceof PerpMarket
      ? ['Trade', 'Details', 'Position', 'Orders']
      : ['Trade', 'Details', 'Orders']

  const handleTabChange = (tabName) => {
    setActiveTab(tabName)
  }

  return !isMobile ? (
    <>
      <MarketDetails />
      <ResponsiveGridLayout
        className="layout"
        layouts={savedLayouts || defaultLayouts}
        breakpoints={breakpoints}
        cols={{ xl: 12, lg: 12, md: 12, sm: 12, xs: 1 }}
        rowHeight={15}
        isDraggable={!uiLocked}
        isResizable={!uiLocked}
        onBreakpointChange={(newBreakpoint) =>
          onBreakpointChange(newBreakpoint)
        }
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
          <FloatingElement showConnect>
            <TradeForm />
          </FloatingElement>
        </div>
        <div key="accountInfo">
          <FloatingElement showConnect>
            <AccountInfo />
          </FloatingElement>
        </div>
        <div key="userInfo">
          <FloatingElement showConnect>
            <UserInfo />
          </FloatingElement>
        </div>
        <div key="userMarketInfo">
          <FloatingElement showConnect>
            <UserMarketInfo />
          </FloatingElement>
        </div>
        <div key="marketTrades">
          <RecentMarketTrades />
        </div>
      </ResponsiveGridLayout>
    </>
  ) : (
    <>
      <div className="pb-12 pt-4">
        <div className="pb-2 px-3 relative">
          <div className="flex items-center">
            <img
              alt=""
              width="30"
              height="30"
              src={`/assets/icons/${baseSymbol.toLowerCase()}.svg`}
              className="mr-2"
            />
            <div className="flex items-center">
              <div className="font-semibold pr-0.5 text-xl">{baseSymbol}</div>
              <span className="text-th-fgd-4 text-xl">
                {isPerpMarket ? '-' : '/'}
              </span>
              <div className="font-semibold pl-0.5 text-xl">
                {isPerpMarket ? 'PERP' : groupConfig.quoteSymbol}
              </div>
            </div>
          </div>
          <Disclosure>
            {({ open }) => (
              <>
                <Disclosure.Button className="absolute right-3 top-0 ml-2">
                  <div className="bg-th-bkg-4 flex items-center justify-center rounded-full w-8 h-8 text-th-fgd-1 focus:outline-none hover:text-th-primary">
                    {open ? (
                      <XIcon className="h-4 w-4" />
                    ) : (
                      <CandlesIcon className="h-5 w-5" />
                    )}
                  </div>
                </Disclosure.Button>
                <Disclosure.Panel className="pt-3">
                  <div className="bg-th-bkg-2 h-96 mb-2 p-2 rounded-lg">
                    <TVChartContainer />
                  </div>
                </Disclosure.Panel>
              </>
            )}
          </Disclosure>
        </div>
        <div className={`border-b border-th-fgd-4 mb-4 px-3`}>
          <nav
            className={`-mb-px flex space-x-3 sm:space-x-6`}
            aria-label="Tabs"
          >
            {TABS.map((tabName) => (
              <a
                key={tabName}
                onClick={() => handleTabChange(tabName)}
                className={`whitespace-nowrap pt-2 pb-4 px-2 border-b-2 font-semibold cursor-pointer default-transition relative  hover:opacity-100
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
        <div className="mb-2">
          <TabContent activeTab={activeTab} orderbookDepth={orderbookDepth} />
        </div>
      </div>
    </>
  )
}

export default TradePageGrid
