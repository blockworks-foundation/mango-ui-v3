import SideNav from './SideNav'
import { breakpoints } from '../components/TradePageGrid'
import { useViewport } from 'hooks/useViewport'
import BottomBar from './mobile/BottomBar'
import { ConnectWalletButton } from './ConnectWalletButton'
import GlobalNotification from './GlobalNotification'
import useMangoAccount from 'hooks/useMangoAccount'
import { abbreviateAddress } from 'utils'
import { useCallback, useEffect, useState } from 'react'
import AccountsModal from './AccountsModal'
import { useRouter } from 'next/router'
import FavoritesShortcutBar from './FavoritesShortcutBar'
import { CogIcon, ExclamationCircleIcon } from '@heroicons/react/solid'
import { IconButton } from './Button'
import SettingsModal from './SettingsModal'
import { useTranslation } from 'next-i18next'

const Layout = ({ children }) => {
  const { t } = useTranslation('common')
  const { mangoAccount } = useMangoAccount()
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showAccountsModal, setShowAccountsModal] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false
  const router = useRouter()
  const { pathname } = router
  const { pubkey } = router.query

  useEffect(() => {
    const collapsed = width ? width < breakpoints.lg : false
    setIsCollapsed(collapsed)
  }, [])

  const handleCloseAccounts = useCallback(() => {
    setShowAccountsModal(false)
  }, [])

  return (
    <div className={`flex-grow bg-th-bkg-1 text-th-fgd-1 transition-all`}>
      <div className="flex">
        {isMobile ? (
          <div className="fixed bottom-0 left-0 z-20 w-full md:hidden">
            <BottomBar />
          </div>
        ) : (
          <div className={isCollapsed ? 'mr-[64px]' : 'mr-[220px]'}>
            <div className={`fixed z-20 h-screen`}>
              <SideNav collapsed={isCollapsed} setCollapsed={setIsCollapsed} />
            </div>
          </div>
        )}
        <div className="w-full overflow-hidden">
          <GlobalNotification />
          <div className="flex h-14 items-center justify-between border-b border-th-bkg-4 bg-th-bkg-1 px-6">
            {mangoAccount && mangoAccount.beingLiquidated ? (
              <div className="flex items-center justify-center">
                <ExclamationCircleIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-th-red" />
                <span className="text-th-red">{t('being-liquidated')}</span>
              </div>
            ) : (
              <div className="text-th-fgd-3">
                <span className="mb-0 mr-2 text-lg">
                  {pubkey ? '🕵️' : '👋'}
                </span>
                <span className="font-bold leading-none text-th-fgd-1">
                  {`${
                    mangoAccount
                      ? mangoAccount.name
                        ? mangoAccount.name
                        : abbreviateAddress(mangoAccount.publicKey)
                      : ''
                  }`}
                </span>
              </div>
            )}
            <div className="flex items-center space-x-4">
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
          <div className={pathname === '/' ? 'px-3' : 'px-6'}>{children}</div>
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
    </div>
  )
}

export default Layout
