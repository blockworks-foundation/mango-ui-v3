import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CurrencyDollarIcon,
  DuplicateIcon,
  ExternalLinkIcon,
  LinkIcon,
  PencilIcon,
} from '@heroicons/react/outline'
import {
  getTokenBySymbol,
  getMarketByPublicKey,
  nativeI80F48ToUi,
  PerpMarket,
} from '@blockworks-foundation/mango-client'
import useMangoStore from '../stores/useMangoStore'
import { useBalances } from '../hooks/useBalances'
import { abbreviateAddress, copyToClipboard } from '../utils'
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

const TABS = [
  'Overview',
  'Assets',
  'Borrows',
  // 'Stats',
  // 'Positions',
  'Orders',
  'Activity',
]

export default function Account() {
  const [activeTab, setActiveTab] = useState(TABS[0])
  const [showAccountsModal, setShowAccountsModal] = useState(false)
  const [portfolio, setPortfolio] = useState([])
  const allMarkets = useMangoStore((s) => s.selectedMangoGroup.markets)
  const balances = useBalances()
  const [showNameModal, setShowNameModal] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const connected = useMangoStore((s) => s.wallet.connected)
  const groupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const wallet = useMangoStore((s) => s.wallet.current)

  const handleTabChange = (tabName) => {
    setActiveTab(tabName)
  }
  const handleCloseAccounts = useCallback(() => {
    setShowAccountsModal(false)
  }, [])

  const perpMarkets = useMemo(
    () =>
      mangoGroup
        ? groupConfig.perpMarkets.map(
            (m) => mangoGroup.perpMarkets[m.marketIndex]
          )
        : [],
    [mangoGroup]
  )

  const perpAccounts = useMemo(
    () =>
      mangoAccount
        ? groupConfig.perpMarkets.map(
            (m) => mangoAccount.perpAccounts[m.marketIndex]
          )
        : [],
    [mangoAccount]
  )

  useEffect(() => {
    const portfolio = []
    perpAccounts.forEach((acc, index) => {
      const market = perpMarkets[index]
      const marketConfig = getMarketByPublicKey(groupConfig, market.perpMarket)
      const perpMarket = allMarkets[
        marketConfig.publicKey.toString()
      ] as PerpMarket
      if (
        +nativeI80F48ToUi(acc.quotePosition, marketConfig.quoteDecimals) > 0
      ) {
        portfolio.push({
          market: marketConfig.name,
          balance: perpMarket.baseLotsToNumber(acc.basePosition),
          symbol: marketConfig.baseSymbol,
          value: +nativeI80F48ToUi(
            acc.quotePosition,
            marketConfig.quoteDecimals
          ),
          type:
            perpMarket.baseLotsToNumber(acc.basePosition) > 0
              ? 'Long'
              : 'Short',
        })
      }
    })
    balances.forEach((b) => {
      const token = getTokenBySymbol(groupConfig, b.symbol)
      const tokenIndex = mangoGroup.getTokenIndex(token.mintKey)
      if (+b.marginDeposits > 0) {
        portfolio.push({
          market: b.symbol,
          balance: +b.marginDeposits + b.orders + b.unsettled,
          symbol: b.symbol,
          value:
            (+b.marginDeposits + b.orders + b.unsettled) *
            mangoGroup.getPrice(tokenIndex, mangoCache).toNumber(),
          type: 'Deposits',
        })
      }
      if (+b.borrows > 0) {
        portfolio.push({
          market: b.symbol,
          balance: +b.borrows,
          value: b.borrows.mul(mangoGroup.getPrice(tokenIndex, mangoCache)),
          type: 'Borrows',
        })
      }
    })
    setPortfolio(portfolio.sort((a, b) => b.value - a.value))
  }, [perpAccounts])

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
        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 pb-3 sm:pb-6 md:pt-10">
          {mangoAccount ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-end pb-4 md:pb-0">
                <h1 className={`font-semibold mr-3 text-th-fgd-1 text-2xl`}>
                  {mangoAccount?.name || 'Account'}
                </h1>
                <div className="flex items-center pb-0.5 text-th-fgd-3 ">
                  {abbreviateAddress(mangoAccount.publicKey)}
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
                  className="bg-th-bkg-4 default-transition flex flex-grow font-bold h-8 items-center justify-center pl-3 pr-3 rounded-full text-th-fgd-1 text-xs hover:bg-th-bkg-3 hover:text-th-fgd-1 focus:outline-none"
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
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="h-4 w-4 mr-1.5" />
                    Accounts
                  </div>
                </Button>
              </div>
            </>
          ) : null}
        </div>
        <div className="bg-th-bkg-2 overflow-none p-6 rounded-lg">
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
            <EmptyState
              buttonText="Create Account"
              icon={<CurrencyDollarIcon />}
              onClickButton={() => setShowAccountsModal(true)}
              title="No Account Found"
            />
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
    case 'Overview':
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
