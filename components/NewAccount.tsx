import React, { FunctionComponent, useEffect, useMemo, useState } from 'react'
import { ExclamationCircleIcon } from '@heroicons/react/outline'
import { getTokenByMint } from '@blockworks-foundation/mango-client'
import {
  nativeToUi,
  sleep,
} from '@blockworks-foundation/mango-client/lib/utils/src'
import Input from './Input'
import AccountSelect from './AccountSelect'
import { ElementTitle } from './styles'
import useMangoStore from '../stores/useMangoStore'
import {
  getSymbolForTokenMintAddress,
  DECIMALS,
  trimDecimals,
} from '../utils/index'
import useConnection from '../hooks/useConnection'
import { initMarginAccountAndDeposit } from '../utils/mango'
import Loading from './Loading'
import Button from './Button'
import Slider from './Slider'
import { notify } from '../utils/notifications'
import useMangoGroupConfig from '../hooks/useMangoGroupConfig'

interface NewAccountProps {
  onAccountCreation?: (x?) => void
}

const NewAccount: FunctionComponent<NewAccountProps> = ({
  onAccountCreation,
}) => {
  const groupConfig = useMangoGroupConfig()
  const tokenMints = useMemo(() => groupConfig.tokens.map(t => t.mint_key.toBase58()), [groupConfig]);
  const [inputAmount, setInputAmount] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [invalidAmountMessage, setInvalidAmountMessage] = useState('')
  const [sliderPercentage, setSliderPercentage] = useState(0)
  const [maxButtonTransition, setMaxButtonTransition] = useState(false)
  const { connection } = useConnection()
  const walletAccounts = useMangoStore((s) => s.wallet.balances)
  const actions = useMangoStore((s) => s.actions)
  const depositAccounts = useMemo(
    () => walletAccounts.filter((acc) => tokenMints.includes(acc.account.mint.toString())),
    [tokenMints, walletAccounts]
  )
  const [selectedAccount, setSelectedAccount] = useState(depositAccounts[0])

  const symbol = getSymbolForTokenMintAddress(
    selectedAccount?.account?.mint.toString()
  )

  const handleAccountSelect = (account) => {
    setInputAmount(0)
    setSliderPercentage(0)
    setInvalidAmountMessage('')
    setSelectedAccount(account)
  }

  // TODO: remove duplication in AccountSelect
  const getBalanceForAccount = (account) => {
    const balance = nativeToUi(
      account?.account?.amount,
      getTokenByMint(groupConfig, account?.account.mint).decimals
    )

    return balance
  }

  const setMaxForSelectedAccount = () => {
    const max = getBalanceForAccount(selectedAccount)
    setInputAmount(max)
    setSliderPercentage(100)
    setInvalidAmountMessage('')
    setMaxButtonTransition(true)
  }

  const handleNewAccountDeposit = () => {
    setSubmitting(true)
    const mangoGroup = useMangoStore.getState().selectedMangoGroup.current
    const wallet = useMangoStore.getState().wallet.current

    initMarginAccountAndDeposit(
      connection,
      groupConfig.merps_program_id,
      mangoGroup,
      wallet,
      selectedAccount.account.mint,
      selectedAccount.publicKey,
      Number(inputAmount)
    )
      .then(async (_response: Array<any>) => {
        await sleep(1000)
        actions.fetchWalletBalances()
        actions.fetchMarginAccounts()
        setSubmitting(false)
        onAccountCreation(_response[0].publicKey)
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
    if (Number(amount) > getBalanceForAccount(selectedAccount)) {
      setInvalidAmountMessage(
        'Insufficient balance. Reduce the amount to deposit'
      )
    }
  }

  const onChangeAmountInput = (amount) => {
    const max = getBalanceForAccount(selectedAccount)
    setInputAmount(amount)
    setSliderPercentage((amount / max) * 100)
    setInvalidAmountMessage('')
  }

  const onChangeSlider = async (percentage) => {
    const max = getBalanceForAccount(selectedAccount)
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
        accounts={depositAccounts}
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
            inputAmount <= 0 ||
            inputAmount > getBalanceForAccount(selectedAccount)
          }
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
