import { useMemo, useState } from 'react'
import { Disclosure } from '@headlessui/react'
import dynamic from 'next/dynamic'
import { SwitchHorizontalIcon, XIcon } from '@heroicons/react/outline'
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
import { useWallet } from '@solana/wallet-adapter-react'

const TVChartContainer = dynamic(
  () => import('../../components/TradingView/index'),
  { ssr: false }
)

const MobileTradePage = () => {
  const { t } = useTranslation('common')
  const [viewIndex, setViewIndex] = useState(0)
  const { connected } = useWallet()
  const selectedMarket = useMangoStore((s) => s.selectedMarket.current)
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
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
    <div className="px-2 pb-14 pt-4">
      <div className="relative">
        <div className="flex items-center">
          <img
            alt=""
            width="30"
            height="30"
            src={`/assets/icons/${baseSymbol.toLowerCase()}.svg`}
            className="mr-2"
          />
          <div className="flex items-center">
            <div className="pr-0.5 text-xl font-semibold">{baseSymbol}</div>
            <span className="text-xl text-th-fgd-4">
              {isPerpMarket ? '-' : '/'}
            </span>
            <div className="pl-0.5 text-xl font-semibold">
              {isPerpMarket ? 'PERP' : groupConfig.quoteSymbol}
            </div>
          </div>
          <span className="ml-2 rounded border border-th-primary px-1 py-0.5 text-xs text-th-primary">
            {initLeverage}x
          </span>
          <Link href="/select">
            <div className="ml-2 flex h-10 w-10 items-center justify-center">
              <SwitchHorizontalIcon className="h-5 w-5" />
            </div>
          </Link>
        </div>
        <Disclosure>
          {({ open }) => (
            <>
              <Disclosure.Button>
                <div className="absolute right-0 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-th-bkg-4 text-th-fgd-1 hover:text-th-primary focus:outline-none">
                  {open ? (
                    <XIcon className="h-4 w-4" />
                  ) : (
                    <CandlesIcon className="h-5 w-5" />
                  )}
                </div>
              </Disclosure.Button>
              <Disclosure.Panel>
                <div className="mb-2 h-96 rounded-lg bg-th-bkg-2 p-2">
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
          <div className="mb-2 grid grid-cols-12 grid-rows-1 gap-4 rounded-lg py-2">
            <div className="col-span-7">
              <AdvancedTradeForm />
            </div>
            <div className="col-span-5">
              <Orderbook depth={8} />
            </div>
          </div>
          <RecentMarketTrades />
        </div>
        <div className="py-2">
          <h2 className="mb-3 text-base">{t('market-details')}</h2>
          <MarketDetails />
        </div>
        {selectedMarket instanceof PerpMarket ? (
          <FloatingElement className="bg-transparent px-0 py-0" showConnect>
            <div className={`${!connected ? 'blur-sm filter' : ''} py-2`}>
              <h2 className="mb-3 text-base">
                {`${marketConfig.name} ${t('position')}`}
              </h2>
              <MarketPosition />
            </div>
          </FloatingElement>
        ) : (
          <FloatingElement className="bg-transparent px-0 py-0" showConnect>
            <div className={`${!connected ? 'blur-sm filter' : ''} py-2`}>
              <h2 className="mb-3 text-base">{t('balances')}</h2>
              <MarketBalances />
            </div>
          </FloatingElement>
        )}
        <div>
          <FloatingElement
            className={`${
              !connected ? 'min-h-[216px]' : ''
            } bg-transparent px-0 py-0`}
            showConnect
          >
            <div className={`${!connected ? 'blur-sm filter' : ''} py-2`}>
              <h2 className="mb-3 text-base">{t('open-orders')}</h2>
              <OpenOrdersTable />
            </div>
          </FloatingElement>
        </div>
      </Swipeable>
    </div>
  )
}

export default MobileTradePage
