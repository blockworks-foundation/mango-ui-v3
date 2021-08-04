import {
  nativeToUi,
  ZERO_BN,
  ZERO_I80F48,
} from '@blockworks-foundation/mango-client'
import { HeartIcon } from '@heroicons/react/outline'
import { useMemo } from 'react'
import useMangoStore, { mangoClient, MNGO_INDEX } from '../stores/useMangoStore'
import { notify } from '../utils/notifications'
import Button from './Button'
import FloatingElement from './FloatingElement'
// import { ElementTitle } from './styles'
import Tooltip from './Tooltip'

export default function MarginInfo() {
  const connected = useMangoStore((s) => s.wallet.connected)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const actions = useMangoStore((s) => s.actions)

  const maintHealth = mangoAccount
    ? mangoAccount.getHealthRatio(mangoGroup, mangoCache, 'Maint')
    : 100

  const equity = mangoAccount
    ? mangoAccount.computeValue(mangoGroup, mangoCache)
    : ZERO_I80F48

  const mngoAccrued = useMemo(() => {
    return mangoAccount
      ? mangoAccount.perpAccounts.reduce((acc, perpAcct) => {
          return perpAcct.mngoAccrued.add(acc)
        }, ZERO_BN)
      : ZERO_BN
  }, [mangoAccount])

  // const leverage =
  //   mangoAccount && equity.gt(ZERO_I80F48)
  //     ? mangoAccount.getLiabsVal(mangoGroup, mangoCache).div(equity)
  //     : 0.0

  const handleRedeemMngo = async () => {
    const wallet = useMangoStore.getState().wallet.current
    const mngoNodeBank =
      mangoGroup.rootBankAccounts[MNGO_INDEX].nodeBankAccounts[0]

    try {
      const txid = await mangoClient.redeemAllMngo(
        mangoGroup,
        mangoAccount,
        wallet,
        mangoGroup.tokens[MNGO_INDEX].rootBank,
        mngoNodeBank.publicKey,
        mngoNodeBank.vault
      )
      actions.fetchMangoAccounts()
      notify({
        title: 'Successfully redeemed MNGO',
        description: '',
        txid,
      })
    } catch (e) {
      notify({
        title: 'Error redeeming MNGO',
        description: e.message,
        txid: e.txid,
        type: 'error',
      })
    }
  }

  return (
    <FloatingElement showConnect>
      <div className={!connected ? 'filter blur-sm' : undefined}>
        {/* <ElementTitle>Account</ElementTitle> */}
        <div>
          <div>
            <div className="flex justify-between pt-2 pb-2">
              <Tooltip content="Account value">
                <div className="cursor-help font-normal text-th-fgd-3 border-b border-th-fgd-3 border-dashed border-opacity-20 leading-4 default-transition hover:border-th-bkg-2 hover:text-th-fgd-3">
                  Equity
                </div>
              </Tooltip>
              <div className="text-th-fgd-1">${equity.toFixed(2)}</div>
            </div>
            {/* <div className="flex justify-between pt-2 pb-2">
              <div className="font-normal text-th-fgd-3 leading-4">
                Leverage
              </div>
              <div className="text-th-fgd-1">{leverage.toFixed(2)}x</div>
            </div> */}
            <div className={`flex justify-between pt-2 pb-2`}>
              <div className="font-normal text-th-fgd-3 leading-4">
                Total Assets Value
              </div>
              <div className={`text-th-fgd-1`}>
                $
                {mangoAccount
                  ? mangoAccount.getAssetsVal(mangoGroup, mangoCache).toFixed(2)
                  : 0}
              </div>
            </div>
            <div className={`flex justify-between pt-2 pb-2`}>
              <div className="font-normal text-th-fgd-3 leading-4">
                Total Liabilities Value
              </div>
              <div className={`text-th-fgd-1`}>
                $
                {mangoAccount
                  ? mangoAccount.getLiabsVal(mangoGroup, mangoCache).toFixed(2)
                  : 0}
              </div>
            </div>
            <div className={`flex justify-between pt-2 pb-2`}>
              <div className="font-normal text-th-fgd-3 leading-4">
                Maint Health
              </div>
              <div className={`text-th-fgd-1`}>
                {mangoAccount
                  ? mangoAccount
                      .getHealth(mangoGroup, mangoCache, 'Maint')
                      .toFixed(2)
                  : 0}
              </div>
            </div>
            <div className={`flex justify-between pt-2 pb-2`}>
              <div className="font-normal text-th-fgd-3 leading-4">
                Init Health
              </div>
              <div className={`text-th-fgd-1`}>
                {mangoAccount
                  ? mangoAccount
                      .getHealth(mangoGroup, mangoCache, 'Init')
                      .toFixed(2)
                  : 0}
              </div>
            </div>
            <div className={`flex justify-between pt-2 pb-2`}>
              <div className="font-normal text-th-fgd-3 leading-4">
                MNGO Accrued
              </div>
              <div className={`text-th-fgd-1`}>
                {
                  <Button
                    onClick={handleRedeemMngo}
                    className="ml-3 text-xs pt-0 pb-0 h-8 pl-3 pr-3"
                    disabled={mngoAccrued.eq(ZERO_BN)}
                  >
                    <span>
                      Redeem{' '}
                      {nativeToUi(
                        mngoAccrued.toNumber(),
                        mangoGroup.tokens[MNGO_INDEX].decimals
                      )}{' '}
                      MNGO
                    </span>
                  </Button>
                }
              </div>
            </div>
            {/* <div className="flex justify-between pt-2 pb-2">
              <Tooltip content="Must be above 0% to borrow funds">
                <div className="cursor-help font-normal text-th-fgd-3 border-b border-th-fgd-3 border-dashed border-opacity-20 leading-4 default-transition hover:border-th-bkg-2 hover:text-th-fgd-3">
                  Init Ratio
                </div>
              </Tooltip>
              <div className="text-th-fgd-1">
                {mangoAccount
                  ? mangoAccount
                      .getHealthRatio(mangoGroup, mangoCache, 'Init')
                      .toFixed(2)
                  : 100.0}
                %
              </div>
            </div> */}
          </div>
          <div className="border border-th-bkg-4 mt-4 p-4 rounded">
            <div className="flex flex-col">
              <div className="flex justify-between">
                <div className="flex items-center">
                  <HeartIcon
                    className="h-5 w-5 text-th-primary"
                    aria-hidden="true"
                  />
                  <span className="ml-2">Health Ratio</span>
                </div>
                <div className="text-right">{maintHealth.toFixed(2)}%</div>
              </div>
              <div className="mt-4">
                <div className="h-1.5 flex rounded bg-th-bkg-3">
                  <div
                    style={{
                      width: `${maintHealth}%`,
                    }}
                    className={`flex rounded ${
                      maintHealth > 50
                        ? 'bg-th-green'
                        : maintHealth <= 50 && maintHealth > 24
                        ? 'bg-th-orange'
                        : 'bg-th-red'
                    }`}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FloatingElement>
  )
}
