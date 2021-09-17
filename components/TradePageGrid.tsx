import dynamic from 'next/dynamic'
import { Responsive, WidthProvider } from 'react-grid-layout'
import { Disclosure } from '@headlessui/react'
import { XIcon } from '@heroicons/react/outline'
import { round, max } from 'lodash'
import SwipeableViews from 'react-swipeable-views'

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
import MarketBalances from './MarketBalances'
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

const TradePageGrid = () => {
  const { uiLocked } = useMangoStore((s) => s.settings)
  const selectedMarket = useMangoStore((s) => s.selectedMarket.current)
  const [savedLayouts, setSavedLayouts] = useLocalStorageState(
    GRID_LAYOUT_KEY,
    defaultLayouts
  )
  const groupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const connected = useMangoStore((s) => s.wallet.connected)
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
  const [viewIndex, setViewIndex] = useState(0)

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
      : ['Trade', 'Details', 'Balances', 'Orders']

  const handleChangeViewIndex = (index) => {
    setViewIndex(index)
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
          <FloatingElement className="h-full pl-0">
            <TVChartContainer />
          </FloatingElement>
        </div>
        <div key="orderbook">
          <Orderbook depth={orderbookDepth} />
        </div>
        <div key="tradeForm">
          <FloatingElement className="h-full" showConnect>
            <TradeForm />
          </FloatingElement>
        </div>
        <div key="accountInfo">
          <FloatingElement className="h-full" showConnect>
            <AccountInfo />
          </FloatingElement>
        </div>
        <div key="userInfo">
          <FloatingElement className="h-full" showConnect>
            <UserInfo />
          </FloatingElement>
        </div>
        <div key="userMarketInfo">
          <FloatingElement className="h-full" showConnect>
            <UserMarketInfo />
          </FloatingElement>
        </div>
        <div key="marketTrades">
          <FloatingElement className="h-full">
            <RecentMarketTrades />
          </FloatingElement>
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
        <div className={`border-b border-th-fgd-4 mb-4 relative`}>
          <div
            className={`absolute bg-th-primary bottom-[-1px] default-transition left-0 h-0.5 w-16`}
            style={{
              transform: `translateX(${viewIndex * 100}%)`,
              width: `${100 / TABS.length}%`,
            }}
          />
          <nav className="-mb-px flex" aria-label="Tabs">
            {TABS.map((tabName, i) => (
              <a
                key={tabName}
                onClick={() => handleChangeViewIndex(i)}
                className={`cursor-pointer default-transition flex font-semibold justify-center pb-4 pt-2 relative whitespace-nowrap hover:opacity-100
                  ${
                    viewIndex === i
                      ? `text-th-primary`
                      : `text-th-fgd-4 hover:text-th-primary`
                  }
                `}
                style={{ width: `${100 / TABS.length}%` }}
              >
                {tabName}
              </a>
            ))}
          </nav>
        </div>
        <SwipeableViews
          enableMouseEvents
          index={viewIndex}
          onChangeIndex={handleChangeViewIndex}
        >
          <div>
            <div className="bg-th-bkg-2 grid grid-cols-12 grid-rows-1 gap-4 mb-2 mx-1 px-2 py-3 rounded-lg">
              <div className="col-span-7">
                <TradeForm />
              </div>
              <div className="col-span-5">
                <Orderbook depth={orderbookDepth} />
              </div>
            </div>
            <RecentMarketTrades />
          </div>
          <div className="bg-th-bkg-2 mx-1 px-2 py-3 rounded-lg">
            <MarketDetails />
          </div>
          {selectedMarket instanceof PerpMarket ? (
            <FloatingElement className="mx-1 py-0" showConnect>
              <div
                className={`${
                  !connected ? 'filter blur-sm' : ''
                } bg-th-bkg-2 py-3 rounded-lg`}
              >
                <MarketPosition />
              </div>
            </FloatingElement>
          ) : (
            <FloatingElement className="mx-1 py-0" showConnect>
              <div
                className={`${
                  !connected ? 'filter blur-sm' : ''
                } bg-th-bkg-2 py-3 rounded-lg`}
              >
                <MarketBalances />
              </div>
            </FloatingElement>
          )}
          <FloatingElement
            className={`${!connected ? 'min-h-[216px]' : ''} mx-1 py-0`}
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
        </SwipeableViews>
      </div>
    </>
  )
}

export default TradePageGrid
