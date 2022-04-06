import { useEffect, useState } from 'react'
import { MenuIcon, PlusCircleIcon } from '@heroicons/react/outline'
import MarketMenuItem from './MarketMenuItem'
import { LinkButton } from './Button'
import MarketsModal from './MarketsModal'
import useLocalStorageState from '../hooks/useLocalStorageState'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from './TradePageGrid'
import { useTranslation } from 'next-i18next'
import useMangoStore from 'stores/useMangoStore'

const MarketSelect = () => {
  const { t } = useTranslation('common')
  const groupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const [showMarketsModal, setShowMarketsModal] = useState(false)
  const [hiddenMarkets] = useLocalStorageState('hiddenMarkets', [])
  const [sortedMarkets, setSortedMarkets] = useState<any[]>([])
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.md : false

  useEffect(() => {
    if (groupConfig) {
      const markets: any[] = []
      const allMarkets = [
        ...groupConfig.spotMarkets,
        ...groupConfig.perpMarkets,
      ]
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
    }
  }, [groupConfig])

  return (
    <div className="hidden md:flex">
      <div className="flex h-10 w-full bg-th-bkg-3">
        <div className="flex items-center bg-th-bkg-4 pl-4 pr-1 lg:pl-9">
          {isMobile ? (
            <MenuIcon
              className="h-5 w-5 cursor-pointer text-th-fgd-1 hover:text-th-primary"
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
        <div className="flex w-full items-center justify-between">
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
    className="flex items-center whitespace-nowrap text-xs font-normal text-th-fgd-2"
    onClick={onClick}
  >
    <PlusCircleIcon className="mr-1 h-4 w-4" />
    {t('markets').toUpperCase()}
  </LinkButton>
)

export default MarketSelect
