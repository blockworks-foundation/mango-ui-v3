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

  const getMarketLeverage = (mangoGroup, mangoGroupConfig, market) => {
    if (!mangoGroup) return 1
    const marketIndex = getMarketIndexBySymbol(
      mangoGroupConfig,
      market.baseSymbol
    )

    // The following if statement is for markets not on devnet
    if (!mangoGroup.spotMarkets[marketIndex]) {
      return 1
    }

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
          className={`flex w-full items-center justify-between px-2 py-2 font-normal hover:bg-th-bkg-4 hover:text-th-primary  ${
            asPath.includes(market.name) ||
            (asPath === '/' && initialMarket.name === market.name)
              ? 'text-th-primary'
              : 'text-th-fgd-1'
          }`}
          onClick={() => selectMarket(market)}
        >
          <div className={`flex w-full items-center whitespace-nowrap text-xs`}>
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
              {getMarketLeverage(mangoGroup, mangoGroupConfig, market)}x
            </span>
          </div>
          {market?.change24h ? (
            <div
              className={`text-xs ${
                market?.change24h
                  ? market.change24h >= 0
                    ? 'text-th-green'
                    : 'text-th-red'
                  : 'text-th-fgd-4'
              }`}
            >
              {`${(market.change24h * 100).toFixed(1)}%`}
            </div>
          ) : null}
        </button>
        <div className="ml-1">
          <FavoriteMarketButton market={market} />
        </div>
      </div>
    </div>
  )
}

export default MarketNavItem
