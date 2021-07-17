import { useEffect } from 'react'
import { useRouter } from 'next/router'
import useMangoGroupConfig from '../../hooks/useMangoGroupConfig'
import useMangoStore from '../../stores/useMangoStore'
import { getMarketByBaseSymbolAndKind } from '@blockworks-foundation/mango-client'
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
  const router = useRouter()
  const { market } = router.query

  useEffect(() => {
    if (market) {
      const newMarket = getMarketByBaseSymbolAndKind(
        groupConfig,
        market.toString().toUpperCase(),
        'spot'
      )
      setMangoStore((state) => {
        state.selectedMarket.current = null
        state.selectedMarket.config = newMarket
      })
    }
  }, [market])

  return (
    <div className={`bg-th-bkg-1 text-th-fgd-1 transition-all `}>
      <TopBar />
      <MarketSelect />
      <MarketHeader />
      <div className={`min-h-screen p-1 sm:px-2 sm:py-1 md:px-6 md:py-1`}>
        <TradePageGrid />
      </div>
      {!alphaAccepted && (
        <AlphaModal isOpen={!alphaAccepted} onClose={() => {}} />
      )}
    </div>
  )
}

export default SpotMarket
