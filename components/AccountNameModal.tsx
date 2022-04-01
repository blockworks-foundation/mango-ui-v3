import { FunctionComponent, useState } from 'react'
import useMangoStore from '../stores/useMangoStore'
import {
  ExclamationCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/outline'
import Input, { Label } from './Input'
import Button from './Button'
import Modal from './Modal'
import { ElementTitle } from './styles'
import Tooltip from './Tooltip'
import { notify } from '../utils/notifications'
import { useTranslation } from 'next-i18next'
import { useWallet } from '@solana/wallet-adapter-react'

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
  const { wallet } = useWallet()
  const [name, setName] = useState(accountName || '')
  const [invalidNameMessage, setInvalidNameMessage] = useState('')
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const actions = useMangoStore((s) => s.actions)

  const submitName = async () => {
    const mangoClient = useMangoStore.getState().connection.client
    if (!wallet || !mangoAccount || !mangoGroup) return
    try {
      const txid = await mangoClient.addMangoAccountInfo(
        mangoGroup,
        mangoAccount,
        wallet?.adapter,
        name
      )
      actions.fetchAllMangoAccounts(wallet)
      actions.reloadMangoAccount()
      onClose?.()
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
        <ElementTitle noMarginBottom>{t('name-your-account')}</ElementTitle>
        <p className="flex items-center justify-center">
          {t('edit-nickname')}
          <Tooltip content={t('tooltip-name-onchain')}>
            <InformationCircleIcon className="ml-2 h-5 w-5 text-th-primary" />
          </Tooltip>
        </p>
      </Modal.Header>
      <Label>{t('account-name')}</Label>
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
          <ExclamationCircleIcon className="mr-1.5 h-4 w-4" />
          {invalidNameMessage}
        </div>
      ) : null}
      <Button
        onClick={() => submitName()}
        disabled={name.length >= 33}
        className="mt-6 w-full"
      >
        {t('save-name')}
      </Button>
    </Modal>
  )
}

export default AccountNameModal
