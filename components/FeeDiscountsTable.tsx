import { useCallback, useState } from 'react'
import { percentFormat } from '../utils/index'
import useSrmAccount from '../hooks/useSrmAccount'
import useMangoStore from '../stores/useMangoStore'
import Button from './Button'
import DepositSrmModal from './DepositSrmModal'
import WithdrawSrmModal from './WithdrawSrmModal'
import { SRM_DECIMALS } from '@project-serum/serum/lib/token-instructions'

const FeeDiscountsTable = () => {
  const [showDeposit, setShowDeposit] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const { totalSrm, rates } = useSrmAccount()
  const connected = useMangoStore((s) => s.wallet.connected)
  const contributedSrm = useMangoStore((s) => s.wallet.contributedSrm)
  const selectedMarginAccount = useMangoStore(
    (s) => s.selectedMarginAccount.current
  )

  const handleCloseDeposit = useCallback(() => {
    setShowDeposit(false)
  }, [])

  const handleCloseWithdraw = useCallback(() => {
    setShowWithdraw(false)
  }, [])

  return (
    <div
      className={`flex flex-col items-center bg-th-bkg-1 py-6 mt-4 rounded-md`}
    >
      {connected && selectedMarginAccount ? (
        <div className="mb-6">
          <div className="bg-th-bkg-2 p-6 rounded">
            <div className="text-th-fgd-4 text-center">
              Your SRM contribution
              <div className="text-2xl font-semibold text-th-fgd-1">
                {contributedSrm}
              </div>
            </div>
            <div className="flex space-x-4 mt-4">
              <Button onClick={() => setShowDeposit(true)}>Deposit</Button>
              <Button
                onClick={() => setShowWithdraw(true)}
                disabled={!(contributedSrm > 0)}
              >
                Withdraw
              </Button>
            </div>
          </div>
        </div>
      ) : null}
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
      {showDeposit && (
        <DepositSrmModal isOpen={showDeposit} onClose={handleCloseDeposit} />
      )}
      {showWithdraw && (
        <WithdrawSrmModal isOpen={showWithdraw} onClose={handleCloseWithdraw} />
      )}
    </div>
  )
}

export default FeeDiscountsTable
