import TopBar from '../components/TopBar'
import TradePageGrid from '../components/TradePageGrid'
import MarketSelect from '../components/MarketSelect'
import AlphaModal, { ALPHA_MODAL_KEY } from '../components/AlphaModal'
import MarketHeader from '../components/MarketHeader'
import useLocalStorageState from '../hooks/useLocalStorageState'

const Index = () => {
  const [alphaAccepted] = useLocalStorageState(ALPHA_MODAL_KEY, false)

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

export default Index
