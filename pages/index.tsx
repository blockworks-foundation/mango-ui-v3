import xw from 'xwind'
import TopBar from '../components/TopBar'
import Notifications from '../components/Notification'
import TradePageGrid from '../components/TradePageGrid'

const Index = () => {
  return (
    <div css={xw`bg-mango-dark text-white`}>
      <TopBar />
      <div css={xw`min-h-screen p-1 sm:p-2 md:p-6`}>
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
