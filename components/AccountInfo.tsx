import {
  I80F48,
  nativeI80F48ToUi,
  nativeToUi,
  QUOTE_INDEX,
  ZERO_BN,
  ZERO_I80F48,
} from '@blockworks-foundation/mango-client'
import { useCallback, useState } from 'react'
import {
  ExclamationIcon,
  ExternalLinkIcon,
  HeartIcon,
} from '@heroicons/react/solid'
import useMangoStore, { MNGO_INDEX } from '../stores/useMangoStore'
import { abbreviateAddress, formatUsdValue, usdFormatter } from '../utils'
import { notify } from '../utils/notifications'
import { LinkButton } from './Button'
import { ElementTitle } from './styles'
import Tooltip from './Tooltip'
import DepositModal from './DepositModal'
import WithdrawModal from './WithdrawModal'
import Button from './Button'
import { DataLoader } from './MarketPosition'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from './TradePageGrid'
import { useTranslation } from 'next-i18next'
import useMangoAccount from '../hooks/useMangoAccount'
import Loading from './Loading'

const I80F48_100 = I80F48.fromString('100')

export default function AccountInfo() {
  const { t } = useTranslation('common')
  const connected = useMangoStore((s) => s.wallet.connected)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const { mangoAccount, initialLoad } = useMangoAccount()
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const mangoClient = useMangoStore((s) => s.connection.client)
  const actions = useMangoStore((s) => s.actions)
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false
  const [redeeming, setRedeeming] = useState(false)

  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)

  const handleCloseDeposit = useCallback(() => {
    setShowDepositModal(false)
  }, [])

  const handleCloseWithdraw = useCallback(() => {
    setShowWithdrawModal(false)
  }, [])

  const equity = mangoAccount
    ? mangoAccount.computeValue(mangoGroup, mangoCache)
    : ZERO_I80F48

  const mngoAccrued = mangoAccount
    ? mangoAccount.perpAccounts.reduce((acc, perpAcct) => {
        return perpAcct.mngoAccrued.add(acc)
      }, ZERO_BN)
    : ZERO_BN
  // console.log('rerendering account info', mangoAccount, mngoAccrued.toNumber())

  const handleRedeemMngo = async () => {
    const wallet = useMangoStore.getState().wallet.current
    const mngoNodeBank =
      mangoGroup.rootBankAccounts[MNGO_INDEX].nodeBankAccounts[0]

    try {
      setRedeeming(true)
      const txid = await mangoClient.redeemAllMngo(
        mangoGroup,
        mangoAccount,
        wallet,
        mangoGroup.tokens[MNGO_INDEX].rootBank,
        mngoNodeBank.publicKey,
        mngoNodeBank.vault
      )
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
    } finally {
      actions.reloadMangoAccount()
      setRedeeming(false)
    }
  }

  const maintHealthRatio = mangoAccount
    ? mangoAccount.getHealthRatio(mangoGroup, mangoCache, 'Maint')
    : I80F48_100

  const initHealthRatio = mangoAccount
    ? mangoAccount.getHealthRatio(mangoGroup, mangoCache, 'Init')
    : I80F48_100

  const maintHealth = mangoAccount
    ? mangoAccount.getHealth(mangoGroup, mangoCache, 'Maint')
    : I80F48_100
  const initHealth = mangoAccount
    ? mangoAccount.getHealth(mangoGroup, mangoCache, 'Init')
    : I80F48_100

  const liquidationPrice =
    mangoGroup && mangoAccount && marketConfig
      ? mangoAccount.getLiquidationPrice(
          mangoGroup,
          mangoCache,
          marketConfig.marketIndex
        )
      : undefined

  return (
    <>
      <div
        className={!connected && !isMobile ? 'filter blur-sm' : undefined}
        id="account-details-tip"
      >
        {!isMobile ? (
          <ElementTitle>
            <Tooltip
              content={
                mangoAccount ? (
                  <div>
                    {t('init-health')}: {initHealth.toFixed(4)}
                    <br />
                    {t('maint-health')}: {maintHealth.toFixed(4)}
                  </div>
                ) : (
                  ''
                )
              }
            >
              {t('account')}
            </Tooltip>
          </ElementTitle>
        ) : null}
        <div>
          {mangoAccount ? (
            <div className="flex justify-center text-xs -mt-2">
              <a
                className="flex items-center text-th-fgd-4 hover:text-th-primary"
                href={`https://explorer.solana.com/address/${mangoAccount?.publicKey}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {abbreviateAddress(mangoAccount.publicKey, 6)}
                <ExternalLinkIcon className={`h-4 w-4 ml-1.5`} />
              </a>
            </div>
          ) : null}
          <div>
            <div className="flex justify-between pb-3">
              <div className="font-normal text-th-fgd-3 leading-4">
                {t('equity')}
              </div>
              <div className="text-th-fgd-1">
                {initialLoad ? <DataLoader /> : formatUsdValue(+equity)}
              </div>
            </div>
            <div className="flex justify-between pb-3">
              <div className="font-normal text-th-fgd-3 leading-4">
                {t('leverage')}
              </div>
              <div className="text-th-fgd-1">
                {initialLoad ? (
                  <DataLoader />
                ) : mangoAccount ? (
                  `${mangoAccount
                    .getLeverage(mangoGroup, mangoCache)
                    .toFixed(2)}x`
                ) : (
                  '0.00x'
                )}
              </div>
            </div>
            <div className={`flex justify-between pb-3`}>
              <div className="font-normal text-th-fgd-3 leading-4">
                {t('collateral-available')}
              </div>
              <div className={`text-th-fgd-1`}>
                {initialLoad ? (
                  <DataLoader />
                ) : mangoAccount ? (
                  usdFormatter(
                    nativeI80F48ToUi(
                      initHealth,
                      mangoGroup.tokens[QUOTE_INDEX].decimals
                    ).toFixed()
                  )
                ) : (
                  '--'
                )}
              </div>
            </div>
            <div className={`flex justify-between pb-3`}>
              <div className="font-normal text-th-fgd-3 leading-4">
                {marketConfig.name} {t('margin-available')}
              </div>
              <div className={`text-th-fgd-1`}>
                {mangoAccount
                  ? usdFormatter(
                      nativeI80F48ToUi(
                        mangoAccount.getMarketMarginAvailable(
                          mangoGroup,
                          mangoCache,
                          marketConfig.marketIndex,
                          marketConfig.kind
                        ),
                        mangoGroup.tokens[QUOTE_INDEX].decimals
                      ).toFixed()
                    )
                  : '0.00'}
              </div>
            </div>
            <div className={`flex justify-between pb-3`}>
              <div className="font-normal text-th-fgd-3 leading-4">
                {marketConfig.name} {t('estimated-liq-price')}
              </div>
              <div className={`text-th-fgd-1`}>
                {liquidationPrice && liquidationPrice.gt(ZERO_I80F48)
                  ? usdFormatter(liquidationPrice)
                  : 'N/A'}
              </div>
            </div>
            <div className={`flex justify-between pb-3`}>
              <Tooltip
                content={
                  <div>
                    {t('tooltip-earn-mngo')}{' '}
                    <a
                      href="https://docs.mango.markets/mango-v3/liquidity-incentives"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('learn-more')}
                    </a>
                  </div>
                }
              >
                <div className="cursor-help font-normal text-th-fgd-3 leading-4 border-b border-th-fgd-3 border-dashed border-opacity-20 default-transition hover:border-th-bkg-2">
                  {t('mngo-rewards')}
                </div>
              </Tooltip>
              <div className={`flex items-center text-th-fgd-1`}>
                {initialLoad ? (
                  <DataLoader />
                ) : mangoGroup ? (
                  nativeToUi(
                    mngoAccrued.toNumber(),
                    mangoGroup.tokens[MNGO_INDEX].decimals
                  )
                ) : (
                  0
                )}
                {redeeming ? (
                  <Loading className="ml-2" />
                ) : (
                  <LinkButton
                    onClick={handleRedeemMngo}
                    className="ml-2 text-th-primary text-xs disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:underline"
                    disabled={mngoAccrued.eq(ZERO_BN)}
                  >
                    {t('claim')}
                  </LinkButton>
                )}
              </div>
            </div>
          </div>
          <div className="border border-th-bkg-4 rounded flex items-center my-2 sm:my-3 p-2.5">
            <div className="flex items-center pr-2">
              <HeartIcon
                className="h-5 mr-1.5 w-5 text-th-primary"
                aria-hidden="true"
              />
              <span>
                <Tooltip
                  content={
                    <div>
                      {t('tooltip-account-liquidated')}{' '}
                      <a
                        href="https://docs.mango.markets/mango/health-overview"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t('learn-more')}
                      </a>
                    </div>
                  }
                >
                  <div className="cursor-help font-normal text-th-fgd-3 leading-4 border-b border-th-fgd-3 border-dashed border-opacity-20 default-transition hover:border-th-bkg-2">
                    {t('health')}
                  </div>
                </Tooltip>
              </span>
            </div>
            <div className="h-1.5 flex flex-grow rounded bg-th-bkg-4">
              <div
                style={{
                  width: `${maintHealthRatio}%`,
                }}
                className={`flex rounded ${
                  maintHealthRatio.toNumber() > 30
                    ? 'bg-th-green'
                    : initHealthRatio.toNumber() > 0
                    ? 'bg-th-orange'
                    : 'bg-th-red'
                }`}
              ></div>
            </div>
            <div className="pl-2 text-right">
              {maintHealthRatio.gt(I80F48_100)
                ? '>100'
                : maintHealthRatio.toFixed(2)}
              %
            </div>
          </div>
          {mangoAccount && mangoAccount.beingLiquidated ? (
            <div className="pt-0.5 text-xs sm:text-sm flex items-center justify-center">
              <ExclamationIcon className="flex-shrink-0 h-5 w-5 mr-1.5 text-th-red" />
              <span className="text-th-red">{t('being-liquidated')}</span>
            </div>
          ) : null}
          <div className={`grid grid-cols-2 grid-rows-1 gap-4 pt-2 sm:pt-4`}>
            <Button
              onClick={() => setShowDepositModal(true)}
              className="w-full"
              disabled={!connected}
            >
              <span>{t('deposit')}</span>
            </Button>
            <Button
              onClick={() => setShowWithdrawModal(true)}
              className="w-full"
              disabled={!connected || !mangoAccount}
            >
              <span>{t('withdraw')}</span>
            </Button>
          </div>
        </div>
      </div>
      {showDepositModal && (
        <DepositModal isOpen={showDepositModal} onClose={handleCloseDeposit} />
      )}
      {showWithdrawModal && (
        <WithdrawModal
          isOpen={showWithdrawModal}
          onClose={handleCloseWithdraw}
        />
      )}
    </>
  )
}
