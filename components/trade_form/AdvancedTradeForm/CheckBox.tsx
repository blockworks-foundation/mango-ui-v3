import React from 'react'
import Tooltip from 'components/Tooltip'
import Checkbox from 'components/Checkbox'

export interface AdvancedTradeFromCheckbox {
  tooltipContent: string
  checked: boolean
  onChange: (e) => void
  text: string
  show: boolean
  disabled: boolean
}

export const CheckBox: React.FC<AdvancedTradeFromCheckbox> = ({
  tooltipContent,
  checked,
  onChange,
  text,
  show,
  disabled,
}) => {
  if (!show) {
    return null
  }

  return (
    <div className="mt-3 mr-4">
      <Tooltip
        className="hidden md:block"
        delay={250}
        placement="left"
        content={tooltipContent}
      >
        <Checkbox checked={checked} onChange={onChange} disabled={disabled}>
          {text}
        </Checkbox>
      </Tooltip>
    </div>
  )
}
