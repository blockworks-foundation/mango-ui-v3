import xw from 'xwind'
import TopBar from '../components/TopBar'
import Notifications from '../components/Notification'
import TradePageGrid from '../components/TradePageGrid'
import MarketSelect from '../components/MarketSelect'
import useHydrateStore from '../hooks/useHydrateStore'

const Index = () => {
  useHydrateStore()

  return (
    <div css={xw`bg-mango-dark text-white`}>
      <TopBar />
      <div css={xw`min-h-screen p-1 sm:p-2 md:p-6 md:pt-4`}>
        <MarketSelect />
        <TradePageGrid />
      </div>
      <Notifications
        notifications={[
          { title: 'test', message: 'ok' },
          { title: 'test2', message: 'ok2' },
        ]}
      />
    </div>
  )
}

export default Index
