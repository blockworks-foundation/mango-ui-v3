import { useState, useCallback, Fragment } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useTranslation } from 'next-i18next'
import useMangoStore from '../stores/useMangoStore'
import useMangoAccount from '../hooks/useMangoAccount'
import { Popover, Transition } from '@headlessui/react'
import {
  I80F48,
  nativeI80F48ToUi,
  QUOTE_INDEX,
  ZERO_I80F48,
} from '@blockworks-foundation/mango-client'
import HealthHeart from './HealthHeart'
import { abbreviateAddress, formatUsdValue, usdFormatter } from 'utils'
import { ChevronUpIcon } from '@heroicons/react/solid'
import { DataLoader } from './MarketPosition'
import Button from './Button'
import { Menu, SubMenu } from 'react-pro-sidebar'
import DepositModal from './DepositModal'
import WithdrawModal from './WithdrawModal'

const AccountOverviewPopover = ({
  collapsed,
  open,
  setOpen,
}: {
  collapsed: boolean
  open: boolean
  setOpen: any
}) => {
  const { t } = useTranslation('common')
  const { publicKey } = useWallet()
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const { mangoAccount, initialLoad } = useMangoAccount()
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)

  const canWithdraw =
    mangoAccount?.owner && publicKey
      ? mangoAccount?.owner?.equals(publicKey)
      : false

  const handleCloseDeposit = useCallback(() => {
    setShowDepositModal(false)
  }, [])

  const handleCloseWithdraw = useCallback(() => {
    setShowWithdrawModal(false)
  }, [])

  const I80F48_100 = I80F48.fromString('100')

  const maintHealthRatio =
    mangoAccount && mangoGroup && mangoCache
      ? mangoAccount.getHealthRatio(mangoGroup, mangoCache, 'Maint')
      : I80F48_100

  const initHealth =
    mangoAccount && mangoGroup && mangoCache
      ? mangoAccount.getHealth(mangoGroup, mangoCache, 'Init')
      : I80F48_100

  const equity =
    mangoAccount && mangoGroup && mangoCache
      ? mangoAccount.computeValue(mangoGroup, mangoCache)
      : ZERO_I80F48

  const liquidationPrice =
    mangoGroup && mangoAccount && marketConfig && mangoGroup && mangoCache
      ? mangoAccount.getLiquidationPrice(
          mangoGroup,
          mangoCache,
          marketConfig.marketIndex
        )
      : undefined

  return (
    <>
      {mangoAccount ? (
        !collapsed ? (
          <Popover className="relative w-full min-w-[120px]">
            <div className="flex flex-col">
              <Popover.Button>
                <button
                  className={`default-transition flex w-full items-center justify-between rounded-md bg-th-bkg-1 p-4 text-th-fgd-1`}
                  onClick={() => setOpen(!open)}
                >
                  <div className="text-left">
                    <div className="flex items-center space-x-2">
                      <HealthHeart
                        health={Number(maintHealthRatio)}
                        size={32}
                      />
                      <div>
                        <p className="mb-0 whitespace-nowrap text-xs text-th-fgd-3">
                          {t('account-summary')}
                        </p>
                        <p className="mb-0 font-bold text-th-fgd-1">
                          {abbreviateAddress(mangoAccount.publicKey)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <ChevronUpIcon
                    className={`default-transition h-5 w-5 transform ${
                      open ? 'rotate-180' : 'rotate-360'
                    }`}
                  />
                </button>
              </Popover.Button>
              <Transition
                appear={true}
                show={open}
                as={Fragment}
                enter="transition-all ease-in duration-200"
                enterFrom="opacity-0 transform scale-75"
                enterTo="opacity-100 transform scale-100"
                leave="transition ease-out duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Popover.Panel
                  className="absolute bottom-[72px] z-10 w-[220px] overflow-y-auto"
                  static
                >
                  <div className="relative h-full border-t border-th-bkg-3 bg-th-bkg-1 p-4">
                    <div className="pb-2">
                      <p className="mb-0 text-xs leading-4">{t('value')}</p>
                      <p className="mb-0 font-bold text-th-fgd-1">
                        {initialLoad ? <DataLoader /> : formatUsdValue(+equity)}
                      </p>
                    </div>
                    <div className="pb-2">
                      <p className="mb-0 text-xs leading-4">{t('health')}</p>
                      <p className="mb-0 font-bold text-th-fgd-1">
                        {maintHealthRatio.gt(I80F48_100)
                          ? '>100'
                          : maintHealthRatio.toFixed(2)}
                        %
                      </p>
                    </div>
                    <div className="pb-2">
                      <p className="mb-0 text-xs leading-4">{t('leverage')}</p>
                      <p className="mb-0 font-bold text-th-fgd-1">
                        {initialLoad ? (
                          <DataLoader />
                        ) : mangoAccount && mangoGroup && mangoCache ? (
                          `${mangoAccount
                            .getLeverage(mangoGroup, mangoCache)
                            .toFixed(2)}x`
                        ) : (
                          '0.00x'
                        )}
                      </p>
                    </div>
                    <div className="pb-2">
                      <p className="mb-0 text-xs leading-4">
                        {t('collateral-available')}
                      </p>
                      <p className="mb-0 font-bold text-th-fgd-1">
                        {initialLoad ? (
                          <DataLoader />
                        ) : mangoAccount && mangoGroup ? (
                          usdFormatter(
                            nativeI80F48ToUi(
                              initHealth,
                              mangoGroup.tokens[QUOTE_INDEX].decimals
                            ).toFixed()
                          )
                        ) : (
                          '--'
                        )}
                      </p>
                    </div>
                    <div className="pb-2">
                      <p className="mb-0 text-xs leading-4">
                        {marketConfig.name} {t('margin-available')}
                      </p>
                      <p className="mb-0 font-bold text-th-fgd-1">
                        {mangoAccount && mangoGroup && mangoCache
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
                      </p>
                    </div>
                    <div>
                      <p className="mb-0 text-xs leading-4">
                        {marketConfig.name} {t('estimated-liq-price')}
                      </p>
                      <p className="mb-0 font-bold text-th-fgd-1">
                        {liquidationPrice && liquidationPrice.gt(ZERO_I80F48)
                          ? usdFormatter(liquidationPrice)
                          : 'N/A'}
                      </p>
                    </div>
                    <div className="mt-3 flex space-x-2">
                      <Button
                        className="w-1/2 pl-3 pr-3 text-xs"
                        onClick={() => setShowDepositModal(true)}
                      >
                        {t('deposit')}
                      </Button>
                      <Button
                        className="w-1/2 pl-3 pr-3 text-xs"
                        onClick={() => setShowWithdrawModal(true)}
                        disabled={!mangoAccount || !canWithdraw}
                      >
                        {t('withdraw')}
                      </Button>
                    </div>
                  </div>
                </Popover.Panel>
              </Transition>
            </div>
          </Popover>
        ) : (
          <Menu>
            <SubMenu
              title=""
              icon={<HealthHeart health={Number(maintHealthRatio)} size={32} />}
            >
              <div className="w-full py-2 pr-5">
                <p className="mb-0 text-xs text-th-fgd-3">{t('account')}</p>
                <p className="font-bold text-th-fgd-1">
                  {abbreviateAddress(mangoAccount.publicKey)}
                </p>
                <div className="pb-2">
                  <p className="mb-0 text-xs leading-4">{t('value')}</p>
                  <p className="mb-0 font-bold text-th-fgd-1">
                    {initialLoad ? <DataLoader /> : formatUsdValue(+equity)}
                  </p>
                </div>
                <div className="pb-2">
                  <p className="mb-0 text-xs leading-4">{t('health')}</p>
                  <p className="mb-0 font-bold text-th-fgd-1">
                    {maintHealthRatio.gt(I80F48_100)
                      ? '>100'
                      : maintHealthRatio.toFixed(2)}
                    %
                  </p>
                </div>
                <div className="pb-2">
                  <p className="mb-0 text-xs leading-4">{t('leverage')}</p>
                  <p className="mb-0 font-bold text-th-fgd-1">
                    {initialLoad ? (
                      <DataLoader />
                    ) : mangoAccount && mangoGroup && mangoCache ? (
                      `${mangoAccount
                        .getLeverage(mangoGroup, mangoCache)
                        .toFixed(2)}x`
                    ) : (
                      '0.00x'
                    )}
                  </p>
                </div>
                <div className="pb-2">
                  <p className="mb-0 text-xs leading-4">
                    {t('collateral-available')}
                  </p>
                  <p className="mb-0 font-bold text-th-fgd-1">
                    {initialLoad ? (
                      <DataLoader />
                    ) : mangoAccount && mangoGroup ? (
                      usdFormatter(
                        nativeI80F48ToUi(
                          initHealth,
                          mangoGroup.tokens[QUOTE_INDEX].decimals
                        ).toFixed()
                      )
                    ) : (
                      '--'
                    )}
                  </p>
                </div>
                <div className="pb-2">
                  <p className="mb-0 text-xs leading-4">
                    {marketConfig.name} {t('margin-available')}
                  </p>
                  <p className="mb-0 font-bold text-th-fgd-1">
                    {mangoAccount && mangoGroup && mangoCache
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
                  </p>
                </div>
                <div>
                  <p className="mb-0 text-xs leading-4">
                    {marketConfig.name} {t('estimated-liq-price')}
                  </p>
                  <p className="mb-0 font-bold text-th-fgd-1">
                    {liquidationPrice && liquidationPrice.gt(ZERO_I80F48)
                      ? usdFormatter(liquidationPrice)
                      : 'N/A'}
                  </p>
                </div>
                <div className="mt-3 flex w-full space-x-2">
                  <div
                    className="w-1/2 whitespace-nowrap rounded-full bg-th-bkg-button py-2 pl-3 pr-3 text-center text-xs font-bold text-th-fgd-1"
                    onClick={() => setShowDepositModal(true)}
                    role="button"
                  >
                    {t('deposit')}
                  </div>
                  <div
                    className="w-1/2 whitespace-nowrap rounded-full bg-th-bkg-button py-2 pl-3 pr-3 text-center text-xs font-bold text-th-fgd-1"
                    onClick={() => setShowWithdrawModal(true)}
                    role="button"
                  >
                    {t('withdraw')}
                  </div>
                </div>
              </div>
            </SubMenu>
          </Menu>
        )
      ) : null}
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

export default AccountOverviewPopover
