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
} from '../FlipCard'
import FloatingElement from '../FloatingElement'
import { useWallet } from '@solana/wallet-adapter-react'

export default function TradeForm() {
  const [showAdvancedForm, setShowAdvancedForm] = useState(true)
  const { connected } = useWallet()
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)

  const handleFormChange = () => {
    setShowAdvancedForm(!showAdvancedForm)
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
      <FlipCardInner flip={showAdvancedForm}>
        {showAdvancedForm ? (
          <FlipCardFront>
            <FloatingElement className="fadein-floating-element h-full px-1 py-0 md:px-4 md:py-4">
              {/* <div className={`${!connected ? 'filter blur-sm' : ''}`}> */}
              {/* <button
                  onClick={handleFormChange}
                  className="absolute hidden md:flex items-center justify-center right-4 rounded-full bg-th-bkg-3 w-8 h-8 hover:text-th-primary focus:outline-none"
                >
                  <SwitchHorizontalIcon className="w-5 h-5" />
                </button> */}
              <AdvancedTradeForm initLeverage={initLeverage} />
              {/* </div> */}
            </FloatingElement>
          </FlipCardFront>
        ) : (
          <FlipCardBack>
            <FloatingElement className="fadein-floating-element h-full px-1 md:px-4">
              <div className={`${!connected ? 'blur-sm filter' : ''}`}>
                <button
                  onClick={handleFormChange}
                  className="absolute right-4 flex h-8 w-8 items-center justify-center rounded-full bg-th-bkg-3 hover:text-th-primary focus:outline-none"
                >
                  <SwitchHorizontalIcon className="h-5 w-5" />
                </button>
                <SimpleTradeForm initLeverage={initLeverage} />
              </div>
            </FloatingElement>
          </FlipCardBack>
        )}
      </FlipCardInner>
    </FlipCard>
  )
}
