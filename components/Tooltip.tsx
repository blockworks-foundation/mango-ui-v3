import React, { useRef } from 'react'
import { useTooltipTriggerState } from '@react-stately/tooltip'
import { mergeProps } from '@react-aria/utils'
import { useTooltip, useTooltipTrigger } from '@react-aria/tooltip'

function TooltipContent({ state, ...props }) {
  const { tooltipProps } = useTooltip(props, state)

  return (
    <span
      style={{
        position: 'absolute',
        left: '5px',
        top: '100%',
        marginTop: '10px',
        backgroundColor: 'white',
        color: 'black',
        padding: '5px',
      }}
      {...mergeProps(props, tooltipProps)}
    >
      {props.children}
    </span>
  )
}

export default function Tooltip(props) {
  const state = useTooltipTriggerState(props)
  const ref = useRef()

  console.log('content', props.content)

  const { triggerProps, tooltipProps } = useTooltipTrigger(props, state, ref)

  return (
    <span style={{ position: 'relative' }}>
      <button ref={ref} {...triggerProps}>
        I have a tooltip
      </button>
      {/* {React.cloneElement(props.children, { ref, ...triggerProps })} */}
      {state.isOpen && (
        <TooltipContent state={state} {...tooltipProps}>
          {props.content}
        </TooltipContent>
      )}
    </span>
  )
}
