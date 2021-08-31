import { useEffect, useState } from 'react'
import styled from '@emotion/styled'
import { PlusCircleIcon } from '@heroicons/react/outline'
import useMangoGroupConfig from '../hooks/useMangoGroupConfig'
import useMangoStore from '../stores/useMangoStore'
import MarketMenuItem from './MarketMenuItem'
import { LinkButton } from './Button'
import MarketsModal from './MarketsModal'
import useLocalStorageState from '../hooks/useLocalStorageState'

const StyledMarketSelectWrapper = styled.div`
  -ms-overflow-style: none;
  scrollbar-width: none;

  ::-webkit-scrollbar {
    display: none;
  }
`

const StyledArrow = styled.div`
  width: 0;
  height: 0;
  border-top: 20px solid transparent;
  border-bottom: 20px solid transparent;
  padding-right: 0.5rem;
`

const MarketSelect = () => {
  const [showMarketsModal, setShowMarketsModal] = useState(false)
  const [hiddenMarkets] = useLocalStorageState('hiddenMarkets', [])
  const [sortedMarkets, setSortedMarkets] = useState([])
  const groupConfig = useMangoGroupConfig()
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const baseSymbol = marketConfig.baseSymbol
  const isPerpMarket = marketConfig.kind === 'perp'

  useEffect(() => {
    const markets = []
    const allMarkets = [...groupConfig.spotMarkets, ...groupConfig.perpMarkets]
    allMarkets.forEach((market) => {
      const base = market.name.slice(0, -5)
      const found = markets.find((b) => b.baseAsset === base)
      if (!found) {
        markets.push({ baseAsset: base, markets: [market] })
      } else {
        found.markets.push(market)
      }
    })
    setSortedMarkets(markets)
  }, [groupConfig])

  return (
    <>
      <StyledMarketSelectWrapper className="bg-th-bkg-3 flex h-10 hidden sm:flex">
        <div className="bg-th-bkg-4 flex items-center pl-6 md:pl-9 pr-1">
          <ShowMarketsButton onClick={() => setShowMarketsModal(true)} />
        </div>
        <StyledArrow className="border-l-[20px] border-th-bkg-4" />
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            {sortedMarkets
              .filter((m) => !hiddenMarkets.includes(m.baseAsset))
              .map((s) => (
                <MarketMenuItem
                  key={s.baseAsset}
                  linksArray={s.markets}
                  menuTitle={s.baseAsset}
                />
              ))}
          </div>
        </div>
      </StyledMarketSelectWrapper>
      <div className="bg-th-bkg-3 flex items-center justify-between py-3 px-6 sm:hidden">
        <div className="flex items-center">
          <img
            alt=""
            width="24"
            height="24"
            src={`/assets/icons/${baseSymbol.toLowerCase()}.svg`}
            className={`mr-2.5`}
          />

          <div className="font-semibold pr-0.5 text-xl">{baseSymbol}</div>
          <span className="text-th-fgd-4 text-xl">
            {isPerpMarket ? '-' : '/'}
          </span>
          <div className="font-semibold pl-0.5 text-xl">
            {isPerpMarket ? 'PERP' : groupConfig.quoteSymbol}
          </div>
        </div>
        <ShowMarketsButton onClick={() => setShowMarketsModal(true)} />
      </div>
      {showMarketsModal ? (
        <MarketsModal
          isOpen={showMarketsModal}
          onClose={() => setShowMarketsModal(false)}
          markets={sortedMarkets}
        />
      ) : null}
    </>
  )
}

const ShowMarketsButton = ({ onClick }) => (
  <LinkButton
    className="font-normal flex items-center text-th-fgd-2 text-xs"
    onClick={onClick}
  >
    <PlusCircleIcon className="h-4 mr-1 w-4" />
    MARKETS
  </LinkButton>
)

export default MarketSelect
