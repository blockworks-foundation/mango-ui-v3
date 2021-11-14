import React, { FunctionComponent, useState } from 'react'
import {
  ExclamationCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/outline'
import Input from './Input'
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

interface NewAccountProps {
  onAccountCreation?: (x?) => void
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
    setSubmitting(true)
    deposit({
      amount: parseFloat(inputAmount),
      fromTokenAcc: selectedAccount.account,
      accountName: name,
    })
      .then(async (response) => {
        await sleep(1000)
        actions.fetchWalletTokens()
        actions.fetchAllMangoAccounts()
        setSubmitting(false)
        onAccountCreation(response)
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
      <ElementTitle>Create Account</ElementTitle>
      <div className="mx-auto pb-4 text-center text-th-fgd-3 text-xs">
        {t('insufficient-sol')}
      </div>
      <div className="border-b border-th-bkg-4 mb-4 pb-6">
        <div className="flex items-center pb-2 text-th-fgd-1">
          {t('account-name')}{' '}
          <span className="ml-1 text-th-fgd-3">{t('optional')}</span>
          <Tooltip content={t('tooltip-name-onchain')}>
            <InformationCircleIcon className="h-5 w-5 ml-2 text-th-primary" />
          </Tooltip>
        </div>
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
      </div>
      <div className="font-bold pb-2 text-center text-th-fgd-2">
        {t('initial-deposit')}
      </div>
      <AccountSelect
        accounts={walletTokens}
        selectedAccount={selectedAccount}
        onSelectAccount={handleAccountSelect}
      />
      <div className={`text-th-fgd-1 pb-2 pt-4`}>{t('amount')}</div>
      <div className="flex">
        <Input
          type="number"
          min="0"
          className={`border border-th-fgd-4 flex-grow pr-11`}
          placeholder="0.00"
          error={!!invalidAmountMessage}
          onBlur={(e) => validateAmountInput(e.target.value)}
          value={inputAmount || ''}
          onChange={(e) => onChangeAmountInput(e.target.value)}
          suffix={symbol}
        />
      </div>
      {invalidAmountMessage ? (
        <div className="flex items-center pt-1.5 text-th-red">
          <ExclamationCircleIcon className="h-4 w-4 mr-1.5" />
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
            parseFloat(inputAmount) > selectedAccount.uiBalance
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
