import { useCallback, useState, useEffect } from 'react'
import PageBodyContainer from '../components/PageBodyContainer'
import TopBar from '../components/TopBar'
import AccountsModal from '../components/AccountsModal'
import AccountBorrows from '../components/account_page/AccountBorrows'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import useMangoStore from '../stores/useMangoStore'
import { mangoGroupSelector } from '../stores/selectors'

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
      // Will be passed to the page component as props
    },
  }
}

export default function Borrow() {
  const [showAccountsModal, setShowAccountsModal] = useState(false)
  const mangoGroup = useMangoStore(mangoGroupSelector)

  const handleCloseAccounts = useCallback(() => {
    setShowAccountsModal(false)
  }, [])

  useEffect(() => {
    // @ts-ignore
    if (window.solana) {
      // @ts-ignore
      window.solana.connect({ onlyIfTrusted: true })
    }
  }, [])

  return (
    <div className={`bg-th-bkg-1 text-th-fgd-1 transition-all`}>
      <TopBar />
      <PageBodyContainer>
        <div className="bg-th-bkg-2 overflow-none p-4 sm:p-6 rounded-lg mt-10 md:mt-12">
          {mangoGroup ? <AccountBorrows /> : null}
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
