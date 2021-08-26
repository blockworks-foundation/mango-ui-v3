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
import 'rc-slider/assets/index.css'
import Tooltip from './Tooltip'
import { DialIcon } from './icons'

type StyledSliderProps = {
  enableTransition?: boolean
  disabled?: boolean
}

const StyledSlider = styled(Slider)<StyledSliderProps>`
  height: 18px;
  .rc-slider-rail {
    ${tw`bg-th-fgd-4  h-2 rounded-full`}
    opacity: 0.6;
  }
  .rc-slider-track {
    ${tw`bg-th-primary h-2 rounded-full ring-1 ring-th-primary ring-inset`}
    ${({ enableTransition }) =>
      enableTransition && tw`transition-all duration-500`}
  }
  .rc-slider-step {
    ${tw`hidden`}
  }
  .rc-slider-handle {
    ${tw`border-4 border-th-primary h-4 w-4 ring-white light:ring-gray-400 hover:ring-4 hover:ring-opacity-50 active:ring-8 active:ring-opacity-50`}
    background: #fff;
    margin-top: -4px;
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

    if (maxQuote.toNumber() <= 0) return { max: 0 }
    // multiply the maxQuote by a scaler value to account for
    // srm fees or rounding issues in getMaxLeverageForMarket
    const maxScaler = market instanceof PerpMarket ? 0.99 : 0.95
    const scaledMax = (
      (maxQuote.toNumber() * maxScaler) /
      mangoGroup.getPrice(marketIndex, mangoCache).toNumber()
    ).toFixed(decimalCount)

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
      ? `100% close position and open a ${(value - roundedDeposits).toFixed(
          decimalCount
        )} ${marketConfig.baseSymbol} short`
      : `${percentToClose(value, roundedDeposits).toFixed(0)}% close position`

  const closeBorrowString =
    percentToClose(value, roundedBorrows) > 100
      ? `100% close position and open a ${(value - roundedBorrows).toFixed(
          decimalCount
        )} ${marketConfig.baseSymbol} short`
      : `${percentToClose(value, roundedBorrows).toFixed(0)}% close position`

  const setMaxLeverage = function () {
    setEnableTransition(true)
    onChange(parseFloat(((max / step) * step).toFixed(decimalCount)))
  }

  return (
    <>
      <div className="flex items-center my-4">
        <div className="bg-th-bkg-3 flex items-center h-10 px-4 rounded-l-md w-full">
          <StyledSlider
            min={0}
            max={max}
            value={value || 0}
            onChange={onChange}
            onAfterChange={onAfterChange}
            step={step}
            disabled={disabled}
            enableTransition={enableTransition}
          />
        </div>
        <Tooltip content={`Max Leverage – ${initLeverage}x`}>
          <button
            className="bg-th-bkg-4 flex items-center justify-center hover:brightness-[1.15] font-normal rounded-r-md rounded-l-none text-th-fgd-1 text-lg h-10 w-10"
            onClick={setMaxLeverage}
          >
            <DialIcon
              className="h-6 w-6 text-th-primary"
              rotate={Math.round((value / max) * 270)}
            />
          </button>
        </Tooltip>
      </div>
      {side === 'sell' ? (
        <div className="h-6 text-center text-th-fgd-3 text-xs tracking-normal">
          <span>{roundedDeposits > 0 ? closeDepositString : null}</span>
        </div>
      ) : (
        <div className="h-6 text-center text-th-fgd-3 text-xs tracking-normal">
          <span>{roundedBorrows > 0 ? closeBorrowString : null}</span>
        </div>
      )}
    </>
  )
}
