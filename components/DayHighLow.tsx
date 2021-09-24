import { formatUsdValue } from '../utils'
import { MarketDataLoader } from './MarketDetails'

const DayHighLow = ({ high, low, latest }) => {
  let rangePercent = 0

  if (high) {
    rangePercent =
      ((parseFloat(latest) - parseFloat(low)) * 100) /
      (parseFloat(high) - parseFloat(low))
  }

  return (
    <div className="flex items-center justify-between md:block md:pr-6">
      <div className="text-left lg:text-center text-th-fgd-3 tiny-text pb-0.5">
        Daily Range
      </div>
      <div className="flex items-center font-semibold">
        <div className="pr-2 text-th-fgd-1 md:text-xs">
          {low ? formatUsdValue(low) : <MarketDataLoader />}
        </div>
        <div className="h-1.5 flex rounded bg-th-bkg-3 w-16 sm:w-20">
          <div
            style={{
              width: `${rangePercent}%`,
            }}
            className="flex rounded bg-th-primary"
          ></div>
        </div>
        <div className="pl-2 text-th-fgd-1 md:text-xs">
          {high ? formatUsdValue(high) : <MarketDataLoader />}
        </div>
      </div>
    </div>
  )
}

export default DayHighLow
