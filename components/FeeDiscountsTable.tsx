import { percentFormat } from '../utils/index'
import useSrmAccount from '../hooks/useSrmAccount'
import {
  MSRM_DECIMALS,
  SRM_DECIMALS,
} from '@project-serum/serum/lib/token-instructions'
import Tooltip from './Tooltip'
import { InformationCircleIcon } from '@heroicons/react/outline'
import Button from './Button'
import useMangoStore from '../stores/useMangoStore'
import { ZERO_BN } from '@blockworks-foundation/mango-client'
import DepositMsrmModal from './DepositMsrmModal'
import WithdrawMsrmModal from './WithdrawMsrmModal'
import { useState } from 'react'

const FeeDiscountsTable = () => {
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const { totalSrm, totalMsrm, rates } = useSrmAccount()
  const [showDeposit, setShowDeposit] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)

  return (
    <div
      className={`flex justify-center bg-th-bkg-1 py-6 mt-6 rounded-md divide-x divide-gray-500`}
    >
      <div className="pr-10">
        <div className="text-center text-lg">Serum Spot Fees</div>
        <div
          className={`flex flex-col sm:flex-row justify-between text-th-fgd-4 text-center mt-4`}
        >
          <div className="px-4">
            <div>{totalMsrm > 0 ? 'MSRM' : 'SRM'} Deposits</div>
            <div className="text-th-fgd-3 text-normal">
              {totalMsrm > 0
                ? totalMsrm.toLocaleString(undefined, {
                    maximumFractionDigits: MSRM_DECIMALS,
                  })
                : totalSrm.toLocaleString(undefined, {
                    maximumFractionDigits: SRM_DECIMALS,
                  })}
            </div>
          </div>
          <div className="px-4 mt-4 sm:mt-0">
            <div>Maker Fee</div>
            <div className="text-th-fgd-3 text-normal">
              {rates ? percentFormat.format(rates.maker) : null}
            </div>
          </div>
          <div className="px-4 mt-4 sm:mt-0">
            <div className="flex items-center">
              <div>Taker Fee</div>
              <div className="flex items-center">
                <Tooltip
                  content={`20% of net fees on Serum go to the GUI host. Mango rebates this fee to you. The taker fee before the GUI rebate is ${percentFormat.format(
                    rates.taker
                  )}`}
                >
                  <div>
                    <InformationCircleIcon
                      className={`h-5 w-5 ml-2 text-th-fgd-4 cursor-help`}
                    />
                  </div>
                </Tooltip>
              </div>
            </div>
            <div className="text-th-fgd-3 text-normal">
              {rates ? percentFormat.format(rates.takerWithRebate) : null}
            </div>
          </div>
        </div>
        {mangoAccount ? (
          <div className="flex justify-center mt-6">
            <Button onClick={() => setShowDeposit(true)}>Deposit MSRM</Button>
            {mangoAccount.msrmAmount.gt(ZERO_BN) ? (
              <Button onClick={() => setShowWithdraw(true)} className="ml-2">
                Withdraw MSRM
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="pl-10">
        <div className="text-center text-lg">Mango Perp Fees</div>
        <div
          className={`flex flex-col sm:flex-row justify-between text-th-fgd-4 text-center mt-4`}
        >
          <div className="px-4 mt-4 sm:mt-0">
            <div>Maker Fee</div>
            <div className="text-th-fgd-3 text-normal">
              {percentFormat.format(0.0)}
            </div>
          </div>
          <div className="px-4 mt-4 sm:mt-0">
            <div className="flex items-center">
              <div>Taker Fee</div>
            </div>
            <div className="text-th-fgd-3 text-normal">
              {percentFormat.format(0.0005)}
            </div>
          </div>
        </div>
      </div>
      {showDeposit ? (
        <DepositMsrmModal
          isOpen={showDeposit}
          onClose={() => setShowDeposit(false)}
        />
      ) : null}

      {showWithdraw ? (
        <WithdrawMsrmModal
          isOpen={showWithdraw}
          onClose={() => setShowWithdraw(false)}
        />
      ) : null}
    </div>
  )
}

export default FeeDiscountsTable
