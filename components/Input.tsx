import { forwardRef, ReactNode } from 'react'

interface InputProps {
  type: string
  value: any
  onChange: (e) => void
  className?: string
  disabled?: boolean
  prefixClassname?: string
  error?: boolean
  [x: string]: any
}

const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const {
    type,
    value,
    onChange,
    className,
    error,
    wrapperClassName = 'w-full',
    disabled,
    prefix,
    prefixClassName,
    suffix,
  } = props
  return (
    <div className={`relative flex ${wrapperClassName}`}>
      {prefix ? (
        <div
          className={`absolute left-2 top-1/2 -translate-y-1/2 transform ${prefixClassName}`}
        >
          {prefix}
        </div>
      ) : null}
      <input
        type={type}
        value={value}
        onChange={onChange}
        className={`${className} h-10 w-full flex-1 rounded-md border bg-th-bkg-1 px-2 pb-px
          text-th-fgd-1 ${
            error ? 'border-th-red' : 'border-th-bkg-4'
          } default-transition hover:border-th-fgd-4 
          focus:border-th-fgd-4 focus:outline-none 
          ${
            disabled
              ? 'cursor-not-allowed bg-th-bkg-3 text-th-fgd-3 hover:border-th-fgd-4'
              : ''
          }
          ${prefix ? 'pl-7' : ''}
          ${suffix ? 'pr-11' : ''}`}
        disabled={disabled}
        ref={ref}
        {...props}
      />
      {suffix ? (
        <span className="absolute right-0 flex h-full items-center bg-transparent pr-2 text-xs text-th-fgd-4">
          {suffix}
        </span>
      ) : null}
    </div>
  )
})

export default Input

interface LabelProps {
  children: ReactNode
  className?: string
}

export const Label = ({ children, className }: LabelProps) => (
  <label className={`mb-1.5 block text-th-fgd-2 ${className}`}>
    {children}
  </label>
)
