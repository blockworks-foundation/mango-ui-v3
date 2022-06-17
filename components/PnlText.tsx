import { formatUsdValue } from '../utils'

const PnlText = ({ className, pnl }: { className?: string; pnl?: number }) => (
  <>
    {pnl ? (
      <p
        className={`mb-0 ${className} text-xs ${
          pnl > 0 ? 'text-th-green' : 'text-th-red'
        }`}
      >
        {formatUsdValue(pnl)}
      </p>
    ) : (
      '--'
    )}
  </>
)

export default PnlText
