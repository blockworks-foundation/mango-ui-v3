import { useEffect } from 'react'
import { useRouter } from 'next/router'
import useMangoGroupConfig from '../../hooks/useMangoGroupConfig'
import useMangoStore from '../../stores/useMangoStore'
import {
  getMarketByBaseSymbolAndKind,
  getMarketIndexBySymbol,
} from '@blockworks-foundation/mango-client'
import TopBar from '../../components/TopBar'
import TradePageGrid from '../../components/TradePageGrid'
import MarketSelect from '../../components/MarketSelect'
import MarketHeader from '../../components/MarketHeader'
import useLocalStorageState from '../../hooks/useLocalStorageState'
import AlphaModal, { ALPHA_MODAL_KEY } from '../../components/AlphaModal'
import { XIcon } from '@heroicons/react/solid'

export const SHOW_MESSAGE_KEY = 'v3Message-0.3'

const PerpMarket = () => {
  const [showMessage, setShowMessage] = useLocalStorageState(
    SHOW_MESSAGE_KEY,
    true
  )
  const [alphaAccepted] = useLocalStorageState(ALPHA_MODAL_KEY, false)
  const groupConfig = useMangoGroupConfig()
  const setMangoStore = useMangoStore((s) => s.set)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const router = useRouter()
  const { market } = router.query

  useEffect(() => {
    if (market && mangoGroup) {
      const newMarket = getMarketByBaseSymbolAndKind(
        groupConfig,
        market.toString().toUpperCase(),
        'perp'
      )
      const marketIndex = getMarketIndexBySymbol(
        groupConfig,
        market.toString().toUpperCase()
      )

      setMangoStore((state) => {
        state.selectedMarket.kind = 'perp'
        if (newMarket.name !== marketConfig.name) {
          state.selectedMarket.current = null
          state.selectedMarket.config = newMarket
          state.tradeForm.price =
            state.tradeForm.tradeType === 'Limit'
              ? mangoGroup.getPrice(marketIndex, mangoCache).toFixed(2)
              : ''
        }
      })
    }
  }, [market, mangoGroup])

  return (
    <div className={`bg-th-bkg-1 text-th-fgd-1 transition-all `}>
      {showMessage ? (
        <div className="bg-th-bkg-4 p-3 mx-auto">
          <div className="flex">
            <button onClick={() => setShowMessage(false)}>
              <XIcon className={`h-5 w-5 text-th-primary`} />
            </button>
            <div className="ml-6 text-th-fgd-2">
              Mango Market V3 is in public beta. Please use{' '}
              <a
                href="https://v2.mango.markets"
                target="_blank"
                rel="noopener noreferrer"
              >
                v2.mango.markets
              </a>{' '}
              to access your accounts in Mango V2.
            </div>
          </div>
        </div>
      ) : null}
      <TopBar />
      <MarketSelect />
      <MarketHeader />
      <div className={`min-h-screen p-1 sm:px-2 sm:py-1 md:px-2 md:py-1`}>
        <TradePageGrid />
      </div>
      {!alphaAccepted && (
        <AlphaModal isOpen={!alphaAccepted} onClose={() => {}} />
      )}
    </div>
  )
}

export default PerpMarket
