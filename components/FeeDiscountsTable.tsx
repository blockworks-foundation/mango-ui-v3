import { percentFormat } from '../utils/index'
import useSrmAccount from '../hooks/useSrmAccount'
import { SRM_DECIMALS } from '@project-serum/serum/lib/token-instructions'

const FeeDiscountsTable = () => {
  const { totalSrm, rates } = useSrmAccount()

  return (
    <div
      className={`flex flex-col items-center bg-th-bkg-1 py-6 mt-4 rounded-md`}
    >
      <div
        className={`flex flex-col sm:flex-row justify-between text-th-fgd-4 text-center`}
      >
        <div className="px-4">
          <div>Total SRM in Mango</div>
          <div className="text-th-fgd-1 text-lg font-semibold">
            {totalSrm.toLocaleString(undefined, {
              maximumFractionDigits: SRM_DECIMALS,
            })}
          </div>
        </div>
        <div className="px-4 mt-4 sm:mt-0">
          <div>Maker Fee</div>
          <div className="text-th-fgd-1 text-lg font-semibold">
            {rates ? percentFormat.format(rates.maker) : null}
          </div>
        </div>
        <div className="px-4 mt-4 sm:mt-0">
          <div>Taker Fee</div>
          <div className="text-th-fgd-1 text-lg font-semibold">
            {rates ? percentFormat.format(rates.taker) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FeeDiscountsTable
