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
import AlphaModal from '../../components/AlphaModal'
import useLocalStorageState from '../../hooks/useLocalStorageState'

const SpotMarket = () => {
  const [alphaAccepted] = useLocalStorageState('mangoAlphaAccepted-2.0', false)
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
        'spot'
      )
      const marketIndex = getMarketIndexBySymbol(
        groupConfig,
        market.toString().toUpperCase()
      )

      setMangoStore((state) => {
        state.selectedMarket.current = null
        state.selectedMarket.kind = 'spot'
        if (newMarket.name !== marketConfig.name) {
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

export default SpotMarket
