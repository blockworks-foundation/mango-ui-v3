import { formatUsdValue } from '../utils'

const PnlText = ({ className, pnl }: { className?: string; pnl?: number }) => (
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

export default PnlText
