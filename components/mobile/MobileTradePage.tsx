import { useState } from 'react'
import { Disclosure } from '@headlessui/react'
import dynamic from 'next/dynamic'
import { XIcon } from '@heroicons/react/outline'
import useMangoStore from '../../stores/useMangoStore'
import { PerpMarket } from '@blockworks-foundation/mango-client'
import { CandlesIcon } from '../icons'
import SwipeableTabs from './SwipeableTabs'
import TradeForm from '../TradeForm'
import Orderbook from '../Orderbook'
import MarketBalances from '../MarketBalances'
import MarketDetails from '../MarketDetails'
import MarketPosition from '../MarketPosition'
import OpenOrdersTable from '../OpenOrdersTable'
import RecentMarketTrades from '../RecentMarketTrades'
import FloatingElement from '../FloatingElement'
import Swipeable from './Swipeable'

const TVChartContainer = dynamic(
  () => import('../../components/TradingView/index'),
  { ssr: false }
)

const MobileTradePage = () => {
  const [viewIndex, setViewIndex] = useState(0)
  //   const [, setRef] = useState(null)
  const selectedMarket = useMangoStore((s) => s.selectedMarket.current)
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const connected = useMangoStore((s) => s.wallet.connected)
  const groupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const baseSymbol = marketConfig.baseSymbol
  const isPerpMarket = marketConfig.kind === 'perp'

  const handleChangeViewIndex = (index) => {
    setViewIndex(index)
  }

  const TABS =
    selectedMarket instanceof PerpMarket
      ? ['Trade', 'Details', 'Position', 'Orders']
      : ['Trade', 'Details', 'Balances', 'Orders']

  //   const onRefChange = useCallback((node: SwipeableViews & HTMLDivElement) => {
  //     // hacky solution to update the height after the first render. Height is not set correctly on initial render
  //     setRef(node) // e.g. change ref state to trigger re-render
  //     if (node === null) {
  //       return
  //     } else {
  //       const interval = setInterval(() => {
  //         // @ts-ignore typings are not correct in this package
  //         node.updateHeight()
  //       }, 100)
  //       return () => clearInterval(interval)
  //     }
  //   }, [])

  return (
    <div className="pb-14 pt-4 px-2">
      <div className="pb-2 flex items-center justify-between">
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
              <Disclosure.Button>
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
      <SwipeableTabs
        onChange={handleChangeViewIndex}
        tabs={TABS}
        tabIndex={viewIndex}
      />
      <Swipeable index={viewIndex} onChangeIndex={handleChangeViewIndex}>
        <div>
          <div className="bg-th-bkg-2 grid grid-cols-12 grid-rows-1 gap-4 mb-2 px-2 py-3 rounded-lg">
            <div className="col-span-7">
              <TradeForm />
            </div>
            <div className="col-span-5">
              <Orderbook depth={8} />
            </div>
          </div>
          <RecentMarketTrades />
        </div>
        <div className="bg-th-bkg-2 px-2 py-3 rounded-lg">
          <MarketDetails />
        </div>
        {selectedMarket instanceof PerpMarket ? (
          <FloatingElement className="py-0" showConnect>
            <div
              className={`${
                !connected ? 'filter blur-sm' : ''
              } bg-th-bkg-2 py-3 rounded-lg`}
            >
              <MarketPosition />
            </div>
          </FloatingElement>
        ) : (
          <FloatingElement className="py-0" showConnect>
            <div
              className={`${
                !connected ? 'filter blur-sm' : ''
              } bg-th-bkg-2 py-3 rounded-lg`}
            >
              <MarketBalances />
            </div>
          </FloatingElement>
        )}
        <div>
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
        </div>
      </Swipeable>
    </div>
  )
}

export default MobileTradePage
