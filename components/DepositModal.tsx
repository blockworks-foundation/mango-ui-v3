import React, { FunctionComponent, useEffect, useState } from 'react'
import { ExclamationCircleIcon } from '@heroicons/react/outline'
import Modal from './Modal'
import Input, { Label } from './Input'
import AccountSelect from './AccountSelect'
import { ElementTitle } from './styles'
import useMangoStore from '../stores/useMangoStore'
import Loading from './Loading'
import Button from './Button'
import InlineNotification from './InlineNotification'
import { deposit } from '../utils/mango'
import { notify } from '../utils/notifications'
import { sleep, trimDecimals } from '../utils'
import { useTranslation } from 'next-i18next'
import ButtonGroup from './ButtonGroup'
import { useWallet } from '@solana/wallet-adapter-react'

interface DepositModalProps {
  onClose: () => void
  isOpen: boolean
  repayAmount?: string
  tokenSymbol?: string
}

const DepositModal: FunctionComponent<DepositModalProps> = ({
  isOpen,
  onClose,
  repayAmount,
  tokenSymbol = '',
}) => {
  const { t } = useTranslation('common')
  const { wallet } = useWallet()
  const [inputAmount, setInputAmount] = useState<string>(repayAmount || '')
  const [submitting, setSubmitting] = useState(false)
  const [invalidAmountMessage, setInvalidAmountMessage] = useState('')
  const [depositPercentage, setDepositPercentage] = useState('')
  const walletTokens = useMangoStore((s) => s.wallet.tokens)
  const actions = useMangoStore((s) => s.actions)
  const [selectedAccount, setSelectedAccount] = useState(walletTokens[0])
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)

  useEffect(() => {
    if (tokenSymbol) {
      const symbolAccount = walletTokens.find(
        (a) => a.config.symbol === tokenSymbol
      )
      if (symbolAccount) {
        setSelectedAccount(symbolAccount)
      } else {
        setSelectedAccount(null)
      }
    }
  }, [tokenSymbol, walletTokens])

  const handleAccountSelect = (account) => {
    setInputAmount('')
    setDepositPercentage('')
    setInvalidAmountMessage('')
    setSelectedAccount(account)
  }

  const handleDeposit = () => {
    const mangoAccount = useMangoStore.getState().selectedMangoAccount.current
    if (!wallet || !mangoAccount) return

    setSubmitting(true)
    deposit({
      amount: parseFloat(inputAmount),
      fromTokenAcc: selectedAccount.account,
      mangoAccount,
      wallet,
    })
      .then((response) => {
        notify({
          title: t('deposit-successful'),
          type: 'success',
          txid: response instanceof Array ? response[1] : response,
        })
        setSubmitting(false)
        onClose()
        sleep(500).then(() => {
          mangoAccount
            ? actions.reloadMangoAccount()
            : actions.fetchAllMangoAccounts(wallet)
          actions.fetchWalletTokens()
        })
      })
      .catch((err) => {
        notify({
          title: t('deposit-failed'),
          description: err.message,
          txid: err?.txid,
          type: 'error',
        })
        onClose()
      })
  }

  const validateAmountInput = (amount) => {
    if (Number(amount) <= 0) {
      setInvalidAmountMessage(t('enter-amount'))
    }
    if (selectedAccount && Number(amount) > selectedAccount.uiBalance) {
      setInvalidAmountMessage(t('insufficient-balance-deposit'))
    }
  }

  const onChangeAmountInput = (amount) => {
    setInputAmount(amount)

    if (!selectedAccount) {
      setInvalidAmountMessage(t('supported-assets'))
      return
    }

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

  const percentage = repayAmount
    ? (parseFloat(inputAmount) / parseFloat(repayAmount)) * 100
    : null
  const net = repayAmount
    ? parseFloat(inputAmount) - parseFloat(repayAmount)
    : null
  const repayMessage =
    percentage === 100
      ? t('repay-full')
      : typeof percentage === 'number' && percentage > 100
      ? t('repay-and-deposit', {
          amount: trimDecimals(net, 6).toString(),
          symbol: selectedAccount.config.symbol,
        })
      : typeof percentage === 'number'
      ? t('repay-partial', {
          percentage: percentage.toFixed(2),
        })
      : ''

  const inputDisabled =
    selectedAccount &&
    selectedAccount.config.symbol === 'SOL' &&
    selectedAccount.uiBalance.toString() === inputAmount

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header>
        <ElementTitle noMarginBottom>{t('deposit-funds')}</ElementTitle>
      </Modal.Header>
      {!mangoAccount ? (
        <div className="mb-4 mt-2 text-center text-xs text-th-fgd-3">
          {t('first-deposit-desc')}
        </div>
      ) : null}
      {tokenSymbol && !selectedAccount ? (
        <div className="mb-4">
          <InlineNotification
            desc={t('deposit-help', { tokenSymbol: tokenSymbol })}
            title={t('no-address', { tokenSymbol: tokenSymbol })}
            type="error"
          />
        </div>
      ) : null}
      {repayAmount && selectedAccount?.uiBalance < parseFloat(repayAmount) ? (
        <div className="mb-4">
          <InlineNotification
            desc={t('deposit-before', {
              tokenSymbol: tokenSymbol,
            })}
            title={t('not-enough-balance')}
            type="warning"
          />
        </div>
      ) : null}
      <AccountSelect
        accounts={walletTokens}
        selectedAccount={selectedAccount}
        onSelectAccount={handleAccountSelect}
      />
      <Label className={`mt-4`}>{t('amount')}</Label>
      <Input
        type="number"
        min="0"
        placeholder="0.00"
        error={!!invalidAmountMessage}
        onBlur={(e) => validateAmountInput(e.target.value)}
        value={inputAmount || ''}
        onChange={(e) => onChangeAmountInput(e.target.value)}
        suffix={selectedAccount?.config.symbol}
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
      {selectedAccount?.config.symbol === 'SOL' &&
      parseFloat(inputAmount) > selectedAccount?.uiBalance - 0.01 ? (
        <div className="-mb-4 mt-1 text-center text-xs text-th-red">
          {t('you-must-leave-enough-sol')}
        </div>
      ) : null}
      {repayAmount ? (
        <div className="pt-3">
          <InlineNotification desc={repayMessage} type="info" />
        </div>
      ) : null}
      <div className={`flex justify-center pt-6`}>
        <Button
          onClick={handleDeposit}
          className="w-full"
          disabled={submitting || inputDisabled}
        >
          <div className={`flex items-center justify-center`}>
            {submitting && <Loading className="-ml-1 mr-3" />}
            {t('deposit')}
          </div>
        </Button>
      </div>
      {!repayAmount ? (
        <div className="pt-3">
          <InlineNotification desc={t('interest-info')} type="info" />
        </div>
      ) : null}
    </Modal>
  )
}

export default React.memo(DepositModal)
