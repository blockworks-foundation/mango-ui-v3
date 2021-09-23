// import { useViewport } from '../hooks/useViewport'
// import { breakpoints } from './TradePageGrid'

const TradeType = ({ value, onChange }) => {
  // const { width } = useViewport()
  // const isMobile = width ? width < breakpoints.sm : false
  return (
    <div className="bg-th-bkg-3 rounded-md">
      <div className="flex relative">
        <div
          className={`absolute bg-th-bkg-4 default-transition h-full left-0 top-0 rounded-md transform w-1/2 ${
            value === 'Limit' ? 'translate-x-0' : 'translate-x-full'
          }`}
        />
        <div
          className={`cursor-pointer default-transition px-2 py-1.5 relative rounded-md text-center w-1/2
              ${
                value === 'Limit'
                  ? `text-th-primary`
                  : `text-th-fgd-1 opacity-50 hover:opacity-100`
              }
            `}
          onClick={() => onChange('Limit')}
        >
          Limit
        </div>
        <div
          className={`cursor-pointer default-transition px-2 py-1.5 relative rounded-md text-center w-1/2
              ${
                value === 'Market'
                  ? `text-th-primary`
                  : `text-th-fgd-1 opacity-50 hover:opacity-100`
              }
            `}
          onClick={() => onChange('Market')}
        >
          Market
        </div>
      </div>
    </div>
  )
}

export default TradeType
