import { useCallback, useEffect, useState } from 'react'
import {
  CurrencyDollarIcon,
  DuplicateIcon,
  ExternalLinkIcon,
  LinkIcon,
  PencilIcon,
} from '@heroicons/react/outline'
import useMangoStore from '../stores/useMangoStore'
import { copyToClipboard } from '../utils'
import PageBodyContainer from '../components/PageBodyContainer'
import TopBar from '../components/TopBar'
import AccountAssets from '../components/account-page/AccountAssets'
import AccountBorrows from '../components/account-page/AccountBorrows'
import AccountOrders from '../components/account-page/AccountOrders'
import AccountHistory from '../components/account-page/AccountHistory'
import AccountsModal from '../components/AccountsModal'
import AccountOverview from '../components/account-page/AccountOverview'
import AccountNameModal from '../components/AccountNameModal'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import Loading from '../components/Loading'

const TABS = [
  'Portfolio',
  // 'Assets',
  // 'Borrows',
  // 'Stats',
  // 'Positions',
  'Orders',
  'History',
]

export default function Account() {
  const [activeTab, setActiveTab] = useState(TABS[0])
  const [showAccountsModal, setShowAccountsModal] = useState(false)
  const [showNameModal, setShowNameModal] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const connected = useMangoStore((s) => s.wallet.connected)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const wallet = useMangoStore((s) => s.wallet.current)
  const isLoading = useMangoStore((s) => s.selectedMangoAccount.initialLoad)

  const handleTabChange = (tabName) => {
    setActiveTab(tabName)
  }
  const handleCloseAccounts = useCallback(() => {
    setShowAccountsModal(false)
  }, [])

  const handleCopyPublicKey = (code) => {
    setIsCopied(true)
    copyToClipboard(code)
  }
  const handleCloseNameModal = useCallback(() => {
    setShowNameModal(false)
  }, [])

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [isCopied])

  return (
    <div className={`bg-th-bkg-1 text-th-fgd-1 transition-all`}>
      <TopBar />
      <PageBodyContainer>
        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 pb-3 sm:pb-3 md:pt-10">
          {mangoAccount ? (
            <>
              <div className="flex flex-col md:flex-row md:items-end pb-2 md:pb-0">
                <h1 className={`font-semibold mr-3 text-th-fgd-1 text-2xl`}>
                  {mangoAccount?.name || 'Account'}
                </h1>
                <div className="flex items-center pb-0.5 text-th-fgd-3 ">
                  <span className="text-xxs">
                    {mangoAccount.publicKey.toString()}
                  </span>
                  <DuplicateIcon
                    className="cursor-pointer default-transition h-4 w-4 ml-1.5 hover:text-th-fgd-1"
                    onClick={() => handleCopyPublicKey(mangoAccount.publicKey)}
                  />
                  {isCopied ? (
                    <div className="ml-2 text-th-fgd-2 text-xs">Copied!</div>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center">
                <Button
                  className="text-xs flex flex-grow items-center justify-center mr-2 pt-0 pb-0 h-8 pl-3 pr-3"
                  onClick={() => setShowNameModal(true)}
                >
                  <div className="flex items-center">
                    <PencilIcon className="h-4 w-4 mr-1.5" />
                    {mangoAccount?.name ? 'Edit Name' : 'Add Name'}
                  </div>
                </Button>
                <a
                  className="bg-th-bkg-4 default-transition flex flex-grow font-bold h-8 items-center justify-center pl-3 pr-3 rounded-full text-th-fgd-1 text-xs hover:text-th-fgd-1 hover:brightness-[1.15] focus:outline-none"
                  href={`https://explorer.solana.com/address/${mangoAccount?.publicKey}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>Explorer</span>
                  <ExternalLinkIcon className={`h-4 w-4 ml-1.5`} />
                </a>
                <Button
                  className="text-xs flex flex-grow items-center justify-center ml-2 pt-0 pb-0 h-8 pl-3 pr-3"
                  onClick={() => setShowAccountsModal(true)}
                >
                  Accounts
                </Button>
              </div>
            </>
          ) : null}
        </div>
        <div className="bg-th-bkg-2 overflow-none p-4 sm:p-6 rounded-lg">
          {mangoAccount ? (
            <>
              <div className="border-b border-th-fgd-4 mb-8">
                <nav className={`-mb-px flex space-x-6`} aria-label="Tabs">
                  {TABS.map((tabName) => (
                    <a
                      key={tabName}
                      onClick={() => handleTabChange(tabName)}
                      className={`whitespace-nowrap pb-4 px-1 border-b-2 font-semibold cursor-pointer default-transition hover:opacity-100
                ${
                  activeTab === tabName
                    ? `border-th-primary text-th-primary`
                    : `border-transparent text-th-fgd-4 hover:text-th-primary`
                }
              `}
                    >
                      {tabName}
                    </a>
                  ))}
                </nav>
              </div>

              <TabContent activeTab={activeTab} />
            </>
          ) : connected ? (
            isLoading ? (
              <div className="flex justify-center py-10">
                <Loading />
              </div>
            ) : (
              <EmptyState
                buttonText="Create Account"
                icon={<CurrencyDollarIcon />}
                onClickButton={() => setShowAccountsModal(true)}
                title="No Account Found"
              />
            )
          ) : (
            <EmptyState
              buttonText="Connect"
              desc="Connect a wallet to view your account"
              icon={<LinkIcon />}
              onClickButton={() => wallet.connect()}
              title="Connect Wallet"
            />
          )}
        </div>
      </PageBodyContainer>
      {showAccountsModal ? (
        <AccountsModal
          onClose={handleCloseAccounts}
          isOpen={showAccountsModal}
        />
      ) : null}
      {showNameModal ? (
        <AccountNameModal
          accountName={mangoAccount?.name}
          isOpen={showNameModal}
          onClose={handleCloseNameModal}
        />
      ) : null}
    </div>
  )
}

const TabContent = ({ activeTab }) => {
  switch (activeTab) {
    case 'Portfolio':
      return <AccountOverview />
    case 'Assets':
      return <AccountAssets />
    case 'Borrows':
      return <AccountBorrows />
    case 'Stats':
      return <div>Stats</div>
    case 'Positions':
      return <div>Positions</div>
    case 'Orders':
      return <AccountOrders />
    case 'History':
      return <AccountHistory />
    default:
      return <AccountOverview />
  }
}
