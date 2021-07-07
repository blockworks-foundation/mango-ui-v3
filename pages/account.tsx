import { useCallback, useState } from 'react'
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  ExternalLinkIcon,
  ChartPieIcon,
  LinkIcon,
} from '@heroicons/react/outline'
import useMangoStore from '../stores/useMangoStore'
import { abbreviateAddress } from '../utils'
import PageBodyContainer from '../components/PageBodyContainer'
import TopBar from '../components/TopBar'
import AccountAssets from '../components/account-page/AccountAssets'
import AccountBorrows from '../components/account-page/AccountBorrows'
import AccountOrders from '../components/account-page/AccountOrders'
import AccountHistory from '../components/account-page/AccountHistory'
import AccountsModal from '../components/AccountsModal'
import EmptyState from '../components/EmptyState'

const TABS = [
  'Assets',
  'Borrows',
  // 'Stats',
  // 'Positions',
  'Orders',
  'History',
]

export default function Account() {
  const [activeTab, setActiveTab] = useState(TABS[0])
  const [showAccountsModal, setShowAccountsModal] = useState(false)
  const connected = useMangoStore((s) => s.wallet.connected)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)

  const handleTabChange = (tabName) => {
    setActiveTab(tabName)
  }
  const handleCloseAccounts = useCallback(() => {
    setShowAccountsModal(false)
  }, [])

  return (
    <div className={`bg-th-bkg-1 text-th-fgd-1 transition-all`}>
      <TopBar />
      <PageBodyContainer>
        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 pb-3 sm:pb-6 md:pt-10">
          <h1 className={`text-th-fgd-1 text-2xl font-semibold`}>Account</h1>
          {mangoAccount ? (
            <div className="divide-x divide-th-fgd-4 flex justify-center w-full pt-4 sm:pt-0 sm:justify-end">
              <div className="pr-4 text-xs text-th-fgd-1">
                <div className="pb-0.5 text-2xs text-th-fgd-3">Owner</div>
                <a
                  className="default-transition flex items-center text-th-fgd-2"
                  href={`https://explorer.solana.com/address/${mangoAccount?.owner}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>{abbreviateAddress(mangoAccount?.owner)}</span>
                  <ExternalLinkIcon className={`h-3 w-3 ml-1`} />
                </a>
              </div>
              <div className="pl-4 text-xs text-th-fgd-1">
                <div className="pb-0.5 text-2xs text-th-fgd-3">
                  Margin Account
                </div>
                <a
                  className="default-transition flex items-center text-th-fgd-2"
                  href={`https://explorer.solana.com/address/${mangoAccount?.publicKey}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>{abbreviateAddress(mangoAccount?.publicKey)}</span>
                  <ExternalLinkIcon className={`h-3 w-3 ml-1`} />
                </a>
              </div>
            </div>
          ) : null}
        </div>
        <div className="bg-th-bkg-2 overflow-none p-6 rounded-lg">
          {mangoAccount ? (
            <>
              <div className="pb-4 text-th-fgd-1 text-lg">Overview</div>
              <div className="grid grid-flow-col grid-cols-1 grid-rows-4 sm:grid-cols-2 sm:grid-rows-2 md:grid-cols-4 md:grid-rows-1 gap-4 pb-10">
                <div className="bg-th-bkg-3 p-3 rounded-md">
                  <div className="pb-0.5 text-xs text-th-fgd-3">
                    Est. Account Value
                  </div>
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="flex-shrink-0 h-5 w-5 mr-2 text-th-primary" />
                    <div className="text-lg text-th-fgd-1">
                      $
                      {mangoAccount
                        .computeValue(mangoGroup, mangoCache)
                        .toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="bg-th-bkg-3 p-3 rounded-md">
                  <div className="pb-0.5 text-xs text-th-fgd-3">Total PnL</div>
                  <div className="flex items-center">
                    <ChartBarIcon className="flex-shrink-0 h-5 w-5 mr-2 text-th-primary" />
                    <div className="text-lg text-th-fgd-1">$0.00</div>
                  </div>
                </div>
                <div className="bg-th-bkg-3 p-3 rounded-md">
                  <div className="pb-0.5 text-xs text-th-fgd-3">
                    Health Ratio
                  </div>
                  <div className="flex items-center">
                    <ChartPieIcon className="flex-shrink-0 h-5 w-5 mr-2 text-th-primary" />
                    <div className="text-lg text-th-fgd-1">
                      {mangoAccount.getHealthRatio(
                        mangoGroup,
                        mangoCache,
                        'Maint'
                      )}
                      %
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-b border-th-fgd-4 mb-4">
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
            <EmptyState
              buttonText="Create Account"
              icon={<CurrencyDollarIcon />}
              onClickButton={() => setShowAccountsModal(true)}
              title="No Account Found"
            />
          ) : (
            <EmptyState
              desc="Connect a wallet to view your account"
              icon={<LinkIcon />}
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
    </div>
  )
}

const TabContent = ({ activeTab }) => {
  switch (activeTab) {
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
      return <AccountAssets />
  }
}
