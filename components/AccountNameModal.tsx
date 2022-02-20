import { FunctionComponent, useState } from 'react'
import useMangoStore from '../stores/useMangoStore'
import {
  ExclamationCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/outline'
import Input from './Input'
import Button from './Button'
import Modal from './Modal'
import { ElementTitle } from './styles'
import Tooltip from './Tooltip'
import { notify } from '../utils/notifications'
import { useTranslation } from 'next-i18next'

interface AccountNameModalProps {
  accountName?: string
  isOpen: boolean
  onClose?: (x?) => void
}

const AccountNameModal: FunctionComponent<AccountNameModalProps> = ({
  accountName,
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation('common')
  const [name, setName] = useState(accountName || '')
  const [invalidNameMessage, setInvalidNameMessage] = useState('')
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const mangoClient = useMangoStore((s) => s.connection.client)
  const actions = useMangoStore((s) => s.actions)

  const submitName = async () => {
    const wallet = useMangoStore.getState().wallet.current

    try {
      const txid = await mangoClient.addMangoAccountInfo(
        mangoGroup,
        mangoAccount,
        wallet,
        name
      )
      actions.fetchAllMangoAccounts()
      actions.reloadMangoAccount()
      onClose()
      notify({
        title: t('name-updated'),
        txid,
      })
    } catch (err) {
      console.warn('Error setting account name:', err)
      notify({
        title: t('name-error'),
        description: `${err}`,
        txid: err.txid,
        type: 'error',
      })
    }
  }

  const validateNameInput = () => {
    if (name.length >= 33) {
      setInvalidNameMessage(t('character-limit'))
    }
    if (name.length === 0) {
      setInvalidNameMessage(t('enter-name'))
    }
  }

  const onChangeNameInput = (name) => {
    setName(name)
    if (invalidNameMessage) {
      setInvalidNameMessage('')
    }
  }

  return (
    <Modal onClose={onClose} isOpen={isOpen}>
      <Modal.Header>
        <div className="flex items-center">
          <ElementTitle noMarginBottom>{t('name-your-account')}</ElementTitle>
        </div>
      </Modal.Header>
      <div className="flex items-center justify-center text-th-fgd-3 pb-4">
        {t('edit-nickname')}
        <Tooltip content={t('tooltip-name-onchain')}>
          <InformationCircleIcon className="h-5 w-5 ml-2 text-th-primary" />
        </Tooltip>
      </div>
      <div className="pb-2 text-th-fgd-1">{t('account-name')}</div>
      <Input
        type="text"
        error={!!invalidNameMessage}
        placeholder="e.g. Calypso"
        value={name}
        onBlur={validateNameInput}
        onChange={(e) => onChangeNameInput(e.target.value)}
      />
      {invalidNameMessage ? (
        <div className="flex items-center pt-1.5 text-th-red">
          <ExclamationCircleIcon className="h-4 w-4 mr-1.5" />
          {invalidNameMessage}
        </div>
      ) : null}
      <Button
        onClick={() => submitName()}
        disabled={name.length >= 33}
        className="mt-4 w-full"
      >
        {t('save-name')}
      </Button>
    </Modal>
  )
}

export default AccountNameModal
