import React, { useEffect, useMemo, useState } from 'react'
import Slider from 'rc-slider'
import 'rc-slider/assets/index.css'
import useMangoStore from '../stores/useMangoStore'
import {
  getMarketIndexBySymbol,
  I80F48,
  PerpMarket,
} from '@blockworks-foundation/mango-client'
import tw from 'twin.macro'
import styled from '@emotion/styled'
import 'rc-slider/assets/index.css'

type StyledSliderProps = {
  enableTransition?: boolean
  disabled?: boolean
}

const StyledSlider = styled(Slider)<StyledSliderProps>`
  .rc-slider-rail {
    ${tw`bg-th-bkg-3 h-2.5 rounded-full`}
  }
  .rc-slider-track {
    ${tw`bg-th-primary h-2.5 rounded-full ring-1 ring-th-primary ring-inset`}
    ${({ enableTransition }) =>
      enableTransition && tw`transition-all duration-500`}
  }
  .rc-slider-step {
    ${tw`hidden`}
  }
  .rc-slider-handle {
    ${tw`border-4 border-th-primary h-4 w-4 ring-white light:ring-gray-400 hover:ring-4 hover:ring-opacity-50 active:ring-8 active:ring-opacity-50`}
    background: #fff;
    margin-top: -3px;
    ${({ enableTransition }) =>
      enableTransition && tw`transition-all duration-500`}
    ${({ disabled }) => disabled && tw`bg-th-fgd-3 border-th-fgd-4`}
  }
  ${({ disabled }) => disabled && 'background-color: transparent'}
`

type SliderProps = {
  onChange: (x) => void
  onAfterChange?: (x) => void
  step: number
  value: number
  side: string
  price: number
  disabled?: boolean
  max?: number
  maxButtonTransition?: boolean
}

export default function LeverageSlider({
  onChange,
  onAfterChange,
  step,
  value,
  disabled,
  maxButtonTransition,
  side,
  price,
}: SliderProps) {
  const [enableTransition, setEnableTransition] = useState(false)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoGroupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const marketType = useMangoStore((s) => s.selectedMarket.kind)
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const market = useMangoStore((s) => s.selectedMarket.current)
  const marketIndex = getMarketIndexBySymbol(
    mangoGroupConfig,
    marketConfig.baseSymbol
  )

  const max = useMemo(() => {
    if (!mangoAccount) return 0
    const priceOrDefault = price
      ? I80F48.fromNumber(price)
      : mangoGroup.getPrice(marketIndex, mangoCache)
    console.log('price', priceOrDefault.toFixed())

    const maxQuote = mangoAccount
      .getMaxLeverageForMarket(
        mangoGroup,
        mangoCache,
        marketIndex,
        market,
        side,
        priceOrDefault
      )
      .toNumber()
    console.log('max quote :: ', maxQuote)

    if (maxQuote <= 0) return 0
    // mul by scaler value to account for rounding errors in getMaxLeverageForMarket or fees
    const maxScaler = market instanceof PerpMarket ? 0.99 : 0.95
    const max =
      (maxQuote * maxScaler) /
      mangoGroup.getPrice(marketIndex, mangoCache).toNumber()

    return max
  }, [
    mangoAccount,
    mangoGroup,
    mangoCache,
    marketIndex,
    market,
    marketType,
    side,
    step,
    price,
  ])

  useEffect(() => {
    if (maxButtonTransition) {
      setEnableTransition(true)
    }
  }, [maxButtonTransition])

  useEffect(() => {
    if (enableTransition) {
      const transitionTimer = setTimeout(() => {
        setEnableTransition(false)
      }, 500)
      return () => clearTimeout(transitionTimer)
    }
  }, [enableTransition])

  return (
    <div className="relative mt-4">
      <StyledSlider
        min={0}
        max={max}
        value={value || 0}
        onChange={onChange}
        onAfterChange={onAfterChange}
        step={step}
        disabled={disabled}
      />
    </div>
  )
}
