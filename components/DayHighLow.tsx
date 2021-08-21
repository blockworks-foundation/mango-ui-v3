import { formatUsdValue } from '../utils'
import { MarketDataLoader } from './MarketHeader'

const DayHighLow = ({ high, low, latest }) => {
  let rangePercent = 0

  if (high?.baseOraclePrice) {
    rangePercent =
      ((parseFloat(latest?.baseOraclePrice) -
        parseFloat(low?.baseOraclePrice)) *
        100) /
      (parseFloat(high?.baseOraclePrice) - parseFloat(low?.baseOraclePrice))
  }

  return (
    <div className="pr-6">
      <div className="text-center text-th-fgd-3 tiny-text pb-0.5">
        24h Range
      </div>
      <div className="flex items-center">
        <div className="pr-2 text-th-fgd-1 text-xs">
          {low?.baseOraclePrice ? (
            formatUsdValue(low.baseOraclePrice)
          ) : (
            <MarketDataLoader />
          )}
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
          {high?.baseOraclePrice ? (
            formatUsdValue(high.baseOraclePrice)
          ) : (
            <MarketDataLoader />
          )}
        </div>
      </div>
    </div>
  )
}

export default DayHighLow
