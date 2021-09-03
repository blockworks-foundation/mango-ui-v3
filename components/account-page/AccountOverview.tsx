import { useMemo } from 'react'
import styled from '@emotion/styled'
import {
  // ChartBarIcon,
  ScaleIcon,
  CurrencyDollarIcon,
  GiftIcon,
  HeartIcon,
} from '@heroicons/react/outline'
import { nativeToUi, ZERO_BN } from '@blockworks-foundation/mango-client'
import useMangoStore, {
  mangoClient,
  MNGO_INDEX,
} from '../../stores/useMangoStore'
import { formatUsdValue } from '../../utils'
import { notify } from '../../utils/notifications'
import { LinkButton } from '../Button'
import BalancesTable from '../BalancesTable'
import PositionsTable from '../PerpPositionsTable'

const StyledAccountValue = styled.div`
  font-size: 1.8rem;
  line-height: 1.2;
`

export default function AccountOverview() {
  const actions = useMangoStore((s) => s.actions)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)

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

  const mngoAccrued = useMemo(() => {
    return mangoAccount
      ? mangoAccount.perpAccounts.reduce((acc, perpAcct) => {
          return perpAcct.mngoAccrued.add(acc)
        }, ZERO_BN)
      : ZERO_BN
  }, [mangoAccount])

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

  return mangoAccount ? (
    <>
      <div className="grid grid-flow-col grid-cols-1 grid-rows-4 md:grid-cols-4 md:grid-rows-1 gap-4 pb-8">
        <div className="border border-th-bkg-4 p-4 rounded-lg">
          <div className="pb-2 text-th-fgd-3">Account Value</div>
          <div className="flex items-center pb-3">
            <CurrencyDollarIcon className="flex-shrink-0 h-7 w-7 mr-1.5 text-th-primary" />
            <StyledAccountValue className="font-bold text-th-fgd-1">
              {formatUsdValue(
                +mangoAccount.computeValue(mangoGroup, mangoCache)
              )}
            </StyledAccountValue>
          </div>
        </div>
        {/* <div className="border border-th-bkg-4 p-4 rounded-lg">
          <div className="pb-2 text-th-fgd-3">PNL</div>
          <div className="flex items-center pb-3">
            <ChartBarIcon className="flex-shrink-0 h-7 w-7 mr-1.5 text-th-primary" />
            <StyledAccountValue className="font-bold text-th-fgd-1">
              {formatUsdValue(
                +mangoAccount.computeValue(mangoGroup, mangoCache)
              )}
            </StyledAccountValue>
          </div>
        </div> */}
        <div className="border border-th-bkg-4 p-4 rounded-lg">
          <div className="pb-2 text-th-fgd-3">Leverage</div>
          <div className="flex items-center pb-3">
            <ScaleIcon className="flex-shrink-0 h-7 w-7 mr-1.5 text-th-primary" />
            <StyledAccountValue className="font-bold text-th-fgd-1">
              {mangoAccount.getLeverage(mangoGroup, mangoCache).toFixed(2)}x
            </StyledAccountValue>
          </div>
        </div>
        <div className="border border-th-bkg-4 p-4 rounded-lg">
          <div className="pb-2 text-th-fgd-3">Health Ratio</div>
          <div className="flex items-center pb-4">
            <HeartIcon className="flex-shrink-0 h-7 w-7 mr-1.5 text-th-primary" />
            <StyledAccountValue className="font-bold text-th-fgd-1">
              {maintHealthRatio < 1000 ? maintHealthRatio.toFixed(2) : '>999'}%
            </StyledAccountValue>
          </div>
          <div className="h-1.5 flex rounded bg-th-bkg-3">
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
        <div className="border border-th-bkg-4 p-4 rounded-lg">
          <div className="pb-2 text-th-fgd-3">MNGO Rewards</div>
          <div className="flex items-center pb-2">
            <GiftIcon className="flex-shrink-0 h-7 w-7 mr-1.5 text-th-primary" />
            <StyledAccountValue className="font-bold text-th-fgd-1">
              {mangoGroup
                ? nativeToUi(
                    mngoAccrued.toNumber(),
                    mangoGroup.tokens[MNGO_INDEX].decimals
                  )
                : 0}
            </StyledAccountValue>
          </div>
          <LinkButton
            onClick={handleRedeemMngo}
            disabled={mngoAccrued.eq(ZERO_BN)}
            className="text-th-primary text-xs"
          >
            Claim Reward
          </LinkButton>
        </div>
      </div>
      <div className="pb-8">
        <div className="pb-2 text-th-fgd-1 text-lg">Perp Positions</div>
        <PositionsTable />
      </div>
      <div className="pb-4 text-th-fgd-1 text-lg">Assets & Liabilities</div>

      <div className="grid grid-flow-col grid-cols-1 grid-rows-2 md:grid-cols-2 md:grid-rows-1 gap-4 pb-8">
        <div className="border border-th-bkg-4 p-4 rounded-lg">
          <div className="pb-0.5 text-xs text-th-fgd-3">Total Assets Value</div>
          <div className="flex items-center">
            <div className="text-lg text-th-fgd-1">
              {formatUsdValue(
                +mangoAccount.getAssetsVal(mangoGroup, mangoCache)
              )}
            </div>
          </div>
        </div>
        <div className="border border-th-bkg-4 p-4 rounded-lg">
          <div className="pb-0.5 text-xs text-th-fgd-3">
            Total Liabilities Value
          </div>
          <div className="flex items-center">
            <div className="text-lg text-th-fgd-1">
              {formatUsdValue(
                +mangoAccount.getLiabsVal(mangoGroup, mangoCache)
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="text-th-fgd-1 text-lg">Balances</div>
      <BalancesTable />
    </>
  ) : null
}
