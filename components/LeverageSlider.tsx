import React, { useEffect, useMemo, useState } from 'react'
import Slider from 'rc-slider'
import 'rc-slider/assets/index.css'
import useMangoStore from '../stores/useMangoStore'
import {
  getMarketIndexBySymbol,
  getWeights,
  I80F48,
  PerpMarket,
} from '@blockworks-foundation/mango-client'
import tw from 'twin.macro'
import styled from '@emotion/styled'

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
    ${tw`border-4 border-th-primary h-4 w-4`}
    background: #fff;
    box-shadow: 0px 0px 8px 0px rgba(0, 0, 0, 0.1);
    margin-top: -3px;
    ${({ enableTransition }) =>
      enableTransition && tw`transition-all duration-500`}
    ${({ disabled }) => disabled && tw`bg-th-fgd-3 border-th-fgd-4`}
  }
  ${({ disabled }) => disabled && 'background-color: transparent'}
`

const StyledSliderButtonWrapper = styled.div`
  ${tw`absolute left-0 top-5 w-full`}
`

type StyledSliderButtonProps = {
  disabled: boolean
}

const StyledSliderButton = styled.button<StyledSliderButtonProps>`
  ${tw`bg-none text-th-fgd-3 transition-all duration-300 hover:text-th-primary focus:outline-none`}
  font-size: 0.65rem;
  position: absolute;
  display: inline-block;
  vertical-align: middle;
  text-align: center;
  left: 0%;
  :nth-of-type(2) {
    left: 23%;
    transform: translateX(-23%);
  }
  :nth-of-type(3) {
    left: 50%;
    transform: translateX(-50%);
  }
  :nth-of-type(4) {
    left: 76%;
    transform: translateX(-76%);
  }
  :nth-of-type(5) {
    left: 100%;
    transform: translateX(-100%);
  }
  ${({ disabled }) =>
    disabled && tw`cursor-not-allowed text-th-fgd-4 hover:text-th-fgd-4`}
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
  decimalCount: number
}

const percentToClose = (size, total) => {
  return (size / total) * 100
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
  decimalCount,
}: SliderProps) {
  const [enableTransition, setEnableTransition] = useState(false)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoGroupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const market = useMangoStore((s) => s.selectedMarket.current)
  const marketIndex = getMarketIndexBySymbol(
    mangoGroupConfig,
    marketConfig.baseSymbol
  )

  const initLeverage = useMemo(() => {
    if (!mangoGroup || !marketConfig) return 1

    const ws = getWeights(mangoGroup, marketConfig.marketIndex, 'Init')
    const w =
      marketConfig.kind === 'perp' ? ws.perpAssetWeight : ws.spotAssetWeight
    return Math.round((100 * -1) / (w.toNumber() - 1)) / 100
  }, [mangoGroup, marketConfig])

  const { max, deposits, borrows } = useMemo(() => {
    if (!mangoAccount) return 0
    const priceOrDefault = price
      ? I80F48.fromNumber(price)
      : mangoGroup.getPrice(marketIndex, mangoCache)

    const {
      max: maxQuote,
      deposits,
      borrows,
    } = mangoAccount.getMaxLeverageForMarket(
      mangoGroup,
      mangoCache,
      marketIndex,
      market,
      side,
      priceOrDefault
    )

    if (maxQuote.toNumber() <= 0) return 0
    // multiply the maxQuote by a scaler value to account for
    // srm fees or rounding issues in getMaxLeverageForMarket
    const maxScaler = market instanceof PerpMarket ? 0.99 : 0.95
    const scaledMax =
      (maxQuote.toNumber() * maxScaler) /
      mangoGroup.getPrice(marketIndex, mangoCache).toNumber()

    return { max: scaledMax, deposits, borrows }
  }, [mangoAccount, mangoGroup, mangoCache, marketIndex, market, side, price])

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

  // if (!mangoAccount) return null

  const roundedDeposits = parseFloat(deposits?.toFixed(decimalCount))
  const roundedBorrows = parseFloat(borrows?.toFixed(decimalCount))

  const closeDepositString =
    percentToClose(value, roundedDeposits) > 100
      ? '100% Close Position + Leverage'
      : `${percentToClose(value, roundedDeposits).toFixed(2)}% Close Position`

  const closeBorrowString =
    percentToClose(value, roundedBorrows) > 100
      ? '100% Close Position + Leverage'
      : `${percentToClose(value, roundedDeposits).toFixed(2)}% Close Position`

  // const setMaxLeverage = function () {
  //   onChange(Math.round(max / step) * step)
  // }

  const handleSliderButtonClick = (percentage) => {
    const value = percentage * max
    onChange(Math.round(value / step) * step)
    setEnableTransition(true)
  }

  return (
    <>
      <div className="flex h-8 pb-12 mt-4">
        <div className="relative w-full">
          <StyledSlider
            min={0}
            max={max}
            value={value || 0}
            onChange={onChange}
            onAfterChange={onAfterChange}
            step={step}
            enableTransition={enableTransition}
            disabled={disabled}
          />
          <StyledSliderButtonWrapper>
            <StyledSliderButton
              disabled={disabled}
              onClick={() => handleSliderButtonClick(0)}
            >
              0%
            </StyledSliderButton>
            <StyledSliderButton
              disabled={disabled}
              onClick={() => handleSliderButtonClick(0.25)}
            >
              25%
            </StyledSliderButton>
            <StyledSliderButton
              disabled={disabled}
              onClick={() => handleSliderButtonClick(0.5)}
            >
              50%
            </StyledSliderButton>
            <StyledSliderButton
              disabled={disabled}
              onClick={() => handleSliderButtonClick(0.75)}
            >
              75%
            </StyledSliderButton>
            <StyledSliderButton
              disabled={disabled}
              onClick={() => handleSliderButtonClick(1)}
            >
              100%
            </StyledSliderButton>
          </StyledSliderButtonWrapper>
        </div>
        <div
          className={`border flex font-semibold h-8 items-center justify-center ml-3 mt-1 px-2 rounded text-th-fgd-1 text-xs ${
            value / max < 0.5
              ? 'border-th-green text-th-green'
              : value / max < 0.75
              ? 'border-th-orange text-th-orange'
              : 'border-th-red text-th-red'
          }`}
        >
          {((value / max) * initLeverage).toFixed(2)}x
        </div>
      </div>
      {side === 'sell' ? (
        <div className="text-th-fgd-4 text-xs tracking-normal mt-2.5">
          <span>{roundedDeposits > 0 ? closeDepositString : null}</span>
        </div>
      ) : (
        <div className="text-th-fgd-4 text-xs tracking-normal mt-2.5">
          <span>{roundedBorrows > 0 ? closeBorrowString : null}</span>
        </div>
      )}
    </>
  )
}
