import { formatUsdValue } from '../utils'
import { MarketDataLoader } from './MarketDetails'

interface DayHighLowProps {
  high: number
  low: number
  latest: number
  isTableView?: boolean
}

const DayHighLow = ({ high, low, latest, isTableView }: DayHighLowProps) => {
  let rangePercent = 0

  if (high) {
    rangePercent = ((latest - low) * 100) / (high - low)
  }

  return (
    <div className="flex items-center justify-between md:block">
      <div className="flex items-center">
        <div className={`pr-2 text-th-fgd-2 ${!isTableView && 'md:text-xs'}`}>
          {low ? formatUsdValue(low) : <MarketDataLoader />}
        </div>
        <div className="h-1.5 flex rounded bg-th-bkg-3 w-16 sm:w-16">
          <div
            style={{
              width: `${rangePercent}%`,
            }}
            className="flex rounded bg-th-primary"
          ></div>
        </div>
        <div className={`pl-2 text-th-fgd-2 ${!isTableView && 'md:text-xs'}`}>
          {high ? formatUsdValue(high) : <MarketDataLoader />}
        </div>
      </div>
    </div>
  )
}

export default DayHighLow
