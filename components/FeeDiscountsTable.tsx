import { percentFormat } from '../utils/index'
import useSrmAccount from '../hooks/useSrmAccount'
import {
  MSRM_DECIMALS,
  SRM_DECIMALS,
} from '@project-serum/serum/lib/token-instructions'
import Tooltip from './Tooltip'
import { InformationCircleIcon } from '@heroicons/react/outline'
import { useTranslation } from 'next-i18next'
import Button from './Button'
import useMangoStore from '../stores/useMangoStore'
import { msrmMints, ZERO_BN } from '@blockworks-foundation/mango-client'
import DepositMsrmModal from './DepositMsrmModal'
import WithdrawMsrmModal from './WithdrawMsrmModal'
import { useState } from 'react'

const FeeDiscountsTable = () => {
  const { t } = useTranslation('common')
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const connected = useMangoStore((s) => s.wallet.connected)
  const walletTokens = useMangoStore((s) => s.wallet.tokens)
  const { totalSrm, totalMsrm, rates } = useSrmAccount()
  const [showDeposit, setShowDeposit] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const cluster = useMangoStore.getState().connection.cluster

  const ownerMsrmAccount = walletTokens.find((t) =>
    t.account.mint.equals(msrmMints[cluster])
  )

  return (
    <div
      className={`flex justify-center bg-th-bkg-1 py-6 rounded-md divide-x divide-gray-500`}
    >
      <div className="pr-10">
        <div className="text-center text-lg">{t('serum-fees')}</div>
        <div
          className={`flex flex-col sm:flex-row justify-between text-th-fgd-4 text-center mt-4`}
        >
          <div className="px-4">
            <div>
              {totalMsrm > 0 ? 'MSRM' : 'SRM'} {t('deposits')}
            </div>
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
            <div>{t('maker-fee')}</div>
            <div className="text-th-fgd-3 text-normal">
              {rates ? percentFormat.format(rates.maker) : null}
            </div>
          </div>
          <div className="px-4 mt-4 sm:mt-0">
            <div className="flex items-center">
              <div>{t('taker-fee')}</div>
              <div className="flex items-center">
                <Tooltip
                  content={t('tooltip-serum-rebate', {
                    taker_percent: percentFormat.format(rates.taker),
                  })}
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
              {rates
                ? new Intl.NumberFormat(undefined, {
                    style: 'percent',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 3,
                  }).format(rates.takerWithRebate)
                : null}
            </div>
          </div>
        </div>
        {connected && mangoAccount ? (
          <div className="flex justify-center mt-6">
            <Button
              onClick={() => setShowDeposit(true)}
              disabled={!ownerMsrmAccount}
            >
              {t('deposit')} MSRM
            </Button>
            {mangoAccount.msrmAmount.gt(ZERO_BN) ? (
              <Button onClick={() => setShowWithdraw(true)} className="ml-2">
                {t('withdraw')} MSRM
              </Button>
            ) : null}
          </div>
        ) : null}
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
