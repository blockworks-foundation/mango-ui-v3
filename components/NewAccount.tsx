import React, { FunctionComponent, useState } from 'react'
import {
  ExclamationCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/outline'
import Input, { Label } from './Input'
import AccountSelect from './AccountSelect'
import { ElementTitle } from './styles'
import useMangoStore from '../stores/useMangoStore'
import {
  getSymbolForTokenMintAddress,
  trimDecimals,
  sleep,
} from '../utils/index'
import Loading from './Loading'
import Button from './Button'
import Tooltip from './Tooltip'
import { notify } from '../utils/notifications'
import { deposit } from '../utils/mango'
import { useTranslation } from 'next-i18next'
import ButtonGroup from './ButtonGroup'
import InlineNotification from './InlineNotification'
import Modal from './Modal'
import { useWallet } from '@solana/wallet-adapter-react'

interface NewAccountProps {
  onAccountCreation: (x?) => void
}

const NewAccount: FunctionComponent<NewAccountProps> = ({
  onAccountCreation,
}) => {
  const { t } = useTranslation('common')
  const [inputAmount, setInputAmount] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [invalidAmountMessage, setInvalidAmountMessage] = useState('')
  const [depositPercentage, setDepositPercentage] = useState('')
  const [invalidNameMessage, setInvalidNameMessage] = useState('')
  const [name, setName] = useState('')
  const { wallet } = useWallet()
  const walletTokens = useMangoStore((s) => s.wallet.tokens)
  const actions = useMangoStore((s) => s.actions)

  const [selectedAccount, setSelectedAccount] = useState(walletTokens[0])

  const symbol = getSymbolForTokenMintAddress(
    selectedAccount?.account?.mint.toString()
  )

  const handleAccountSelect = (account) => {
    setInputAmount('')
    setDepositPercentage('')
    setInvalidAmountMessage('')
    setSelectedAccount(account)
  }

  const handleNewAccountDeposit = () => {
    if (!wallet) return
    setSubmitting(true)
    deposit({
      amount: parseFloat(inputAmount),
      fromTokenAcc: selectedAccount.account,
      accountName: name,
      wallet,
    })
      .then(async (response) => {
        await sleep(1000)
        actions.fetchWalletTokens(wallet)
        actions.fetchAllMangoAccounts(wallet)
        if (response && response.length > 0) {
          onAccountCreation(response[0])
          notify({
            title: 'Mango Account Created',
            txid: response[1],
          })
        }
        setSubmitting(false)
      })
      .catch((e) => {
        setSubmitting(false)
        console.error(e)
        notify({
          title: t('init-error'),
          description: e.message,
          type: 'error',
        })
        onAccountCreation()
      })
  }

  const validateAmountInput = (amount) => {
    if (Number(amount) <= 0) {
      setInvalidAmountMessage(t('enter-amount'))
    }
    if (Number(amount) > selectedAccount.uiBalance) {
      setInvalidAmountMessage(t('insufficient-balance-deposit'))
    }
  }

  const onChangeAmountInput = (amount) => {
    setInputAmount(amount)
    setDepositPercentage('')
    setInvalidAmountMessage('')
  }

  const onChangeAmountButtons = async (percentage) => {
    setDepositPercentage(percentage)

    if (!selectedAccount) {
      setInvalidAmountMessage(t('supported-assets'))
      return
    }

    const max = selectedAccount.uiBalance
    const amount = ((parseInt(percentage) / 100) * max).toString()
    if (percentage === '100') {
      setInputAmount(amount)
    } else {
      setInputAmount(trimDecimals(amount, 6).toString())
    }
    setInvalidAmountMessage('')
    validateAmountInput(amount)
  }

  const validateNameInput = () => {
    if (name.length >= 33) {
      setInvalidNameMessage(t('character-limit'))
    }
  }

  const onChangeNameInput = (name) => {
    setName(name)
    if (invalidNameMessage) {
      setInvalidNameMessage('')
    }
  }

  return (
    <>
      <Modal.Header>
        <ElementTitle noMarginBottom>{t('create-account')}</ElementTitle>
        <p className="mt-1 text-center">{t('insufficient-sol')}</p>
      </Modal.Header>
      <div className="mb-4 border-b border-th-bkg-4 pb-6">
        <Label className="flex items-center">
          {t('account-name')}{' '}
          <span className="ml-1 text-th-fgd-3">{t('optional')}</span>
          <Tooltip content={t('tooltip-name-onchain')}>
            <InformationCircleIcon className="ml-2 h-5 w-5 text-th-primary" />
          </Tooltip>
        </Label>
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
      </div>
      <h3 className="mb-2 text-center">{t('initial-deposit')}</h3>
      <AccountSelect
        accounts={walletTokens}
        selectedAccount={selectedAccount}
        onSelectAccount={handleAccountSelect}
      />
      <Label className="mt-4">{t('amount')}</Label>
      <Input
        type="number"
        min="0"
        placeholder="0.00"
        error={!!invalidAmountMessage}
        onBlur={(e) => validateAmountInput(e.target.value)}
        value={inputAmount || ''}
        onChange={(e) => onChangeAmountInput(e.target.value)}
        suffix={symbol}
      />
      {invalidAmountMessage ? (
        <div className="flex items-center pt-1.5 text-th-red">
          <ExclamationCircleIcon className="mr-1.5 h-4 w-4" />
          {invalidAmountMessage}
        </div>
      ) : null}
      <div className="pt-1">
        <ButtonGroup
          activeValue={depositPercentage}
          onChange={(v) => onChangeAmountButtons(v)}
          unit="%"
          values={['25', '50', '75', '100']}
        />
      </div>
      <div className={`flex justify-center pt-6`}>
        <Button
          disabled={
            parseFloat(inputAmount) <= 0 ||
            parseFloat(inputAmount) > selectedAccount?.uiBalance
          }
          onClick={handleNewAccountDeposit}
          className="w-full"
        >
          <div className={`flex items-center justify-center`}>
            {submitting && <Loading className="-ml-1 mr-3" />}
            {t('lets-go')}
          </div>
        </Button>
      </div>
      <div className="pt-3">
        <InlineNotification desc={t('interest-info')} type="info" />
      </div>
    </>
  )
}

export default NewAccount
