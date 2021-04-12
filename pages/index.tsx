import xw from 'xwind'
import TopBar from '../components/TopBar'
import Notifications from '../components/Notification'
import TradePageGrid from '../components/TradePageGrid'
import MarketSelect from '../components/MarketSelect'
import useHydrateStore from '../hooks/useHydrateStore'

const Index = () => {
  useHydrateStore()

  return (
    <div css={xw`bg-th-bkg-1 text-th-fgd-1 transition-all`}>
      <TopBar />
      <MarketSelect />
      <div css={xw`min-h-screen p-1 sm:p-2 md:p-6 md:pt-4`}>
        <TradePageGrid />
      </div>
      <Notifications />
    </div>
  )
}

export default Index
