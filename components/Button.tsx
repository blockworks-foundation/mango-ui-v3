import { FunctionComponent } from 'react'
import xw, { cx } from 'xwind'

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
        css={[
          xw`px-8 py-2 border border-mango-dark-lighter bg-mango-dark-light 
          focus:outline-none`,
          grow && xw`flex-grow`,
          disabled && xw`cursor-not-allowed text-mango-med`,
        ]}
        disabled={disabled}
      >
        {children}
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      css={[
        xw`px-8 py-2 border border-mango-dark-lighter bg-mango-dark-light 
          focus:outline-none`,
        disabled
          ? xw`cursor-not-allowed text-mango-med`
          : xw`active:border-mango-yellow text-mango-yellow hover:bg-mango-dark-lighter`,
      ]}
      className={cx('group', className)}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
