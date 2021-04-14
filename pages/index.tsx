import TopBar from '../components/TopBar'
import Notifications from '../components/Notification'
import TradePageGrid from '../components/TradePageGrid'
import MarketSelect from '../components/MarketSelect'
import useHydrateStore from '../hooks/useHydrateStore'
import useWallet from '../hooks/useWallet'

const Index = () => {
  useHydrateStore()
  useWallet()

  return (
    <div className={`bg-th-bkg-1 text-th-fgd-1 transition-all `}>
      <TopBar />
      <MarketSelect />
      <div className={`min-h-screen p-1 sm:px-2 sm:py-1 md:px-6 md:py-1`}>
        <TradePageGrid />
      </div>
      <Notifications />
    </div>
  )
}

export default Index
