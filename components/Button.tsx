import { FunctionComponent } from 'react'

interface ButtonProps {
  onClick?: (x?) => void
  disabled?: boolean
  className?: string
  primary?: boolean
}

const Button: FunctionComponent<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  className,
  ...props
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`font-bold px-6 py-2 bg-th-bkg-button rounded-full text-th-fgd-1 whitespace-nowrap hover:brightness-[1.1] focus:outline-none disabled:bg-th-bkg-4 disabled:text-th-fgd-4 disabled:cursor-not-allowed disabled:hover:brightness-100 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button

export const LinkButton: FunctionComponent<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  className,
  primary,
  ...props
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`border-0 font-bold ${
        primary ? 'text-th-primary' : 'text-th-fgd-2'
      } underline hover:no-underline hover:opacity-60 focus:outline-none ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export const IconButton: FunctionComponent<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  className,
  ...props
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${className} bg-th-bkg-4 flex items-center justify-center rounded-full w-7 h-7 text-th-fgd-1 focus:outline-none hover:text-th-primary disabled:bg-th-bkg-4 
      disabled:text-th-fgd-4 disabled:cursor-not-allowed disabled:hover:text-th-fgd-4`}
      {...props}
    >
      {children}
    </button>
  )
}
