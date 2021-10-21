import { formatUsdValue } from '../utils'

const PnlText = ({
  className,
  pnl,
  pnlpct,
}: {
  className?: string
  pnl?: number
  pnlpct?: number
}) => (
  <>
    {
      (pnlpct,
      pnl ? (
        <span
          className={`${className} ${
            pnl > 0 ? 'text-th-green' : 'text-th-red'
          }`}
        >
          {formatUsdValue(pnl) + ' (' + Math.round(pnlpct * 100) / 100 + '%)'}
        </span>
      ) : (
        '--'
      ))
    }
  </>
)

export default PnlText
