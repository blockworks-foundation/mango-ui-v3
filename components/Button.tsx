import { FunctionComponent } from 'react'

interface ButtonProps {
  onClick?: (x?) => void
  disabled?: boolean
  className?: string
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
      className={`${className} px-6 py-2 bg-th-bkg-4 rounded-full text-th-fgd-1
      hover:brightness-[1.15] focus:outline-none disabled:bg-th-bkg-4 
      disabled:text-th-fgd-4 disabled:cursor-not-allowed disabled:hover:brightness-100`}
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
  ...props
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${className} border-0 underline hover:no-underline hover:opacity-60 focus:outline-none`}
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
      className={`${className} bg-th-bkg-4 flex items-center justify-center rounded-full w-8 h-8 text-th-fgd-1 focus:outline-none hover:text-th-primary`}
      {...props}
    >
      {children}
    </button>
  )
}
