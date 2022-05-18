import React from 'react'
import { CheckIcon } from '@heroicons/react/solid'

const Checkbox = ({
  checked,
  children,
  disabled = false,
  halfState = false,
  ...props
}) => (
  <label className="default-transition flex cursor-pointer items-center text-th-fgd-3 hover:text-th-fgd-2">
    <input
      checked={checked}
      {...props}
      disabled={disabled}
      type="checkbox"
      style={{
        border: '0',
        clip: 'rect(0 0 0 0)',
        clipPath: 'inset(50%)',
        height: '1px',
        margin: '-1px',
        overflow: 'hidden',
        padding: '0',
        position: 'absolute',
        whiteSpace: 'nowrap',
        width: '1px',
      }}
    />
    <div
      className={`${
        checked && !disabled && !halfState
          ? 'border-th-primary'
          : 'border-th-fgd-4'
      } default-transition flex h-4 w-4 flex-shrink-0 cursor-pointer items-center justify-center rounded border`}
    >
      {halfState ? (
        <div className="mb-0.5 font-bold">–</div>
      ) : (
        <CheckIcon
          className={`${checked ? 'block' : 'hidden'} h-4 w-4 ${
            disabled ? 'text-th-fgd-4' : 'text-th-primary'
          }`}
        />
      )}
    </div>
    <span
      className={`ml-2 whitespace-nowrap text-xs ${
        checked && !disabled ? 'text-th-fgd-2' : ''
      }`}
    >
      {children}
    </span>
  </label>
)

export default Checkbox
