import { useCallback, useState } from 'react'
import AccountsModal from '../components/AccountsModal'
import AccountBorrows from '../components/account_page/AccountBorrows'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import useMangoStore from '../stores/useMangoStore'
import { mangoGroupSelector } from '../stores/selectors'
import { useTranslation } from 'next-i18next'

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'profile'])),
      // Will be passed to the page component as props
    },
  }
}

export default function Borrow() {
  const [showAccountsModal, setShowAccountsModal] = useState(false)
  const mangoGroup = useMangoStore(mangoGroupSelector)
  const { t } = useTranslation('common')

  const handleCloseAccounts = useCallback(() => {
    setShowAccountsModal(false)
  }, [])

  return (
    <div className="py-6">
      <div className="flex flex-col pb-4 sm:flex-row">
        <h1>{t('borrow')}</h1>
      </div>
      {mangoGroup ? <AccountBorrows /> : null}
      {showAccountsModal ? (
        <AccountsModal
          onClose={handleCloseAccounts}
          isOpen={showAccountsModal}
        />
      ) : null}
    </div>
  )
}
