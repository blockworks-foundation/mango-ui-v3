import { useMemo, useState } from 'react'
import { SwitchHorizontalIcon } from '@heroicons/react/outline'
import { getWeights } from '@blockworks-foundation/mango-client'
import useMangoStore from '../../stores/useMangoStore'
import AdvancedTradeForm from './AdvancedTradeForm'
import SimpleTradeForm from './SimpleTradeForm'
import {
  FlipCard,
  FlipCardBack,
  FlipCardFront,
  FlipCardInner,
  StyledFloatingElement,
} from '../FlipCard'

export default function TradeForm() {
  const [showAdvancedFrom, setShowAdvancedForm] = useState(true)
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const connected = useMangoStore((s) => s.wallet.connected)

  const handleFormChange = () => {
    setShowAdvancedForm(!showAdvancedFrom)
  }

  const initLeverage = useMemo(() => {
    if (!mangoGroup || !marketConfig) return 1

    const ws = getWeights(mangoGroup, marketConfig.marketIndex, 'Init')
    const w =
      marketConfig.kind === 'perp' ? ws.perpAssetWeight : ws.spotAssetWeight
    return Math.round((100 * -1) / (w.toNumber() - 1)) / 100
  }, [mangoGroup, marketConfig])

  return (
    <FlipCard>
      <FlipCardInner flip={showAdvancedFrom}>
        {showAdvancedFrom ? (
          <FlipCardFront>
            <StyledFloatingElement
              className="h-full px-1 py-0 md:px-4 md:py-4"
              showConnect
            >
              <div className={`${!connected ? 'filter blur-sm' : ''}`}>
                <button
                  onClick={handleFormChange}
                  className="absolute hidden md:flex items-center justify-center right-4 rounded-full bg-th-bkg-3 w-8 h-8 hover:text-th-primary focus:outline-none"
                >
                  <SwitchHorizontalIcon className="w-5 h-5" />
                </button>
                <AdvancedTradeForm initLeverage={initLeverage} />
              </div>
            </StyledFloatingElement>
          </FlipCardFront>
        ) : (
          <FlipCardBack>
            <StyledFloatingElement className="h-full px-1 md:px-4" showConnect>
              <div className={`${!connected ? 'filter blur-sm' : ''}`}>
                <button
                  onClick={handleFormChange}
                  className="absolute flex items-center justify-center right-4 rounded-full bg-th-bkg-3 w-8 h-8 hover:text-th-primary focus:outline-none"
                >
                  <SwitchHorizontalIcon className="w-5 h-5" />
                </button>
                <SimpleTradeForm initLeverage={initLeverage} />
              </div>
            </StyledFloatingElement>
          </FlipCardBack>
        )}
      </FlipCardInner>
    </FlipCard>
  )
}
