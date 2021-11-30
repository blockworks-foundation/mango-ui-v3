import { useEffect, useState } from 'react'
import { MenuIcon, PlusCircleIcon } from '@heroicons/react/outline'
import useMangoGroupConfig from '../hooks/useMangoGroupConfig'
import MarketMenuItem from './MarketMenuItem'
import { LinkButton } from './Button'
import MarketsModal from './MarketsModal'
import useLocalStorageState from '../hooks/useLocalStorageState'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from './TradePageGrid'
import { useTranslation } from 'next-i18next'

// const StyledMarketSelectWrapper = styled.div`
//   -ms-overflow-style: none;
//   scrollbar-width: none;

//   ::-webkit-scrollbar {
//     display: none;
//   }
// `

const MarketSelect = () => {
  const { t } = useTranslation('common')
  const [showMarketsModal, setShowMarketsModal] = useState(false)
  const [hiddenMarkets] = useLocalStorageState('hiddenMarkets', [])
  const [sortedMarkets, setSortedMarkets] = useState([])
  const groupConfig = useMangoGroupConfig()
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.md : false

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
    <div className="hidden md:flex">
      <div
        // style={{
        //   '-ms-overflow-style': 'none',
        //   scrollbarWidth: 'none',
        //   '::-webkit-scrollbar': { display: 'none' },
        // }}
        className="bg-th-bkg-3 flex h-10 w-full"
      >
        <div className="bg-th-bkg-4 flex items-center pl-4 lg:pl-9 pr-1">
          {isMobile ? (
            <MenuIcon
              className="cursor-pointer default-transition h-5 text-th-fgd-1 w-5 hover:text-th-primary"
              onClick={() => setShowMarketsModal(true)}
            />
          ) : (
            <ShowMarketsButton
              onClick={() => setShowMarketsModal(true)}
              t={t}
            />
          )}
        </div>
        <div
          style={{
            width: '0',
            height: '0',
            borderTop: '20px solid transparent',
            borderBottom: '20px solid transparent',
            paddingRight: '0.5rem',
          }}
          className="border-l-[20px] border-th-bkg-4"
        />
        <div className="flex items-center justify-between pl-3 w-full">
          <div className="flex items-center space-x-6">
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
      </div>
      {showMarketsModal ? (
        <MarketsModal
          isOpen={showMarketsModal}
          onClose={() => setShowMarketsModal(false)}
          markets={sortedMarkets}
        />
      ) : null}
    </div>
  )
}

const ShowMarketsButton = ({ onClick, t }) => (
  <LinkButton
    className="font-normal flex items-center text-th-fgd-2 text-xs whitespace-nowrap"
    onClick={onClick}
  >
    <PlusCircleIcon className="h-4 mr-1 w-4" />
    {t('markets').toUpperCase()}
  </LinkButton>
)

export default MarketSelect
