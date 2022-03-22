import useOraclePrice from '../hooks/useOraclePrice'
import { formatUsdValue } from '../utils'
import { MarketDataLoader } from './MarketDetails'

interface DayHighLowProps {
  high: number
  low: number
  isTableView?: boolean
}

const DayHighLow = ({ high, low, isTableView }: DayHighLowProps) => {
  const price = useOraclePrice()
  let rangePercent = 0
  let latestPrice = 0

  if (price) {
    latestPrice = price?.toNumber()
  }

  if (high) {
    rangePercent = ((latestPrice - low) * 100) / (high - low)
  }

  return (
    <div className="flex items-center justify-between md:block">
      <div className="flex items-center">
        <div className={`pr-2 text-th-fgd-2 ${!isTableView && 'md:text-xs'}`}>
          {low ? formatUsdValue(low) : <MarketDataLoader />}
        </div>
        <div className="flex h-1.5 w-12 rounded bg-th-bkg-3 sm:w-16">
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
