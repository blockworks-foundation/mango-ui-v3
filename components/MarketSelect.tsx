import { useEffect, useState } from 'react'
import styled from '@emotion/styled'
import useMangoGroupConfig from '../hooks/useMangoGroupConfig'
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
      <StyledMarketSelectWrapper className="bg-th-bkg-3 flex h-10">
        <div className="bg-th-bkg-4 flex items-center pl-6 md:pl-9 pr-1">
          <LinkButton
            className="font-normal text-th-fgd-2 text-xs"
            onClick={() => setShowMarketsModal(true)}
          >
            MARKETS
          </LinkButton>
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

export default MarketSelect
