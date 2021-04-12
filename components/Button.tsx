import { FunctionComponent } from 'react'

interface ButtonProps {
  onClick?: (x?) => void
  disabled?: boolean
  className?: string
  grow?: boolean
}

const Button: FunctionComponent<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  className,
  grow = false,
  ...props
}) => {
  if (disabled) {
    return (
      <button
        className={`px-8 py-2 border border-th-fgd-4 bg-th-bkg-2 
          rounded-md focus:outline-none
          ${grow && `flex-grow`}
          ${disabled && `cursor-not-allowed text-th-fgd-4`},
        `}
        disabled={disabled}
      >
        {children}
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className={`px-8 py-2 border border-mango-dark-lighter bg-mango-dark-light 
          focus:outline-none
        ${
          disabled
            ? `cursor-not-allowed text-mango-med`
            : `active:border-mango-yellow text-mango-yellow hover:bg-mango-dark-lighter`
        }
      ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
