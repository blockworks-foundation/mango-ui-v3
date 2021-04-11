import xw from 'xwind'
import TopBar from '../components/TopBar'
import Notifications from '../components/Notification'
import TradePageGrid from '../components/TradePageGrid'
import MarketSelect from '../components/MarketSelect'
import useHydrateStore from '../hooks/useHydrateStore'

const Index = () => {
  useHydrateStore()

  return (
    <div
      css={xw`bg-white dark:bg-mango-grey-darker text-black dark:text-white transition-all`}
    >
      <TopBar />
      <MarketSelect />
      <div css={xw`min-h-screen p-1 sm:p-2 md:p-6 md:pt-4`}>
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
