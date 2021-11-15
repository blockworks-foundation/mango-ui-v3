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
  const groupConfig = useMangoGroupConfig()
  const setMangoStore = useMangoStore((s) => s.set)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const router = useRouter()

  useEffect(() => {
    // @ts-ignore
    if (window.solana) {
      // @ts-ignore
      window.solana.connect({ onlyIfTrusted: true })
    }
  }, [])

  useEffect(() => {
    const name = decodeURIComponent(router.asPath).split('name=')[1]

    if (name && mangoGroup) {
      const marketQueryParam = name.toString().split(/-|\//)
      const marketBaseSymbol = marketQueryParam[0]
      const marketType = marketQueryParam[1] === 'PERP' ? 'perp' : 'spot'

      const newMarket = getMarketByBaseSymbolAndKind(
        groupConfig,
        marketBaseSymbol.toUpperCase(),
        marketType
      )

      const marketIndex = getMarketIndexBySymbol(
        groupConfig,
        marketBaseSymbol.toUpperCase()
      )

      setMangoStore((state) => {
        state.selectedMarket.kind = marketType
        if (newMarket.name !== marketConfig.name) {
          state.selectedMarket.current = null
          state.selectedMarket.config = newMarket
          state.tradeForm.price =
            state.tradeForm.tradeType === 'Limit'
              ? mangoGroup.getPrice(marketIndex, mangoCache).toFixed(2)
              : ''
        }
      })
    }
  }, [router, mangoGroup])

  return (
    <div className={`bg-th-bkg-1 text-th-fgd-1 transition-all `}>
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
