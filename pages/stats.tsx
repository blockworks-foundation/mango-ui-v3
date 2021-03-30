import xw from 'xwind'
import TopBar from '../components/TopBar'

const Index = () => (
  <div css={xw`bg-mango-dark text-white`}>
    <TopBar />
    <div css={xw`grid justify-center items-center h-screen space-y-20`}>
      <div>Stats page here</div>
    </div>
  </div>
)

export default Index
