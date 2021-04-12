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
  ...props
}: InputProps) => {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      className={`bg-th-bkg-1 ${className}`}
      disabled={disabled}
      {...props}
    />
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
