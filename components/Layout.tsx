import SideNav from './SideNav'
import { breakpoints } from '../components/TradePageGrid'
import { useViewport } from 'hooks/useViewport'
import BottomBar from './mobile/BottomBar'
import { ConnectWalletButton } from './ConnectWalletButton'
import GlobalNotification from './GlobalNotification'
import useMangoAccount from 'hooks/useMangoAccount'
import { abbreviateAddress } from 'utils'
import { useTranslation } from 'next-i18next'
import { useWallet } from '@solana/wallet-adapter-react'
import useMangoStore from 'stores/useMangoStore'
import { useCallback, useState } from 'react'
import AccountsModal from './AccountsModal'

const Layout = ({ children }) => {
  const { t } = useTranslation('common')
  const { connected, publicKey } = useWallet()
  const mangoAccounts = useMangoStore((s) => s.mangoAccounts)
  const { mangoAccount } = useMangoAccount()
  const [showAccountsModal, setShowAccountsModal] = useState(false)
  const { width } = useViewport()
  const collapsed = width ? width < breakpoints.lg : false
  const isMobile = width ? width < breakpoints.sm : false

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
          <div className={collapsed ? 'mr-[64px]' : 'mr-[220px]'}>
            <div className={`fixed z-20 h-screen`}>
              <SideNav collapsed={collapsed} toggled handleToggleSidebar />
            </div>
          </div>
        )}
        <div className="w-full">
          <GlobalNotification />
          <div className="flex h-14 items-center justify-between border-b border-[rgba(255,255,255,0.08)] bg-th-bkg-1">
            <div className="pl-4 text-th-fgd-3">
              <span className="mb-0">GM</span>
              <span className="font-bold leading-none text-th-fgd-1">
                <span className="text-th-fgd-3">, </span>
                {`${
                  mangoAccount
                    ? mangoAccount.name
                      ? mangoAccount.name
                      : abbreviateAddress(mangoAccount.publicKey)
                    : ' '
                } 👋`}
              </span>
            </div>
            <div className="flex items-center space-x-3 pr-4">
              {mangoAccount &&
              mangoAccount.owner.toBase58() === publicKey?.toBase58() ? (
                <button
                  className="rounded border border-th-bkg-4 py-1 px-2 text-xs focus:outline-none md:hover:border-th-fgd-4"
                  onClick={() => setShowAccountsModal(true)}
                >
                  <div className="text-xs font-normal text-th-primary">
                    {mangoAccounts
                      ? mangoAccounts.length === 1
                        ? `1 ${t('account')}`
                        : `${mangoAccounts.length} ${t('accounts')}`
                      : t('account')}
                  </div>
                  {mangoAccount.name
                    ? mangoAccount.name
                    : abbreviateAddress(mangoAccount.publicKey)}
                </button>
              ) : connected && !mangoAccount ? (
                <button
                  className="rounded border border-th-bkg-4 py-1 px-2 text-xs focus:outline-none md:hover:border-th-fgd-4"
                  onClick={() => setShowAccountsModal(true)}
                >
                  <div className="text-xs font-normal text-th-primary">
                    {`0 ${t('accounts')}`}
                  </div>
                  {t('get-started')} 😎
                </button>
              ) : null}
              <ConnectWalletButton />
            </div>
          </div>
          {children}
        </div>
      </div>
      {showAccountsModal && (
        <AccountsModal
          onClose={handleCloseAccounts}
          isOpen={showAccountsModal}
        />
      )}
    </div>
  )
}

export default Layout
