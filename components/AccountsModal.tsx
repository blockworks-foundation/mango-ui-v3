import React, { FunctionComponent, useEffect, useState } from 'react'
import { PlusCircleIcon } from '@heroicons/react/outline'
import useMangoStore from '../stores/useMangoStore'
import Modal from './Modal'
import { ElementTitle } from './styles'
import Button, { LinkButton } from './Button'
import NewAccount from './NewAccount'
import { useTranslation } from 'next-i18next'
import SelectMangoAccount from './SelectMangoAccount'

interface AccountsModalProps {
  onClose: () => void
  isOpen: boolean
}

const AccountsModal: FunctionComponent<AccountsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation('common')
  const [showNewAccountForm, setShowNewAccountForm] = useState(false)
  const [newAccPublicKey, setNewAccPublicKey] = useState(null)
  const mangoAccounts = useMangoStore((s) => s.mangoAccounts)
  const setMangoStore = useMangoStore((s) => s.set)

  useEffect(() => {
    if (newAccPublicKey) {
      setMangoStore((state) => {
        state.selectedMangoAccount.current =
          mangoAccounts.find(
            (ma) => ma.publicKey.toString() === newAccPublicKey
          ) ?? null
      })
    }
  }, [mangoAccounts, newAccPublicKey])

  const handleNewAccountCreation = (newAccPublicKey) => {
    if (newAccPublicKey) {
      setNewAccPublicKey(newAccPublicKey)
    }
    setShowNewAccountForm(false)
  }

  const handleShowNewAccountForm = () => {
    setNewAccPublicKey(null)
    setShowNewAccountForm(true)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {mangoAccounts.length > 0 ? (
        !showNewAccountForm ? (
          <>
            <Modal.Header>
              <ElementTitle noMarginBottom>{t('mango-accounts')}</ElementTitle>
            </Modal.Header>
            <div className="flex items-center justify-between pb-3 text-th-fgd-1">
              <div className="font-semibold">
                {mangoAccounts.length > 1
                  ? t('select-account')
                  : t('your-account')}
              </div>
              <Button
                className="flex h-8 items-center justify-center pt-0 pb-0 pl-3 pr-3 text-xs"
                onClick={() => handleShowNewAccountForm()}
              >
                <div className="flex items-center">
                  <PlusCircleIcon className="mr-1.5 h-5 w-5" />
                  {t('new-account')}
                </div>
              </Button>
            </div>

            <SelectMangoAccount onClose={onClose} />
          </>
        ) : (
          <>
            <NewAccount onAccountCreation={handleNewAccountCreation} />
            <LinkButton
              className="mt-4 flex w-full justify-center"
              onClick={() => setShowNewAccountForm(false)}
            >
              {t('cancel')}
            </LinkButton>
          </>
        )
      ) : (
        <NewAccount onAccountCreation={handleNewAccountCreation} />
      )}
    </Modal>
  )
}

export default React.memo(AccountsModal)
