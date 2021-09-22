// import { useViewport } from '../hooks/useViewport'
// import { breakpoints } from './TradePageGrid'
import { FunctionComponent } from 'react'

interface ButtonGroupProps {
  activeValue: string
  onChange: (x) => void
  values: Array<string>
}

const ButtonGroup: FunctionComponent<ButtonGroupProps> = ({
  activeValue,
  values,
  onChange,
}) => {
  // const { width } = useViewport()
  // const isMobile = width ? width < breakpoints.sm : false
  return (
    <div className="bg-th-bkg-3 rounded-md">
      <div className="flex relative">
        <div
          className={`absolute bg-th-bkg-4 default-transition h-full left-0 top-0 rounded-sm transform`}
          style={{
            transform: `translateX(${
              values.findIndex((v) => v === activeValue) * 100
            }%)`,
            width: `${100 / values.length}%`,
          }}
        />
        {values.map((v, i) => (
          <button
            className={`cursor-pointer default-transition font-normal px-2 py-1.5 relative rounded-md text-center text-xs w-1/2
              ${
                v === activeValue
                  ? `text-th-primary`
                  : `text-th-fgd-1 opacity-50 hover:opacity-100`
              }
            `}
            key={`${v}${i}`}
            onClick={() => onChange(v)}
            style={{
              width: `${100 / values.length}%`,
            }}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  )
}

export default ButtonGroup
