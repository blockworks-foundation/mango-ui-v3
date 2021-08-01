import { FunctionComponent, useEffect, useState } from 'react'
import useMangoStore, { mangoClient } from '../stores/useMangoStore'
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
  const [name, setName] = useState(accountName || '')
  const [invalidNameMessage, setInvalidNameMessage] = useState('')
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const actions = useMangoStore((s) => s.actions)
  const setMangoStore = useMangoStore((s) => s.set)

  useEffect(() => {
    setMangoStore((state) => {
      state.blurBackground = true
    })
  }, [])

  const handleClose = () => {
    setMangoStore((state) => {
      state.blurBackground = false
    })
    onClose()
  }

  const submitName = async () => {
    const wallet = useMangoStore.getState().wallet.current

    try {
      const txid = await mangoClient.addMangoAccountInfo(
        mangoGroup,
        mangoAccount,
        wallet,
        name
      )
      actions.fetchMangoAccounts()
      onClose()
      notify({
        title: 'Account name updated',
        txid,
      })
    } catch (err) {
      console.warn('Error setting account name:', err)
      notify({
        title: 'Could not set account name',
        description: `${err}`,
        txid: err.txid,
        type: 'error',
      })
    }
  }

  const validateNameInput = () => {
    if (name.length >= 33) {
      setInvalidNameMessage('Account name must be 32 characters or less')
    }
    if (name.length === 0) {
      setInvalidNameMessage('Enter an account name')
    }
  }

  const onChangeNameInput = (name) => {
    setName(name)
    if (invalidNameMessage) {
      setInvalidNameMessage('')
    }
  }

  return (
    <Modal onClose={handleClose} isOpen={isOpen}>
      <Modal.Header>
        <div className="flex items-center">
          <ElementTitle noMarignBottom>Name your Account</ElementTitle>
        </div>
      </Modal.Header>
      <div className="flex items-center justify-center text-th-fgd-3 pb-4">
        Edit the public nickname for your account
        <Tooltip content="Account names are stored on-chain">
          <InformationCircleIcon className="h-5 w-5 ml-2 text-th-primary" />
        </Tooltip>
      </div>
      <div className="pb-2 text-th-fgd-1">Account Name</div>
      <Input
        type="text"
        className={`border border-th-fgd-4 flex-grow`}
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
        Save Name
      </Button>
    </Modal>
  )
}

export default AccountNameModal
