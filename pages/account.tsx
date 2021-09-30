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
import AccountOrders from '../components/account_page/AccountOrders'
import AccountHistory from '../components/account_page/AccountHistory'
import AccountsModal from '../components/AccountsModal'
import AccountOverview from '../components/account_page/AccountOverview'
import AccountNameModal from '../components/AccountNameModal'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import Loading from '../components/Loading'
import SwipeableTabs from '../components/mobile/SwipeableTabs'
import Swipeable from '../components/mobile/Swipeable'
import Tabs from '../components/Tabs'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from '../components/TradePageGrid'

const TABS = [
  'Portfolio',
  // 'Assets',
  // 'Borrows',
  // 'Stats',
  // 'Positions',
  'Orders',
  'Trade History',
]

export default function Account() {
  const [showAccountsModal, setShowAccountsModal] = useState(false)
  const [showNameModal, setShowNameModal] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const connected = useMangoStore((s) => s.wallet.connected)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const wallet = useMangoStore((s) => s.wallet.current)
  const isLoading = useMangoStore((s) => s.selectedMangoAccount.initialLoad)
  const [viewIndex, setViewIndex] = useState(0)
  const [activeTab, setActiveTab] = useState(TABS[0])
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false

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

  const handleChangeViewIndex = (index) => {
    setViewIndex(index)
  }

  const handleTabChange = (tabName) => {
    setActiveTab(tabName)
  }

  return (
    <div className={`bg-th-bkg-1 text-th-fgd-1 transition-all`}>
      <TopBar />
      <PageBodyContainer>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between py-4 md:pb-4 md:pt-10">
          {mangoAccount ? (
            <>
              <div className="pb-3 md:pb-0">
                <h1
                  className={`font-semibold mb-1 mr-3 text-th-fgd-1 text-2xl`}
                >
                  {mangoAccount?.name || 'Account'}
                </h1>
                <div className="flex items-center pb-0.5 text-th-fgd-3 ">
                  <span className="text-xxs sm:text-xs">
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
              <div className="grid grid-cols-3 grid-rows-1 gap-2">
                <Button
                  className="col-span-1 flex items-center justify-center pt-0 pb-0 h-8 pl-3 pr-3 text-xs"
                  onClick={() => setShowNameModal(true)}
                >
                  <div className="flex items-center">
                    <PencilIcon className="h-4 w-4 mr-1.5" />
                    {mangoAccount?.name ? 'Edit Name' : 'Add Name'}
                  </div>
                </Button>
                <a
                  className="bg-th-bkg-4 col-span-1 default-transition flex font-bold h-8 items-center justify-center pl-3 pr-3 rounded-full text-th-fgd-1 text-xs hover:text-th-fgd-1 hover:brightness-[1.15] focus:outline-none"
                  href={`https://explorer.solana.com/address/${mangoAccount?.publicKey}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>Explorer</span>
                  <ExternalLinkIcon className={`h-4 w-4 ml-1.5`} />
                </a>
                <Button
                  className="col-span-1 flex items-center justify-center pt-0 pb-0 h-8 pl-3 pr-3 text-xs"
                  onClick={() => setShowAccountsModal(true)}
                >
                  Accounts
                </Button>
              </div>
            </>
          ) : null}
        </div>
        {mangoAccount ? (
          !isMobile ? (
            <Tabs
              activeTab={activeTab}
              onChange={handleTabChange}
              tabs={TABS}
            />
          ) : (
            <SwipeableTabs
              onChange={handleChangeViewIndex}
              tabs={TABS}
              tabIndex={viewIndex}
            />
          )
        ) : null}
        <div className="bg-th-bkg-2 p-4 sm:p-6 rounded-lg">
          {mangoAccount ? (
            !isMobile ? (
              <TabContent activeTab={activeTab} />
            ) : (
              <Swipeable
                index={viewIndex}
                onChangeIndex={handleChangeViewIndex}
              >
                <div>
                  <AccountOverview />
                </div>
                <div>
                  <AccountOrders />
                </div>
                <div>
                  <AccountHistory />
                </div>
              </Swipeable>
            )
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
    case 'Orders':
      return <AccountOrders />
    case 'Trade History':
      return <AccountHistory />
    default:
      return <AccountOverview />
  }
}
