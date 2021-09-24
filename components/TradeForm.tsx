import { useState } from 'react'
import { SwitchHorizontalIcon } from '@heroicons/react/outline'
import AdvancedTradeForm from './AdvancedTradeForm'
import SimpleTradeForm from './SimpleTradeForm'
import {
  FlipCard,
  FlipCardBack,
  FlipCardFront,
  FlipCardInner,
  StyledFloatingElement,
} from './FlipCard'

export default function TradeForm() {
  const [showAdvancedFrom, setShowAdvancedForm] = useState(true)

  const handleFormChange = () => {
    setShowAdvancedForm(!showAdvancedFrom)
  }

  return (
    <FlipCard>
      <FlipCardInner flip={showAdvancedFrom}>
        {showAdvancedFrom ? (
          <FlipCardFront>
            <StyledFloatingElement className="h-full">
              <button
                onClick={handleFormChange}
                className="absolute flex items-center justify-center right-4 top-4 rounded-full bg-th-bkg-3 w-8 h-8 hover:text-th-primary focus:outline-none"
              >
                <SwitchHorizontalIcon className="w-5 h-5" />
              </button>
              <AdvancedTradeForm />
            </StyledFloatingElement>
          </FlipCardFront>
        ) : (
          <FlipCardBack>
            <StyledFloatingElement className="h-full">
              <button
                onClick={handleFormChange}
                className="absolute flex items-center justify-center right-4 top-4 rounded-full bg-th-bkg-3 w-8 h-8 hover:text-th-primary focus:outline-none"
              >
                <SwitchHorizontalIcon className="w-5 h-5" />
              </button>
              <SimpleTradeForm />
            </StyledFloatingElement>
          </FlipCardBack>
        )}
      </FlipCardInner>
    </FlipCard>
  )
}
