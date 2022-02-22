import { useMemo } from 'react'
import {
  ScaleIcon,
  CurrencyDollarIcon,
  GiftIcon,
  HeartIcon,
} from '@heroicons/react/outline'
import { nativeToUi, ZERO_BN } from '@blockworks-foundation/mango-client'
import useMangoStore, { MNGO_INDEX } from '../../stores/useMangoStore'
import { formatUsdValue } from '../../utils'
import { notify } from '../../utils/notifications'
import { LinkButton } from '../Button'
import BalancesTable from '../BalancesTable'
import PositionsTable from '../PerpPositionsTable'
import Switch from '../Switch'
import useLocalStorageState from '../../hooks/useLocalStorageState'
import { ExclamationIcon } from '@heroicons/react/solid'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'

const SHOW_ZERO_BALANCE_KEY = 'showZeroAccountBalances-0.2'

export default function AccountOverview() {
  const { t } = useTranslation('common')
  const actions = useMangoStore((s) => s.actions)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const mangoClient = useMangoStore((s) => s.connection.client)
  const router = useRouter()
  const { pubkey } = router.query
  const [showZeroBalances, setShowZeroBalances] = useLocalStorageState(
    SHOW_ZERO_BALANCE_KEY,
    true
  )

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
      actions.reloadMangoAccount()
      notify({
        title: t('redeem-success'),
        description: '',
        txid,
      })
    } catch (e) {
      notify({
        title: t('redeem-failure'),
        description: e.message,
        txid: e.txid,
        type: 'error',
      })
    }
  }

  return mangoAccount ? (
    <>
      <div className="grid grid-flow-col grid-cols-2 grid-rows-2 lg:grid-cols-4 lg:grid-rows-1 gap-2 sm:gap-4 pb-8">
        <div className="border border-th-bkg-4 p-3 sm:p-4 rounded-md sm:rounded-lg">
          <div className="pb-0.5 sm:pb-2 text-th-fgd-3 text-xs sm:text-sm">
            {t('account-value')}
          </div>
          <div className="flex items-center pb-1 sm:pb-3">
            <CurrencyDollarIcon className="flex-shrink-0 h-5 w-5 sm:h-7 sm:w-7 mr-1.5 text-th-primary" />
            <div className="font-bold text-th-fgd-1 text-xl sm:text-2xl">
              {formatUsdValue(
                +mangoAccount.computeValue(mangoGroup, mangoCache)
              )}
            </div>
          </div>
        </div>
        {/* <div className="border border-th-bkg-4 p-3 sm:p-4 rounded-md sm:rounded-lg">
          <div className="pb-0.5 sm:pb-2 text-th-fgd-3 text-xs sm:text-sm">PNL</div>
          <div className="flex items-center pb-1 sm:pb-3">
            <ChartBarIcon className="flex-shrink-0 h-5 w-5 sm:h-7 sm:w-7 mr-1.5 text-th-primary" />
            <div className="font-bold text-th-fgd-1 text-xl sm:text-2xl">
              {formatUsdValue(
                +mangoAccount.computeValue(mangoGroup, mangoCache)
              )}
            </div>
          </div>
        </div> */}
        <div className="border border-th-bkg-4 p-3 sm:p-4 rounded-md sm:rounded-lg">
          <div className="pb-0.5 sm:pb-2 text-th-fgd-3 text-xs sm:text-sm">
            {t('leverage')}
          </div>
          <div className="flex items-center pb-1 sm:pb-3">
            <ScaleIcon className="flex-shrink-0 h-5 w-5 sm:h-7 sm:w-7 mr-1.5 text-th-primary" />
            <div className="font-bold text-th-fgd-1 text-xl sm:text-2xl">
              {mangoAccount.getLeverage(mangoGroup, mangoCache).toFixed(2)}x
            </div>
          </div>
        </div>
        <div className="border border-th-bkg-4 p-3 sm:p-4 rounded-md sm:rounded-lg">
          <div className="pb-0.5 sm:pb-2 text-th-fgd-3 text-xs sm:text-sm">
            {t('health-ratio')}
          </div>
          <div className="flex items-center pb-3 sm:pb-4">
            <HeartIcon className="flex-shrink-0 h-5 w-5 sm:h-7 sm:w-7 mr-1.5 text-th-primary" />
            <div className="font-bold text-th-fgd-1 text-xl sm:text-2xl">
              {maintHealthRatio < 1000 ? maintHealthRatio.toFixed(2) : '>100'}%
            </div>
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
          {mangoAccount.beingLiquidated ? (
            <div className="pt-0.5 sm:pt-2 text-xs sm:text-sm flex items-center">
              <ExclamationIcon className="flex-shrink-0 h-5 w-5 sm:h-7 sm:w-7 mr-1.5 text-th-red" />
              <span className="text-th-red">{t('being-liquidated')}</span>
            </div>
          ) : null}
        </div>
        <div className="border border-th-bkg-4 p-3 sm:p-4 rounded-md sm:rounded-lg">
          <div className="pb-0.5 sm:pb-2 text-th-fgd-3 text-xs sm:text-sm">
            {t('mngo-rewards')}
          </div>
          <div className="flex items-center pb-1 sm:pb-2">
            <GiftIcon className="flex-shrink-0 h-5 w-5 sm:h-7 sm:w-7 mr-1.5 text-th-primary" />
            <div className="font-bold text-th-fgd-1 text-xl sm:text-2xl">
              {mangoGroup
                ? nativeToUi(
                    mngoAccrued.toNumber(),
                    mangoGroup.tokens[MNGO_INDEX].decimals
                  )
                : 0}
            </div>
          </div>
          {!pubkey ? (
            <LinkButton
              onClick={handleRedeemMngo}
              disabled={mngoAccrued.eq(ZERO_BN)}
              className="text-th-primary text-xs"
            >
              {t('claim-reward')}
            </LinkButton>
          ) : null}
        </div>
      </div>
      <div className="pb-8">
        <h2 className="mb-4">{t('perp-positions')}</h2>
        <PositionsTable />
      </div>
      <h2 className="mb-4">{t('assets-liabilities')}</h2>

      <div className="grid grid-flow-col grid-cols-1 grid-rows-2 md:grid-cols-2 md:grid-rows-1 gap-2 sm:gap-4 pb-8">
        <div className="border border-th-bkg-4 p-3 sm:p-4 rounded-md sm:rounded-lg">
          <div className="pb-0.5 text-xs text-th-fgd-3">
            {t('total-assets')}
          </div>
          <div className="flex items-center">
            <div className="text-lg text-th-fgd-1">
              {formatUsdValue(
                +mangoAccount.getAssetsVal(mangoGroup, mangoCache)
              )}
            </div>
          </div>
        </div>
        <div className="border border-th-bkg-4 p-3 sm:p-4 rounded-md sm:rounded-lg">
          <div className="pb-0.5 text-xs text-th-fgd-3">
            {t('total-liabilities')}
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
      <div className="flex justify-between pb-4">
        <h2>{t('balances')}</h2>
        <Switch
          checked={showZeroBalances}
          className="text-xs"
          onChange={() => setShowZeroBalances(!showZeroBalances)}
        >
          {t('show-zero')}
        </Switch>
      </div>
      <BalancesTable showZeroBalances={showZeroBalances} showDepositWithdraw />
    </>
  ) : null
}
