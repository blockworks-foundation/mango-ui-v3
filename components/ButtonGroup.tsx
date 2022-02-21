import { FunctionComponent } from 'react'

interface ButtonGroupProps {
  activeValue: string
  className?: string
  onChange: (x) => void
  unit?: string
  values: Array<string>
  names?: Array<string>
}

const ButtonGroup: FunctionComponent<ButtonGroupProps> = ({
  activeValue,
  className,
  unit,
  values,
  onChange,
  names,
}) => {
  return (
    <div className="bg-th-bkg-3 rounded-md">
      <div className="flex relative">
        {activeValue && values.includes(activeValue) ? (
          <div
            className={`absolute bg-th-bkg-4 default-transition h-full left-0 top-0 rounded-md transform`}
            style={{
              transform: `translateX(${
                values.findIndex((v) => v === activeValue) * 100
              }%)`,
              width: `${100 / values.length}%`,
            }}
          />
        ) : null}
        {values.map((v, i) => (
          <button
            className={`${className} cursor-pointer default-transition font-normal px-2 py-1.5 relative rounded-md text-center text-xs w-1/2
              ${
                v === activeValue
                  ? `text-th-primary`
                  : `text-th-fgd-2 hover:text-th-primary`
              }
            `}
            key={`${v}${i}`}
            onClick={() => onChange(v)}
            style={{
              width: `${100 / values.length}%`,
            }}
          >
            {names ? (unit ? names[i] + unit : names[i]) : unit ? v + unit : v}
          </button>
        ))}
      </div>
    </div>
  )
}

export default ButtonGroup
