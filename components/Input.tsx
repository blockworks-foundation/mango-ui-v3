interface InputProps {
  type: string
  value: any
  onChange: (e) => void
  className?: string
  disabled?: boolean
  [x: string]: any
}

const Input = ({
  type,
  value,
  onChange,
  className,
  disabled,
  prefix,
  suffix,
  ...props
}: InputProps) => {
  return (
    <div
      className={`flex items-center rounded ${
        disabled ? 'bg-th-bkg-3' : 'bg-th-bkg-1'
      } ${className}`}
    >
      {prefix ? (
        <div className="border-r border-th-fgd-4 bg-th-bkg-2 p-2 rounded rounded-r-none">
          {prefix}
        </div>
      ) : null}
      <div className="flex h-full">
        <input
          type={type}
          value={value}
          onChange={onChange}
          className={`bg-transparent w-full font-light focus:outline-none ${
            disabled && 'opacity-20 cursor-not-allowed'
          } ${type === 'number' ? 'text-right' : ''}`}
          disabled={disabled}
          {...props}
        />
      </div>
      {suffix ? (
        <span className="text-xs px-2 bg-transparent text-th-fgd-4">
          {suffix}
        </span>
      ) : null}
    </div>
  )
}

const Group = ({ children, className }) => {
  return (
    <div className={`flex border border-th-fgd-4 rounded ${className}`}>
      {children}
    </div>
  )
}

Input.Group = Group

export default Input
