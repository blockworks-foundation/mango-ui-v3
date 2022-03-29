import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import TopBar from '../components/TopBar'
import PageBodyContainer from '../components/PageBodyContainer'
import useSrmAccount from '../hooks/useSrmAccount'
import {
  MSRM_DECIMALS,
  SRM_DECIMALS,
} from '@project-serum/serum/lib/token-instructions'
import { percentFormat } from '../utils/index'
import Tooltip from '../components/Tooltip'
import { InformationCircleIcon } from '@heroicons/react/outline'
import DepositMsrmModal from '../components/DepositMsrmModal'
import WithdrawMsrmModal from '../components/WithdrawMsrmModal'
import { useState } from 'react'
import { LinkButton } from '../components/Button'
import useMangoStore from '../stores/useMangoStore'
import { msrmMints, ZERO_BN } from '@blockworks-foundation/mango-client'
import useFees from '../hooks/useFees'
import { useWallet } from '@solana/wallet-adapter-react'

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
      // Will be passed to the page component as props
    },
  }
}

export default function Fees() {
  const { t } = useTranslation('common')
  const { totalSrm, totalMsrm, rates } = useSrmAccount()
  const { takerFee, makerFee } = useFees()
  const { connected } = useWallet()
  const [showDeposit, setShowDeposit] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const walletTokens = useMangoStore((s) => s.wallet.tokens)
  const cluster = useMangoStore.getState().connection.cluster
  const ownerMsrmAccount = walletTokens.find((t) =>
    t.account.mint.equals(msrmMints[cluster])
  )
  return (
    <div className={`bg-th-bkg-1 text-th-fgd-1 transition-all`}>
      <TopBar />
      <PageBodyContainer>
        <div className="flex flex-col py-4 sm:flex-row md:pb-4 md:pt-10">
          <h1>{t('fees')}</h1>
        </div>
        <div className="md:rounded-lg md:bg-th-bkg-2 md:p-6">
          <h2 className="mb-4">{t('futures')}</h2>

          <div className="grid grid-cols-1 grid-rows-2 pb-8 md:grid-cols-2 md:grid-rows-1 md:gap-4">
            <div className="border-t border-th-bkg-4 p-3 sm:p-4 md:border-b">
              <div className="pb-0.5 text-th-fgd-3">{t('maker-fee')}</div>
              <div className="flex items-center">
                <div className="text-xl font-bold text-th-fgd-1 md:text-2xl">
                  {percentFormat.format(makerFee)}
                </div>
              </div>
              <div className="flex items-center">
                <p className="mb-0">
                  {t('if-referred', {
                    fee: percentFormat.format(
                      makerFee < 0
                        ? makerFee + makerFee * 0.04
                        : makerFee - makerFee * 0.04
                    ),
                  })}
                </p>

                <Tooltip content={t('if-referred-tooltip')}>
                  <div>
                    <InformationCircleIcon
                      className={`ml-1.5 h-5 w-5 cursor-help text-th-fgd-3`}
                    />
                  </div>
                </Tooltip>
              </div>
            </div>
            <div className="border-b border-t border-th-bkg-4 p-3 sm:p-4">
              <div className="pb-0.5 text-th-fgd-3">{t('taker-fee')}</div>
              <div className="flex items-center">
                <div className="text-xl font-bold text-th-fgd-1 md:text-2xl">
                  {percentFormat.format(takerFee)}
                </div>
              </div>
              <div className="flex items-center">
                <p className="mb-0">
                  {t('if-referred', {
                    fee: percentFormat.format(
                      takerFee < 0
                        ? takerFee + takerFee * 0.04
                        : takerFee - takerFee * 0.04
                    ),
                  })}
                </p>

                <Tooltip content={t('if-referred-tooltip')}>
                  <div>
                    <InformationCircleIcon
                      className={`ml-1.5 h-5 w-5 cursor-help text-th-fgd-3`}
                    />
                  </div>
                </Tooltip>
              </div>
            </div>
          </div>
          <h2 className="mb-4">{t('serum-fees')}</h2>

          <div className="grid grid-cols-1 grid-rows-2 pb-8 md:grid-cols-3 md:grid-rows-1 md:gap-4">
            <div className="border-t border-th-bkg-4 p-3 sm:p-4 md:border-b">
              <div className="pb-0.5 text-th-fgd-3">{t('maker-fee')}</div>
              <div className="flex items-center">
                <div className="text-xl font-bold text-th-fgd-1 md:text-2xl">
                  {rates ? percentFormat.format(rates.maker) : null}
                </div>
              </div>
            </div>
            <div className="border-t border-th-bkg-4 p-3 sm:p-4 md:border-b">
              <div className="flex items-center pb-0.5 text-th-fgd-3">
                {t('taker-fee')}
                <Tooltip
                  content={t('tooltip-serum-rebate', {
                    taker_percent: percentFormat.format(rates.taker),
                  })}
                >
                  <div>
                    <InformationCircleIcon
                      className={`ml-1.5 h-5 w-5 cursor-help text-th-fgd-3`}
                    />
                  </div>
                </Tooltip>
              </div>
              <div className="flex items-center">
                <div className="text-xl font-bold text-th-fgd-1 md:text-2xl">
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
            <div className="border-b border-t border-th-bkg-4 p-3 sm:p-4">
              <div className="flex items-center justify-between pb-0.5 text-th-fgd-3">
                {totalMsrm > 0 ? 'MSRM' : 'SRM'} {t('deposits')}
                {connected && mangoAccount ? (
                  <div className="flex justify-center space-x-3 pl-2">
                    <LinkButton
                      onClick={() => setShowDeposit(true)}
                      disabled={!ownerMsrmAccount}
                    >
                      {t('deposit')}
                    </LinkButton>
                    {mangoAccount.msrmAmount.gt(ZERO_BN) ? (
                      <LinkButton onClick={() => setShowWithdraw(true)}>
                        {t('withdraw')}
                      </LinkButton>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <div className="flex items-center">
                <div className="text-xl font-bold text-th-fgd-1 md:text-2xl">
                  {totalMsrm > 0
                    ? totalMsrm.toLocaleString(undefined, {
                        maximumFractionDigits: MSRM_DECIMALS,
                      })
                    : totalSrm.toLocaleString(undefined, {
                        maximumFractionDigits: SRM_DECIMALS,
                      })}
                </div>
              </div>
            </div>
          </div>
          <h2 className="mb-4">{t('other')}</h2>
          <div className="grid grid-cols-1 grid-rows-3 pb-6 md:grid-cols-3 md:grid-rows-1 md:gap-4">
            <div className="border-t border-th-bkg-4 p-3 sm:p-4 md:border-b">
              <div className="pb-0.5 text-th-fgd-3">{t('withdraw')}</div>
              <div className="text-xl font-bold text-th-fgd-1 md:text-2xl">
                0%
              </div>
            </div>
            <div className="border-t border-th-bkg-4 p-3 sm:p-4 md:border-b">
              <div className="pb-0.5 text-th-fgd-3">{t('borrow')}</div>
              <div className="text-xl font-bold text-th-fgd-1 md:text-2xl">
                0%
              </div>
            </div>
            <div className="border-b border-t border-th-bkg-4 p-3 sm:p-4">
              <div className="pb-0.5 text-th-fgd-3">{t('lend')}</div>
              <div className="text-xl font-bold text-th-fgd-1 md:text-2xl">
                0%
              </div>
            </div>
          </div>
        </div>
      </PageBodyContainer>
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
