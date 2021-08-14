function formatRangePrice(price) {
  if (!price) return null
  const priceAsFloat = parseFloat(price)
  if (priceAsFloat > 1000) {
    return priceAsFloat.toFixed(0)
  } else if (priceAsFloat > 1) {
    return priceAsFloat.toFixed(2)
  } else {
    return priceAsFloat.toFixed(4)
  }
}

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
      <div className="text-center text-th-fgd-3 tiny-text">24h Range</div>
      <div className="flex items-center">
        <div className="pr-2 text-th-fgd-1 text-xs">
          ${formatRangePrice(low?.baseOraclePrice)}
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
          ${formatRangePrice(high?.baseOraclePrice)}
        </div>
      </div>
    </div>
  )
}

export default DayHighLow
