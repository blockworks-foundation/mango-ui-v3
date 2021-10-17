import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { Responsive, WidthProvider } from 'react-grid-layout'
import TopBar from '../components/TopBar'
import MarketSelect from '../components/MarketSelect'
import useLocalStorageState from '../hooks/useLocalStorageState'
import { PageBodyWrapper } from '../components/styles'
import { DEFAULT_MARKET_KEY, initialMarket } from '../components/SettingsModal'
import {
  breakpoints,
  defaultLayouts,
  GRID_LAYOUT_KEY,
} from '../components/TradePageGrid'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
      // Will be passed to the page component as props
    },
  }
}

const ResponsiveGridLayout = WidthProvider(Responsive)

const Index = () => {
  const [defaultMarket] = useLocalStorageState(
    DEFAULT_MARKET_KEY,
    initialMarket
  )
  const [savedLayouts] = useLocalStorageState(GRID_LAYOUT_KEY, defaultLayouts)
  const router = useRouter()

  useEffect(() => {
    const { pathname } = router
    if (pathname == '/') {
      router.push(defaultMarket.path)
    }
  }, [])

  return (
    <div className={`bg-th-bkg-1 text-th-fgd-1 transition-all `}>
      <TopBar />
      <MarketSelect />
      <PageBodyWrapper className="p-1 sm:px-2 sm:py-1 md:px-2 md:py-1">
        <div className="animate animate-pulse bg-th-bkg-3 rounded-lg h-10 md:mb-1 mt-6 mx-2 md:mx-3" />
        <ResponsiveGridLayout
          className="layout"
          layouts={savedLayouts || defaultLayouts}
          breakpoints={breakpoints}
          cols={{ xl: 12, lg: 12, md: 12, sm: 12, xs: 1 }}
          rowHeight={15}
          isDraggable={false}
          isResizable={false}
          useCSSTransforms={false}
        >
          <div
            className="animate animate-pulse bg-th-bkg-3 rounded-lg"
            key="tvChart"
          ></div>
          <div
            className="animate animate-pulse bg-th-bkg-3 rounded-lg"
            key="orderbook"
          ></div>
          <div
            className="animate animate-pulse bg-th-bkg-3 rounded-lg"
            key="tradeForm"
          ></div>
          <div
            className="animate animate-pulse bg-th-bkg-3 rounded-lg"
            key="accountInfo"
          ></div>
          <div
            className="animate animate-pulse bg-th-bkg-3 rounded-lg"
            key="userInfo"
          ></div>
          <div
            className="animate animate-pulse bg-th-bkg-3 rounded-lg"
            key="marketPosition"
          ></div>
          <div
            className="animate animate-pulse bg-th-bkg-3 rounded-lg"
            key="marketTrades"
          ></div>
        </ResponsiveGridLayout>
      </PageBodyWrapper>
    </div>
  )
}

export default Index
