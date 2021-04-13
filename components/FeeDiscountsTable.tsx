import { useCallback, useState } from 'react'
import { percentFormat } from '../utils/index'
import useSrmAccount from '../hooks/useSrmAccount'
import useMangoStore from '../stores/useMangoStore'
import Button from './Button'
import DepositSrmModal from './DepositSrmModal'
import WithdrawSrmModal from './WithdrawSrmModal'

const FeeDiscountsTable = () => {
  const [showDeposit, setShowDeposit] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const { totalSrm, rates } = useSrmAccount()
  const connected = useMangoStore((s) => s.wallet.connected)
  const contributedSrm = useMangoStore(
    (s) => s.selectedMangoGroup.contributedSrm
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
      <div
        className={`flex flex-col sm:flex-row justify-between m-auto text-th-fgd-4 text-base font-light text-center`}
      >
        <div className="px-4">
          <div>Total SRM in Mango</div>
          <div className="text-th-fgd-1 text-lg font-semibold">{totalSrm}</div>
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
      <div className="mt-6">
        {connected ? (
          <div className="bg-th-bkg-2 p-6">
            <div className="text-th-fgd-4 text-center">
              Your contributed SRM: {contributedSrm}
            </div>
            <div className="flex space-x-4 mt-8">
              <Button onClick={() => setShowDeposit(true)}>Deposit</Button>
              <Button onClick={() => setShowWithdraw(true)}>Withdraw</Button>
            </div>
          </div>
        ) : (
          <Button disabled>Connect Wallet</Button>
        )}
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
