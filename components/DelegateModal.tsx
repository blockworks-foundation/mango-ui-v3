import { FunctionComponent, useState } from 'react'
import useMangoStore from '../stores/useMangoStore'
import {
  ExclamationCircleIcon,
  XIcon,
  InformationCircleIcon,
} from '@heroicons/react/outline'
import Input, { Label } from './Input'
import Tooltip from './Tooltip'
import Button, { IconButton } from './Button'
import Modal from './Modal'
import { ElementTitle } from './styles'
import { notify } from '../utils/notifications'
import { useTranslation } from 'next-i18next'
import { PublicKey } from '@solana/web3.js'

interface DelegateModalProps {
  delegate?: PublicKey
  isOpen: boolean
  onClose?: (x?) => void
}

const DelegateModal: FunctionComponent<DelegateModalProps> = ({
  delegate,
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation(['common', 'delegate'])

  const [keyBase58, setKeyBase58] = useState(
    delegate.equals(PublicKey.default) ? '' : delegate.toBase58()
  )
  const [invalidKeyMessage, setInvalidKeyMessage] = useState('')
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const mangoClient = useMangoStore((s) => s.connection.client)
  const actions = useMangoStore((s) => s.actions)

  const setDelegate = async () => {
    const wallet = useMangoStore.getState().wallet.current

    try {
      const key = keyBase58.length
        ? new PublicKey(keyBase58)
        : PublicKey.default
      const txid = await mangoClient.setDelegate(
        mangoGroup,
        mangoAccount,
        wallet,
        key
      )
      actions.reloadMangoAccount()
      onClose()
      notify({
        title: t('delegate:delegate-updated'),
        txid,
      })
    } catch (err) {
      console.warn('Error setting delegate key:', err)
      notify({
        title: t('delegate:set-error'),
        description: `${err}`,
        txid: err.txid,
        type: 'error',
      })
    }
  }

  const validateKeyInput = () => {
    if (isKeyValid()) {
      setInvalidKeyMessage('')
    } else {
      setInvalidKeyMessage(t('delegate:invalid-key'))
    }
  }

  const isKeyValid = () => {
    try {
      if (keyBase58.length == 0) {
        return true
      }

      // will throw if key is wrong length
      new PublicKey(keyBase58)
      return true
    } catch (e) {
      return false
    }
  }

  const onChangeKeyInput = (name) => {
    setKeyBase58(name)
    validateKeyInput()
  }

  return (
    <Modal onClose={onClose} isOpen={isOpen}>
      <Modal.Header>
        <div className="flex items-center">
          <ElementTitle noMarginBottom>
            {t('delegate:delegate-your-account')}
            <Tooltip
              content={
                <div>
                  <a
                    href="https://docs.mango.markets/mango/account-delegation"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('learn-more')}
                  </a>
                </div>
              }
            >
              <InformationCircleIcon className="h-5 w-5 ml-2 text-th-primary" />
            </Tooltip>
          </ElementTitle>
        </div>
      </Modal.Header>
      <div className="flex items-center justify-center text-th-fgd-3 pb-4">
        <p className="text-center">{t('delegate:info')}</p>
      </div>
      <Label>{t('delegate:public-key')}</Label>
      <Input
        type="text"
        error={!!invalidKeyMessage}
        value={keyBase58}
        onChange={(e) => {
          validateKeyInput()
          onChangeKeyInput(e.target.value)
        }}
        suffix={
          <IconButton
            disabled={!keyBase58.length}
            onClick={() => {
              onChangeKeyInput('')
            }}
          >
            <XIcon className="h-4 w-4" />
          </IconButton>
        }
      />
      {invalidKeyMessage ? (
        <div className="flex items-center pt-1.5 text-th-red">
          <ExclamationCircleIcon className="h-4 w-4 mr-1.5" />
          {invalidKeyMessage}
        </div>
      ) : null}
      <Button
        onClick={() => setDelegate()}
        disabled={!isKeyValid()}
        className="mt-6 w-full"
      >
        {t('delegate:set-delegate')}
      </Button>
    </Modal>
  )
}

export default DelegateModal
