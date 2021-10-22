import { formatUsdValue } from '../utils'

export const PnlText = ({
  className,
  pnl,
}: {
  className?: string
  pnl?: number
}) => (
  <>
    {pnl ? (
      <span
        className={`${className} ${pnl > 0 ? 'text-th-green' : 'text-th-red'}`}
      >
        {formatUsdValue(pnl)}
      </span>
    ) : (
      '--'
    )}
  </>
)

export const PnlPct = ({
  className,
  pnl,
  pnlpct,
}: {
  className?: string
  pnl?: number
  pnlpct?: number
}) => (
  <>
    {pnl ? (
      <span
        className={`${className} ${pnl > 0 ? 'text-th-green' : 'text-th-red'}`}
      >
        {formatUsdValue(pnl) + ' (' + Math.round(pnlpct * 100) / 100 + '%)'}
      </span>
    ) : (
      '--'
    )}
  </>
)

export default PnlText
