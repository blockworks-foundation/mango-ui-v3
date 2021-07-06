import React, { FunctionComponent, useEffect, useState } from 'react'
import { ExclamationCircleIcon } from '@heroicons/react/outline'
// import {
//   nativeToUi,
//   sleep,
// } from '@blockworks-foundation/mango-client/lib/utils/src'
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
// import { initMangoAccountAndDeposit } from '../utils/mango'
import Loading from './Loading'
import Button from './Button'
import Slider from './Slider'
import { notify } from '../utils/notifications'
import useMangoGroupConfig from '../hooks/useMangoGroupConfig'
import { deposit } from '../utils/mango'

interface NewAccountProps {
  onAccountCreation?: (x?) => void
}

const NewAccount: FunctionComponent<NewAccountProps> = ({
  onAccountCreation,
}) => {
  const groupConfig = useMangoGroupConfig()
  // const tokenMints = useMemo(() => groupConfig.tokens.map(t => t.mintKey.toBase58()), [groupConfig]);
  const [inputAmount, setInputAmount] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [invalidAmountMessage, setInvalidAmountMessage] = useState('')
  const [sliderPercentage, setSliderPercentage] = useState(0)
  const [maxButtonTransition, setMaxButtonTransition] = useState(false)
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
        onAccountCreation(response[0].publicKey)
      })
      .catch((err) => {
        setSubmitting(false)
        console.error(err)
        notify({
          message:
            'Could not perform init margin account and deposit operation',
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

  // turn off slider transition for dragging slider handle interaction
  useEffect(() => {
    if (maxButtonTransition) {
      setMaxButtonTransition(false)
    }
  }, [maxButtonTransition])

  return (
    <>
      <ElementTitle noMarignBottom>Create Margin Account</ElementTitle>
      <div className="text-th-fgd-3 text-center pb-4 pt-2">
        Make a deposit to initialize a new margin account
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
          disabled={inputAmount <= 0 || inputAmount > selectedAccount.uiBalance}
          onClick={handleNewAccountDeposit}
          className="w-full"
        >
          <div className={`flex items-center justify-center`}>
            {submitting && <Loading className="-ml-1 mr-3" />}
            Create Account
          </div>
        </Button>
      </div>
    </>
  )
}

export default NewAccount
