import {
  nativeToUi,
  ZERO_BN,
  ZERO_I80F48,
} from '@blockworks-foundation/mango-client'
import { HeartIcon } from '@heroicons/react/outline'
import { useMemo } from 'react'
import useMangoStore, { mangoClient, MNGO_INDEX } from '../stores/useMangoStore'
import { notify } from '../utils/notifications'
import { LinkButton } from './Button'
import FloatingElement from './FloatingElement'
import { ElementTitle } from './styles'
import Tooltip from './Tooltip'

export default function MarginInfo() {
  const connected = useMangoStore((s) => s.wallet.connected)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const actions = useMangoStore((s) => s.actions)

  const equity = mangoAccount
    ? mangoAccount.computeValue(mangoGroup, mangoCache)
    : ZERO_I80F48

  const mngoAccrued = mangoAccount
    ? mangoAccount.perpAccounts.reduce((acc, perpAcct) => {
        return perpAcct.mngoAccrued.add(acc)
      }, ZERO_BN)
    : ZERO_BN

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

  const maintHealthRatio = useMemo(() => {
    return mangoAccount
      ? mangoAccount.getHealthRatio(mangoGroup, mangoCache, 'Maint')
      : 100
  }, [mangoAccount, mangoGroup, mangoCache])

  const initHealthRatio = useMemo(() => {
    return mangoAccount
      ? mangoAccount.getHealthRatio(mangoGroup, mangoCache, 'Init')
      : 100
  }, [mangoAccount, mangoGroup, mangoCache])

  return (
    <FloatingElement showConnect>
      <div className={!connected ? 'filter blur-sm' : undefined}>
        <ElementTitle>Account</ElementTitle>
        <div>
          <div>
            <div className="flex justify-between pt-2 pb-2">
              <Tooltip content="Account value">
                <div className="cursor-help font-normal text-th-fgd-3 leading-4 border-b border-th-fgd-3 border-dashed border-opacity-20 default-transition hover:border-th-bkg-2">
                  Equity
                </div>
              </Tooltip>
              <div className="text-th-fgd-1">${equity.toFixed(2)}</div>
            </div>
            <div className="flex justify-between pt-2 pb-2">
              <div className="font-normal text-th-fgd-3 leading-4">
                Leverage
              </div>
              <div className="text-th-fgd-1">0.00x</div>
            </div>
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
              <Tooltip
                content={
                  <div>
                    Earn MNGO by market making on Perp markets.{' '}
                    <a
                      href="https://docs.mango.markets/mango-v3/liquidity-incentives"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Learn more
                    </a>
                  </div>
                }
              >
                <div className="cursor-help font-normal text-th-fgd-3 leading-4 border-b border-th-fgd-3 border-dashed border-opacity-20 default-transition hover:border-th-bkg-2">
                  MNGO Rewards
                </div>
              </Tooltip>
              <div className={`flex items-center text-th-fgd-1`}>
                {mangoGroup
                  ? nativeToUi(
                      mngoAccrued.toNumber(),
                      mangoGroup.tokens[MNGO_INDEX].decimals
                    )
                  : 0}
                <LinkButton
                  onClick={handleRedeemMngo}
                  className="ml-2 text-th-primary text-xs"
                  disabled={mngoAccrued.eq(ZERO_BN)}
                >
                  Claim
                </LinkButton>
              </div>
            </div>
          </div>
          <div className="border border-th-bkg-4 mt-4 p-4 rounded">
            <div className="flex flex-col">
              <div className="flex justify-between">
                <div className="flex items-center">
                  <HeartIcon
                    className="h-5 w-5 text-th-primary"
                    aria-hidden="true"
                  />
                  <span className="ml-2">
                    <Tooltip
                      content={
                        <div>
                          Account will be liquidated if Health Ratio reaches 0%.{' '}
                          <a
                            href="https://docs.mango.markets/mango-v3/overview#health"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Learn more
                          </a>
                        </div>
                      }
                    >
                      <div className="cursor-help font-normal text-th-fgd-3 leading-4 border-b border-th-fgd-3 border-dashed border-opacity-20 default-transition hover:border-th-bkg-2">
                        Health Ratio
                      </div>
                    </Tooltip>
                  </span>
                </div>
                <div className="text-right">{maintHealthRatio.toFixed(2)}%</div>
              </div>
              <div className="mt-1">
                <div className="h-1.5 flex rounded bg-th-bkg-3 mt-4">
                  <div
                    style={{
                      width: `${maintHealthRatio}%`,
                    }}
                    className={`flex rounded ${
                      maintHealthRatio > 30
                        ? 'bg-th-green'
                        : initHealthRatio > 0
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
