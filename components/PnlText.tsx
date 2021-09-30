import { usdFormatter } from '../utils'

const PnlText = ({ className, pnl }: { className?: string; pnl?: number }) => (
  <>
    {pnl ? (
      <span
        className={`${className} ${pnl > 0 ? 'text-th-green' : 'text-th-red'}`}
      >
        {usdFormatter(pnl)}
      </span>
    ) : (
      '--'
    )}
  </>
)

export default PnlText
