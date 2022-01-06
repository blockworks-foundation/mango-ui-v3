import { useEffect } from 'react'
import { useRouter } from 'next/router'
import useMangoGroupConfig from '../hooks/useMangoGroupConfig'
import useMangoStore from '../stores/useMangoStore'
import {
  getMarketByBaseSymbolAndKind,
  getMarketIndexBySymbol,
} from '@blockworks-foundation/mango-client'
import TopBar from '../components/TopBar'
import TradePageGrid from '../components/TradePageGrid'
import MarketSelect from '../components/MarketSelect'
import useLocalStorageState from '../hooks/useLocalStorageState'
import AlphaModal, { ALPHA_MODAL_KEY } from '../components/AlphaModal'
import { PageBodyWrapper } from '../components/styles'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import IntroTips, { SHOW_TOUR_KEY } from '../components/IntroTips'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from '../components/TradePageGrid'
import {
  marketConfigSelector,
  walletConnectedSelector,
} from '../stores/selectors'

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'tv-chart'])),
      // Will be passed to the page component as props
    },
  }
}

const PerpMarket = () => {
  const [alphaAccepted] = useLocalStorageState(ALPHA_MODAL_KEY, false)
  const [showTour] = useLocalStorageState(SHOW_TOUR_KEY, false)
  const groupConfig = useMangoGroupConfig()
  const setMangoStore = useMangoStore((s) => s.set)
  const connected = useMangoStore(walletConnectedSelector)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const marketConfig = useMangoStore(marketConfigSelector)
  const router = useRouter()
  const { width } = useViewport()
  const hideTips = width ? width < breakpoints.md : false

  useEffect(() => {
    const name = decodeURIComponent(router.asPath).split('name=')[1]
    const mangoGroup = useMangoStore.getState().selectedMangoGroup.current

    let marketQueryParam, marketBaseSymbol, marketType, newMarket, marketIndex
    if (name) {
      marketQueryParam = name.toString().split(/-|\//)
      marketBaseSymbol = marketQueryParam[0]
      marketType = marketQueryParam[1] === 'PERP' ? 'perp' : 'spot'

      newMarket = getMarketByBaseSymbolAndKind(
        groupConfig,
        marketBaseSymbol.toUpperCase(),
        marketType
      )
      marketIndex = getMarketIndexBySymbol(
        groupConfig,
        marketBaseSymbol.toUpperCase()
      )
    }

    if (name && mangoGroup) {
      const mangoCache = useMangoStore.getState().selectedMangoGroup.cache
      setMangoStore((state) => {
        state.selectedMarket.kind = marketType
        if (newMarket.name !== marketConfig.name) {
          // state.selectedMarket.current = null
          state.selectedMarket.config = newMarket
          state.tradeForm.price =
            state.tradeForm.tradeType === 'Limit'
              ? mangoGroup.getPrice(marketIndex, mangoCache).toFixed(2)
              : ''
        }
      })
    } else if (name && marketConfig) {
      // if mangoGroup hasn't loaded yet, set the marketConfig to the query param if different
      if (newMarket.name !== marketConfig.name) {
        setMangoStore((state) => {
          state.selectedMarket.kind = marketType
          state.selectedMarket.config = newMarket
        })
      }
    }
  }, [router, marketConfig])

  return (
    <div className={`bg-th-bkg-1 text-th-fgd-1 transition-all`}>
      {showTour && !hideTips ? (
        <IntroTips connected={connected} mangoAccount={mangoAccount} />
      ) : null}
      <TopBar />
      <MarketSelect />
      <PageBodyWrapper className="p-1 sm:px-2 sm:py-1 md:px-2 md:py-1">
        <TradePageGrid />
      </PageBodyWrapper>
      {!alphaAccepted && (
        <AlphaModal isOpen={!alphaAccepted} onClose={() => {}} />
      )}
    </div>
  )
}

export default PerpMarket
