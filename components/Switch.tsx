import { FunctionComponent } from 'react'

interface SwitchProps {
  checked: boolean
  className?: string
  onChange: (x) => void
}

const Switch: FunctionComponent<SwitchProps> = ({
  checked = false,
  className = '',
  children,
  onChange,
}) => {
  const handleClick = () => {
    onChange(!checked)
  }

  return (
    <div className={`flex items-center ${className}`}>
      <button
        type="button"
        className={`${
          checked ? 'bg-th-primary' : 'bg-th-bkg-button'
        } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full 
        border-2 border-transparent transition-colors duration-200 ease-in-out 
        focus:outline-none`}
        role="switch"
        aria-checked={checked}
        onClick={handleClick}
      >
        <span className="sr-only">{children}</span>
        <span
          aria-hidden="true"
          className={`${
            checked ? 'translate-x-5' : 'translate-x-0'
          } pointer-events-none inline-block h-5 w-5 transform rounded-full 
          bg-white shadow ring-0 transition duration-200 ease-in-out`}
        ></span>
      </button>
      <span className="ml-2">
        <span className="">{children}</span>
      </span>
    </div>
  )
}

export default Switch
