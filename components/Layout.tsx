import SideNav from './SideNav'
import { breakpoints } from '../components/TradePageGrid'
import { useViewport } from 'hooks/useViewport'
import BottomBar from './mobile/BottomBar'
import { ConnectWalletButton } from './ConnectWalletButton'
import GlobalNotification from './GlobalNotification'
import useMangoAccount from 'hooks/useMangoAccount'
import { abbreviateAddress } from 'utils'
import { Fragment, useCallback, useEffect, useState } from 'react'
import AccountsModal from './AccountsModal'
import { useRouter } from 'next/router'
import FavoritesShortcutBar from './FavoritesShortcutBar'
import {
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CogIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/solid'
import Button, { IconButton } from './Button'
import SettingsModal from './SettingsModal'
import { useTranslation } from 'next-i18next'
import { useWallet } from '@solana/wallet-adapter-react'
import DepositModal from './DepositModal'
import WithdrawModal from './WithdrawModal'
import { Disclosure, Transition } from '@headlessui/react'
import HealthHeart from './HealthHeart'
import AccountOverviewPopover from './AccountOverviewPopover'

const Layout = ({ children }) => {
  const { t } = useTranslation(['common', 'delegate'])
  const { connected, publicKey } = useWallet()
  const { mangoAccount, initialLoad } = useMangoAccount()
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showAccountsModal, setShowAccountsModal] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false
  const router = useRouter()
  const { pathname } = router
  const { pubkey } = router.query

  const canWithdraw =
    mangoAccount?.owner && publicKey
      ? mangoAccount?.owner?.equals(publicKey)
      : false

  useEffect(() => {
    const collapsed = width ? width < breakpoints.lg : false
    setIsCollapsed(collapsed)
  }, [])

  const handleCloseAccounts = useCallback(() => {
    setShowAccountsModal(false)
  }, [])

  const handleToggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'))
    }, 100)
  }

  return (
    <div className={`flex-grow bg-th-bkg-1 text-th-fgd-1 transition-all`}>
      <div className="flex">
        {isMobile ? (
          <div className="fixed bottom-0 left-0 z-20 w-full md:hidden">
            <BottomBar />
          </div>
        ) : (
          <div
            className={
              isCollapsed ? 'mr-14' : 'mr-[220px] lg:mr-[250px] xl:mr-[280px]'
            }
          >
            <div className={`fixed z-20 h-screen`}>
              <IconButton
                className="absolute -right-4 top-1/2 z-20 h-10 w-4 -translate-y-1/2 transform rounded-none rounded-r"
                onClick={handleToggleSidebar}
              >
                <ChevronRightIcon
                  className={`default-transition h-5 w-5 ${
                    !isCollapsed ? 'rotate-180' : 'rotate-360'
                  }`}
                />
              </IconButton>
              <div
                className={`h-full ${!isCollapsed ? 'overflow-y-auto' : ''}`}
              >
                <SideNav collapsed={isCollapsed} />
              </div>
            </div>
          </div>
        )}
        <div className="w-full overflow-hidden">
          <GlobalNotification />
          <div className="flex h-14 items-center justify-between border-b border-th-bkg-3 bg-th-bkg-1 px-6">
            {mangoAccount && mangoAccount.beingLiquidated ? (
              <div className="flex items-center justify-center">
                <ExclamationCircleIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-th-red" />
                <span className="text-th-red">{t('being-liquidated')}</span>
              </div>
            ) : (
              <div className="flex items-center text-th-fgd-3">
                <span className="mb-0 mr-2 text-base">
                  {pubkey ? (
                    '🔎'
                  ) : connected ? (
                    initialLoad ? (
                      ''
                    ) : mangoAccount ? (
                      <HealthHeart size={24} health={24} />
                    ) : (
                      '👋'
                    )
                  ) : !isMobile ? (
                    '🔗'
                  ) : (
                    ''
                  )}
                </span>
                {connected || pubkey ? (
                  !initialLoad ? (
                    mangoAccount ? (
                      <Disclosure>
                        {({ open }) => (
                          <>
                            <Disclosure.Button className="flex w-full items-center justify-between rounded-none text-th-fgd-1 hover:text-th-primary">
                              <div className="flex items-center">
                                <span className="mr-0.5 font-bold">
                                  {mangoAccount.name
                                    ? mangoAccount.name
                                    : abbreviateAddress(mangoAccount.publicKey)}
                                </span>
                              </div>
                              <ChevronDownIcon
                                className={`${
                                  open
                                    ? 'rotate-180 transform'
                                    : 'rotate-360 transform'
                                } default-transition mt-0.5 h-6 w-6 flex-shrink-0`}
                              />
                            </Disclosure.Button>
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
                              <Disclosure.Panel className="absolute top-12 z-10 w-56 rounded-md bg-th-bkg-2 p-4">
                                <AccountOverviewPopover collapsed={false} />
                              </Disclosure.Panel>
                            </Transition>
                          </>
                        )}
                      </Disclosure>
                    ) : (
                      <span className="flex items-center text-th-fgd-3">
                        {t('create-account-helper')}
                        <ArrowRightIcon className="sideways-bounce ml-2 h-5 w-5 text-th-fgd-1" />
                      </span>
                    )
                  ) : (
                    <div className="h-4 w-32 animate-pulse rounded bg-th-bkg-3" />
                  )
                ) : !isMobile ? (
                  <span className="flex items-center text-th-fgd-3">
                    {t('connect-helper')}
                    <ArrowRightIcon className="sideways-bounce ml-2 h-5 w-5 text-th-fgd-1" />
                  </span>
                ) : null}
              </div>
            )}
            <div className="flex items-center space-x-4">
              {!isMobile && connected && !initialLoad ? (
                <div className="flex space-x-2">
                  {mangoAccount ? (
                    <Button
                      className="flex h-8 w-24 items-center justify-center pl-3 pr-3 text-xs"
                      onClick={() => setShowDepositModal(true)}
                    >
                      {t('deposit')}
                    </Button>
                  ) : (
                    <Button
                      className="flex h-8 w-32 items-center justify-center pl-3 pr-3 text-xs"
                      onClick={() => setShowAccountsModal(true)}
                    >
                      {t('create-account')}
                    </Button>
                  )}
                  {canWithdraw ? (
                    <Button
                      className="flex h-8 w-24 items-center justify-center border border-th-fgd-4 bg-transparent pl-3 pr-3 text-xs"
                      onClick={() => setShowWithdrawModal(true)}
                    >
                      {t('withdraw')}
                    </Button>
                  ) : null}
                </div>
              ) : null}
              <IconButton
                className="h-8 w-8"
                onClick={() => setShowSettingsModal(true)}
              >
                <CogIcon className="h-5 w-5" />
              </IconButton>
              <ConnectWalletButton />
            </div>
          </div>
          {pathname === '/' ? <FavoritesShortcutBar /> : null}
          <div className={pathname === '/' ? 'px-3' : 'px-6 pb-6'}>
            {children}
          </div>
        </div>
      </div>
      {showAccountsModal && (
        <AccountsModal
          onClose={handleCloseAccounts}
          isOpen={showAccountsModal}
        />
      )}
      {showSettingsModal ? (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
          isOpen={showSettingsModal}
        />
      ) : null}
      {showDepositModal && (
        <DepositModal
          isOpen={showDepositModal}
          onClose={() => setShowDepositModal(false)}
        />
      )}
      {showWithdrawModal && (
        <WithdrawModal
          isOpen={showWithdrawModal}
          onClose={() => setShowWithdrawModal(false)}
        />
      )}
    </div>
  )
}

export default Layout
