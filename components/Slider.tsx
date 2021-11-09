export {}

// import { FunctionComponent, useEffect, useState } from 'react'
// import tw from 'twin.macro'
// import styled from '@emotion/styled'
// import Slider from 'rc-slider'
// import 'rc-slider/assets/index.css'

// type StyledSliderProps = {
//   enableTransition?: boolean
//   disabled?: boolean
// }

// const StyledSlider = styled(Slider)<StyledSliderProps>`
//   .rc-slider-rail {
//     ${tw`bg-th-bkg-3 h-2.5 rounded-full`}
//   }
//   .rc-slider-track {
//     ${tw`bg-th-primary h-2.5 rounded-full ring-1 ring-th-primary ring-inset`}
//     ${({ enableTransition }) =>
//       enableTransition && tw`transition-all duration-500`}
//   }
//   .rc-slider-step {
//     ${tw`hidden`}
//   }
//   .rc-slider-handle {
//     ${tw`border-4 border-th-primary h-4 w-4`}
//     background: #fff;
//     box-shadow: 0px 0px 8px 0px rgba(0, 0, 0, 0.1);
//     margin-top: -3px;
//     ${({ enableTransition }) =>
//       enableTransition && tw`transition-all duration-500`}
//     ${({ disabled }) => disabled && tw`bg-th-fgd-3 border-th-fgd-4`}
//   }
//   ${({ disabled }) => disabled && 'background-color: transparent'}
// `

// const StyledSliderButtonWrapper = styled.div`
//   ${tw`absolute left-0 top-5 w-full`}
// `

// type StyledSliderButtonProps = {
//   disabled: boolean
//   styleValue: number
//   sliderValue: number
// }

// const StyledSliderButton = styled.button<StyledSliderButtonProps>`
//   ${tw`bg-none text-th-fgd-3 transition-all duration-300 hover:text-th-primary focus:outline-none`}
//   font-size: 0.65rem;
//   position: absolute;
//   display: inline-block;
//   vertical-align: middle;
//   text-align: center;
//   left: 0%;
//   :nth-of-type(2) {
//     left: 23%;
//     transform: translateX(-23%);
//   }
//   :nth-of-type(3) {
//     left: 50%;
//     transform: translateX(-50%);
//   }
//   :nth-of-type(4) {
//     left: 76%;
//     transform: translateX(-76%);
//   }
//   :nth-of-type(5) {
//     left: 100%;
//     transform: translateX(-100%);
//   }
//   ${({ styleValue, sliderValue }) => styleValue < sliderValue && tw`opacity-40`}
//   ${({ styleValue, sliderValue }) =>
//     styleValue === sliderValue && tw`text-th-primary`}
//   ${({ disabled }) =>
//     disabled && tw`cursor-not-allowed text-th-fgd-4 hover:text-th-fgd-4`}
// `

// type SliderProps = {
//   onChange: (x) => void
//   onAfterChange?: (x) => void
//   step: number
//   value: number
//   disabled?: boolean
//   max?: number
//   maxButtonTransition?: boolean
// }

// const AmountSlider: FunctionComponent<SliderProps> = ({
//   onChange,
//   onAfterChange,
//   step,
//   value,
//   disabled,
//   max,
//   maxButtonTransition,
// }) => {
//   const [enableTransition, setEnableTransition] = useState(false)

//   useEffect(() => {
//     if (maxButtonTransition) {
//       setEnableTransition(true)
//     }
//   }, [maxButtonTransition])

//   useEffect(() => {
//     if (enableTransition) {
//       const transitionTimer = setTimeout(() => {
//         setEnableTransition(false)
//       }, 500)
//       return () => clearTimeout(transitionTimer)
//     }
//   }, [enableTransition])

//   const handleSliderButtonClick = (value) => {
//     onChange(value)
//     setEnableTransition(true)
//   }

//   return (
//     <div className="relative">
//       <StyledSlider
//         min={0}
//         max={max}
//         value={value || 0}
//         onChange={onChange}
//         onAfterChange={onAfterChange}
//         step={step}
//         enableTransition={enableTransition}
//         disabled={disabled}
//       />
//       <StyledSliderButtonWrapper>
//         <StyledSliderButton
//           disabled={disabled}
//           onClick={() => handleSliderButtonClick(0)}
//           styleValue={0}
//           sliderValue={value}
//         >
//           0%
//         </StyledSliderButton>
//         <StyledSliderButton
//           disabled={disabled}
//           onClick={() => handleSliderButtonClick(25)}
//           styleValue={25}
//           sliderValue={value}
//         >
//           25%
//         </StyledSliderButton>
//         <StyledSliderButton
//           disabled={disabled}
//           onClick={() => handleSliderButtonClick(50)}
//           styleValue={50}
//           sliderValue={value}
//         >
//           50%
//         </StyledSliderButton>
//         <StyledSliderButton
//           disabled={disabled}
//           onClick={() => handleSliderButtonClick(75)}
//           styleValue={75}
//           sliderValue={value}
//         >
//           75%
//         </StyledSliderButton>
//         <StyledSliderButton
//           disabled={disabled}
//           onClick={() => handleSliderButtonClick(100)}
//           styleValue={100}
//           sliderValue={value}
//         >
//           100%
//         </StyledSliderButton>
//       </StyledSliderButtonWrapper>
//     </div>
//   )
// }

// export default AmountSlider
