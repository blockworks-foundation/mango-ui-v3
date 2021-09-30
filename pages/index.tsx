// import { useEffect } from 'react'
// import { useRouter } from 'next/router'
import TopBar from '../components/TopBar'
import TradePageGrid from '../components/TradePageGrid'
import MarketSelect from '../components/MarketSelect'
import AlphaModal, { ALPHA_MODAL_KEY } from '../components/AlphaModal'
import useLocalStorageState from '../hooks/useLocalStorageState'
import { PageBodyWrapper } from '../components/styles'

const Index = () => {
  const [alphaAccepted] = useLocalStorageState(ALPHA_MODAL_KEY, false)
  // const [defaultMarket] = useLocalStorageState(
  //   'defaultMarket',
  //   JSON.stringify({
  //     base: 'BTC',
  //     kind: 'perp',
  //     name: 'BTC-PERP',
  //     path: '/perp/BTC',
  //   })
  // )
  // const parsedDefaultMarket = JSON.parse(defaultMarket)
  // const router = useRouter()

  // useEffect(() => {
  //   const { pathname } = router
  //   if (pathname == '/') {
  //     router.push(parsedDefaultMarket.path)
  //   }
  // }, [])

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

export default Index
