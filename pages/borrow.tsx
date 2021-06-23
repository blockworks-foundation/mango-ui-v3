import { useCallback, useState } from 'react'
import { CurrencyDollarIcon, LinkIcon } from '@heroicons/react/outline'
import useMangoStore from '../stores/useMangoStore'
import PageBodyContainer from '../components/PageBodyContainer'
import TopBar from '../components/TopBar'
import EmptyState from '../components/EmptyState'
import AccountsModal from '../components/AccountsModal'
import AccountBorrows from '../components/account-page/AccountBorrows'

export default function Borrow() {
  const [showAccountsModal, setShowAccountsModal] = useState(false)
  const connected = useMangoStore((s) => s.wallet.connected)
  const selectedMangoAccount = useMangoStore(
    (s) => s.selectedMangoAccount.current
  )
  const handleCloseAccounts = useCallback(() => {
    setShowAccountsModal(false)
  }, [])
  return (
    <div className={`bg-th-bkg-1 text-th-fgd-1 transition-all`}>
      <TopBar />
      <PageBodyContainer>
        <div className="flex flex-col sm:flex-row pt-8 pb-3 sm:pb-6 md:pt-10">
          <h1 className={`text-th-fgd-1 text-2xl font-semibold`}>
            Borrow Funds
          </h1>
        </div>
        <div className="p-6 rounded-lg bg-th-bkg-2">
          {selectedMangoAccount ? (
            <AccountBorrows />
          ) : connected ? (
            <EmptyState
              buttonText="Create Account"
              icon={<CurrencyDollarIcon />}
              onClickButton={() => setShowAccountsModal(true)}
              title="No Account Found"
            />
          ) : (
            <EmptyState
              desc="Connect a wallet to view and create borrows"
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
