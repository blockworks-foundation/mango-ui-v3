import { FunctionComponent, RefObject } from 'react'
import { useRouter } from 'next/router'
import { initialMarket } from './SettingsModal'
import { FavoriteMarketButton } from './TradeNavMenu'
import useMangoStore from '../stores/useMangoStore'
import {
  getMarketIndexBySymbol,
  getWeights,
} from '@blockworks-foundation/mango-client'

interface MarketNavItemProps {
  market: any
  onClick?: () => void
  buttonRef?: RefObject<HTMLElement>
}

const MarketNavItem: FunctionComponent<MarketNavItemProps> = ({
  market,
  onClick,
  buttonRef,
}) => {
  const { asPath } = useRouter()
  const router = useRouter()
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoGroupConfig = useMangoStore((s) => s.selectedMangoGroup.config)

  const selectMarket = (market) => {
    buttonRef?.current?.click()
    router.push(`/?name=${market.name}`, undefined, { shallow: true })
    if (onClick) {
      onClick()
    }
  }

  const getMarketLeverage = (market) => {
    if (!mangoGroup) return 1
    const marketIndex = getMarketIndexBySymbol(
      mangoGroupConfig,
      market.baseSymbol
    )
    const ws = getWeights(mangoGroup, marketIndex, 'Init')
    const w = market.name.includes('PERP')
      ? ws.perpAssetWeight
      : ws.spotAssetWeight
    return Math.round((100 * -1) / (w.toNumber() - 1)) / 100
  }

  return (
    <div className="text-th-fgd-3">
      <div className="flex items-center">
        <button
          className="font-normal flex items-center justify-between mr-2 w-full"
          onClick={() => selectMarket(market)}
        >
          <div
            className={`default-transition flex items-center text-xs w-full whitespace-nowrap py-1.5 hover:text-th-primary ${
              asPath.includes(market.name) ||
              (asPath === '/' && initialMarket.name === market.name)
                ? 'text-th-primary'
                : 'text-th-fgd-1'
            }`}
          >
            <div className="flex items-center">
              <img
                alt=""
                width="16"
                height="16"
                src={`/assets/icons/${market.baseSymbol.toLowerCase()}.svg`}
              />
              <span className="ml-2">{market.name}</span>
            </div>
            <span className="ml-1.5 text-xs text-th-fgd-4">
              {getMarketLeverage(market)}x
            </span>
          </div>
          <div
            className={`text-xs ${
              market
                ? market.change24h >= 0
                  ? 'text-th-green'
                  : 'text-th-red'
                : 'text-th-fgd-4'
            }`}
          >
            {market ? `${(market.change24h * 100).toFixed(1)}%` : ''}
          </div>
        </button>
        <FavoriteMarketButton market={market} />
      </div>
    </div>
  )
}

export default MarketNavItem
