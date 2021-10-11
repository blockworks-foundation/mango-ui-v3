import { useCallback, useState } from 'react'
import { CurrencyDollarIcon, LinkIcon } from '@heroicons/react/outline'
import useMangoStore from '../stores/useMangoStore'
import PageBodyContainer from '../components/PageBodyContainer'
import TopBar from '../components/TopBar'
import EmptyState from '../components/EmptyState'
import AccountsModal from '../components/AccountsModal'
import AccountBorrows from '../components/account_page/AccountBorrows'
import Loading from '../components/Loading'

export default function Borrow() {
  const [showAccountsModal, setShowAccountsModal] = useState(false)
  const connected = useMangoStore((s) => s.wallet.connected)
  const selectedMangoAccount = useMangoStore(
    (s) => s.selectedMangoAccount.current
  )
  const wallet = useMangoStore((s) => s.wallet.current)
  const isLoading = useMangoStore((s) => s.selectedMangoAccount.initialLoad)

  const handleCloseAccounts = useCallback(() => {
    setShowAccountsModal(false)
  }, [])

  return (
    <div className={`bg-th-bkg-1 text-th-fgd-1 transition-all`}>
      <TopBar />
      <PageBodyContainer>
        <div className="pt-8 pb-3 sm:pb-4 md:pt-10">
          <h1 className={`mb-1 text-th-fgd-1 text-2xl font-semibold`}>
            Borrow Funds
          </h1>
          <p>Borrowed funds are withdrawn to your connected wallet.</p>
        </div>
        <div className="bg-th-bkg-2 overflow-none p-4 sm:p-6 rounded-lg">
          {selectedMangoAccount ? (
            <AccountBorrows />
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
    </div>
  )
}
