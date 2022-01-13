import { useMemo, useState } from 'react'
import { Disclosure } from '@headlessui/react'
import dynamic from 'next/dynamic'
import { XIcon } from '@heroicons/react/outline'
import useMangoStore from '../../stores/useMangoStore'
import { getWeights, PerpMarket } from '@blockworks-foundation/mango-client'
import { CandlesIcon } from '../icons'
import SwipeableTabs from './SwipeableTabs'
import AdvancedTradeForm from '../trade_form/AdvancedTradeForm'
import Orderbook from '../Orderbook'
import MarketBalances from '../MarketBalances'
import MarketDetails from '../MarketDetails'
import MarketPosition from '../MarketPosition'
import OpenOrdersTable from '../OpenOrdersTable'
import RecentMarketTrades from '../RecentMarketTrades'
import FloatingElement from '../FloatingElement'
import Swipeable from './Swipeable'
import { useTranslation } from 'next-i18next'
import Link from 'next/link'

const TVChartContainer = dynamic(
  () => import('../../components/TradingView/index'),
  { ssr: false }
)

const MobileTradePage = () => {
  const { t } = useTranslation('common')
  const [viewIndex, setViewIndex] = useState(0)
  const selectedMarket = useMangoStore((s) => s.selectedMarket.current)
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const connected = useMangoStore((s) => s.wallet.connected)
  const groupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const baseSymbol = marketConfig.baseSymbol
  const isPerpMarket = marketConfig.kind === 'perp'

  const handleChangeViewIndex = (index) => {
    setViewIndex(index)
  }

  const initLeverage = useMemo(() => {
    if (!mangoGroup || !marketConfig) return 1

    const ws = getWeights(mangoGroup, marketConfig.marketIndex, 'Init')
    const w =
      marketConfig.kind === 'perp' ? ws.perpAssetWeight : ws.spotAssetWeight
    return Math.round((100 * -1) / (w.toNumber() - 1)) / 100
  }, [mangoGroup, marketConfig])

  const TABS =
    selectedMarket instanceof PerpMarket
      ? ['Trade', 'Details', 'Position', 'Orders']
      : ['Trade', 'Details', 'Balances', 'Orders']

  return (
    <div className="pb-14 pt-4 px-2">
      <div className="relative">
        <Link href="/select">
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
            <span className="border border-th-primary ml-2 px-1 py-0.5 rounded text-xs text-th-primary">
              {initLeverage}x
            </span>
          </div>
        </Link>
        <Disclosure>
          {({ open }) => (
            <>
              <Disclosure.Button>
                <div className="absolute right-0 top-0 bg-th-bkg-4 flex items-center justify-center rounded-full w-8 h-8 text-th-fgd-1 focus:outline-none hover:text-th-primary">
                  {open ? (
                    <XIcon className="h-4 w-4" />
                  ) : (
                    <CandlesIcon className="h-5 w-5" />
                  )}
                </div>
              </Disclosure.Button>
              <Disclosure.Panel>
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
            <div className="col-span-7 pt-2">
              <AdvancedTradeForm />
            </div>
            <div className="col-span-5">
              <Orderbook depth={8} />
            </div>
          </div>
          <RecentMarketTrades />
        </div>
        <div className="bg-th-bkg-2 px-2 py-3 rounded-lg">
          <div className="pb-3.5 text-th-fgd-1 text-base">
            {t('market-details')}
          </div>
          <MarketDetails />
        </div>
        {selectedMarket instanceof PerpMarket ? (
          <FloatingElement className="py-0" showConnect>
            <div
              className={`${
                !connected ? 'filter blur-sm' : ''
              } bg-th-bkg-2 py-3 rounded-lg`}
            >
              <div className="pb-3.5 text-th-fgd-1 text-base">
                {`${marketConfig.name} ${t('position')}`}
              </div>
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
              <div className="pb-3.5 text-th-fgd-1 text-base">
                {t('balances')}
              </div>
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
              <div className="pb-3.5 text-th-fgd-1 text-base">
                {t('open-orders')}
              </div>
              <OpenOrdersTable />
            </div>
          </FloatingElement>
        </div>
      </Swipeable>
    </div>
  )
}

export default MobileTradePage
