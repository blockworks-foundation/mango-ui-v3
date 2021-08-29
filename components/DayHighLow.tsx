import { formatUsdValue } from '../utils'
import { MarketDataLoader } from './MarketHeader'

const DayHighLow = ({ high, low, latest }) => {
  let rangePercent = 0

  if (high) {
    rangePercent =
      ((parseFloat(latest) - parseFloat(low)) * 100) /
      (parseFloat(high) - parseFloat(low))
  }

  return (
    <div className="pr-6">
      <div className="text-center text-th-fgd-3 tiny-text pb-0.5">
        Daily Range
      </div>
      <div className="flex items-center">
        <div className="pr-2 text-th-fgd-1 text-xs">
          {low ? formatUsdValue(low) : <MarketDataLoader />}
        </div>
        <div className="h-1.5 flex rounded bg-th-bkg-3 w-24">
          <div
            style={{
              width: `${rangePercent}%`,
            }}
            className="flex rounded bg-th-primary"
          ></div>
        </div>
        <div className="pl-2 text-th-fgd-1 text-xs">
          {high ? formatUsdValue(high) : <MarketDataLoader />}
        </div>
      </div>
    </div>
  )
}

export default DayHighLow
