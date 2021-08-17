import React, { FunctionComponent, useEffect, useState } from 'react'
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
  DECIMALS,
  trimDecimals,
  sleep,
} from '../utils/index'
import Loading from './Loading'
import Button from './Button'
import Slider from './Slider'
import Tooltip from './Tooltip'
import { notify } from '../utils/notifications'
import { deposit } from '../utils/mango'
import { PublicKey } from '@solana/web3.js'

interface NewAccountProps {
  onAccountCreation?: (x?) => void
}

const NewAccount: FunctionComponent<NewAccountProps> = ({
  onAccountCreation,
}) => {
  const [inputAmount, setInputAmount] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [invalidAmountMessage, setInvalidAmountMessage] = useState('')
  const [sliderPercentage, setSliderPercentage] = useState(0)
  const [maxButtonTransition, setMaxButtonTransition] = useState(false)
  const [showNewAccountName, setShowNewAccountName] = useState(true)
  const [invalidNameMessage, setInvalidNameMessage] = useState('')
  const [name, setName] = useState('')
  const walletTokens = useMangoStore((s) => s.wallet.tokens)
  const actions = useMangoStore((s) => s.actions)

  const [selectedAccount, setSelectedAccount] = useState(walletTokens[0])

  const symbol = getSymbolForTokenMintAddress(
    selectedAccount?.account?.mint.toString()
  )

  const handleAccountSelect = (account) => {
    setInputAmount(0)
    setSliderPercentage(0)
    setInvalidAmountMessage('')
    setSelectedAccount(account)
  }

  const setMaxForSelectedAccount = () => {
    const max = selectedAccount.uiBalance
    setInputAmount(max)
    setSliderPercentage(100)
    setInvalidAmountMessage('')
    setMaxButtonTransition(true)
  }

  const handleNewAccountDeposit = () => {
    setSubmitting(true)
    deposit({
      amount: inputAmount,
      fromTokenAcc: selectedAccount.account,
    })
      .then(async (response) => {
        await sleep(1000)
        actions.fetchWalletTokens()
        actions.fetchMangoAccounts()
        setSubmitting(false)
        console.log('response', response)

        onAccountCreation(response)
      })
      .catch((err) => {
        setSubmitting(false)
        console.error(err)
        notify({
          title: 'Could not perform init margin account and deposit operation',
          type: 'error',
        })
        onAccountCreation()
      })
  }

  const validateAmountInput = (amount) => {
    if (Number(amount) <= 0) {
      setInvalidAmountMessage('Enter an amount to deposit')
    }
    if (Number(amount) > selectedAccount.uiBalance) {
      setInvalidAmountMessage(
        'Insufficient balance. Reduce the amount to deposit'
      )
    }
  }

  const onChangeAmountInput = (amount) => {
    const max = selectedAccount.uiBalance
    setInputAmount(amount)
    setSliderPercentage((amount / max) * 100)
    setInvalidAmountMessage('')
  }

  const onChangeSlider = async (percentage) => {
    const max = selectedAccount.uiBalance
    const amount = (percentage / 100) * max
    if (percentage === 100) {
      setInputAmount(amount)
    } else {
      setInputAmount(trimDecimals(amount, DECIMALS[symbol]))
    }
    setSliderPercentage(percentage)
    setInvalidAmountMessage('')
    validateAmountInput(amount)
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

  // turn off slider transition for dragging slider handle interaction
  useEffect(() => {
    if (maxButtonTransition) {
      setMaxButtonTransition(false)
    }
  }, [maxButtonTransition])

  return (
    <>
      <ElementTitle noMarignBottom>New Account</ElementTitle>
      {showNewAccountName ? (
        <>
          <div className="flex items-center justify-center text-th-fgd-3 pb-4 pt-2">
            Create a public nickname for your account
            <Tooltip content="Account names are stored on-chain">
              <InformationCircleIcon className="h-5 w-5 ml-2 text-th-primary" />
            </Tooltip>
          </div>
          <div className="pb-2 text-th-fgd-1">
            Account Name <span className="text-th-fgd-3">(Optional)</span>
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
          <Button
            onClick={() => setShowNewAccountName(false)}
            disabled={name.length >= 33}
            className="mt-4 w-full"
          >
            Next
          </Button>
        </>
      ) : (
        <>
          <div className="text-th-fgd-3 text-center pb-4 pt-2">
            Make a deposit to initialize your new account
          </div>
          <AccountSelect
            accounts={walletTokens}
            selectedAccount={selectedAccount}
            onSelectAccount={handleAccountSelect}
          />
          <div className="flex justify-between pb-2 pt-4">
            <div className={`text-th-fgd-1`}>Amount</div>
            <div
              className="text-th-fgd-1 underline cursor-pointer default-transition hover:text-th-primary hover:no-underline"
              onClick={setMaxForSelectedAccount}
            >
              Max
            </div>
          </div>
          <div className="flex">
            <Input
              type="number"
              min="0"
              className={`border border-th-fgd-4 flex-grow pr-11`}
              placeholder="0.00"
              error={!!invalidAmountMessage}
              onBlur={(e) => validateAmountInput(e.target.value)}
              value={inputAmount}
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
          <div className="pt-3 pb-4">
            <Slider
              value={sliderPercentage}
              onChange={(v) => onChangeSlider(v)}
              step={1}
              maxButtonTransition={maxButtonTransition}
            />
          </div>
          <div className={`pt-8 flex justify-center`}>
            <Button
              disabled={
                inputAmount <= 0 || inputAmount > selectedAccount.uiBalance
              }
              onClick={handleNewAccountDeposit}
              className="w-full"
            >
              <div className={`flex items-center justify-center`}>
                {submitting && <Loading className="-ml-1 mr-3" />}
                Create New Account
              </div>
            </Button>
          </div>
        </>
      )}
    </>
  )
}

export default NewAccount
