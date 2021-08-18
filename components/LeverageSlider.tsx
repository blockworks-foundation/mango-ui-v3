import React, { FunctionComponent, useEffect, useState } from 'react'
import tw from 'twin.macro'
import styled from '@emotion/styled'
import Slider from 'rc-slider'
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
  disabled?: boolean
  max?: number
}

const LeverageSlider: FunctionComponent<SliderProps> = ({
  onChange,
  onAfterChange,
  step,
  value,
  disabled,
  max,
}) => {
  const [enableTransition, setEnableTransition] = useState(false)

  useEffect(() => {
    if (enableTransition) {
      const transitionTimer = setTimeout(() => {
        setEnableTransition(false)
      }, 500)
      return () => clearTimeout(transitionTimer)
    }
  }, [enableTransition])

  return (
    <div className="relative">
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
    </div>
  )
}

export default LeverageSlider