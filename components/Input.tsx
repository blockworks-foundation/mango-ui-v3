import styled from '@emotion/styled'

const StyledInput = styled.input`
  padding-bottom: 1px;
`

interface InputProps {
  type: string
  value: any
  onChange: (e) => void
  className?: string
  disabled?: boolean
  [x: string]: any
}

const Group = ({ children, className }) => {
  return <div className={`flex ${className}`}>{children}</div>
}

const Input = ({
  type,
  value,
  onChange,
  className,
  wrapperClassName = 'w-full',
  disabled,
  prefix,
  suffix,
  ...props
}: InputProps) => {
  return (
    <div className={`flex relative ${wrapperClassName}`}>
      {prefix ? (
        <div className="flex items-center justify-end p-2 border border-r-0 border-th-fgd-4 bg-th-bkg-2 h-full text-xs rounded rounded-r-none w-14 text-right">
          {prefix}
        </div>
      ) : null}
      <StyledInput
        type={type}
        value={value}
        onChange={onChange}
        className={`${className} px-2 w-full bg-th-bkg-1 rounded h-10 text-th-fgd-1 border border-th-fgd-4 default-transition hover:border-th-primary focus:border-th-primary focus:outline-none ${
          disabled ? 'bg-th-bkg-3 cursor-not-allowed hover:border-th-fgd-4' : ''
        } ${value.toString().length > 9 ? 'text-xs' : ''}`}
        disabled={disabled}
        {...props}
      />
      {suffix ? (
        <span className="absolute right-0 text-xs flex items-center pr-2 h-full bg-transparent text-th-fgd-4">
          {suffix}
        </span>
      ) : null}
    </div>
  )
}

Input.Group = Group

export default Input
