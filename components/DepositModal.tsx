import React, { FunctionComponent, useEffect, useState } from 'react'
import { ExclamationCircleIcon } from '@heroicons/react/outline'
import { ChevronLeftIcon } from '@heroicons/react/solid'
import Modal from './Modal'
import Input from './Input'
import AccountSelect from './AccountSelect'
import { ElementTitle } from './styles'
import useMangoStore from '../stores/useMangoStore'
import Loading from './Loading'
import Button, { LinkButton } from './Button'
import Slider from './Slider'
import InlineNotification from './InlineNotification'
import { deposit } from '../utils/mango'
import { notify } from '../utils/notifications'
import { sleep } from '../utils'
import { useTranslation } from 'next-i18next'

interface DepositModalProps {
  onClose: () => void
  isOpen: boolean
  settleDeficit?: string
  tokenSymbol?: string
}

const DepositModal: FunctionComponent<DepositModalProps> = ({
  isOpen,
  onClose,
  settleDeficit,
  tokenSymbol = '',
}) => {
  const { t } = useTranslation('common')
  const [inputAmount, setInputAmount] = useState<string>(settleDeficit || '')
  const [submitting, setSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [invalidAmountMessage, setInvalidAmountMessage] = useState('')
  const [sliderPercentage, setSliderPercentage] = useState(0)
  const [maxButtonTransition, setMaxButtonTransition] = useState(false)
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
    setSliderPercentage(0)
    setInvalidAmountMessage('')
    setSelectedAccount(account)
  }

  const setMaxForSelectedAccount = () => {
    setInputAmount(selectedAccount.uiBalance.toString())
    setSliderPercentage(100)
    setInvalidAmountMessage('')
    setMaxButtonTransition(true)
  }

  const handleDeposit = () => {
    const mangoAccount = useMangoStore.getState().selectedMangoAccount.current

    setSubmitting(true)
    deposit({
      amount: parseFloat(inputAmount),
      fromTokenAcc: selectedAccount.account,
      mangoAccount,
    })
      .then((response) => {
        notify({
          title: t('deposit-successful'),
          type: 'success',
          txid: response.toString(),
        })
        setSubmitting(false)
        onClose()
        sleep(500).then(() => {
          mangoAccount
            ? actions.reloadMangoAccount()
            : actions.fetchAllMangoAccounts()
          actions.fetchWalletTokens()
        })
      })
      .catch((err) => {
        notify({
          title: t('deposit-failed'),
          description: err.message,
          type: 'error',
        })
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

    const max = selectedAccount.uiBalance
    setSliderPercentage((amount / max) * 100)
    setInvalidAmountMessage('')
  }

  const onChangeSlider = async (percentage) => {
    setSliderPercentage(percentage)

    if (!selectedAccount) {
      setInvalidAmountMessage(t('supported-assets'))
      return
    }

    const max = selectedAccount.uiBalance
    const amount = (percentage / 100) * max
    if (percentage === 100) {
      setInputAmount(amount.toString())
    } else {
      setInputAmount(amount.toString())
    }
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
    <Modal isOpen={isOpen} onClose={onClose}>
      {!showConfirm ? (
        <>
          <Modal.Header>
            <ElementTitle noMarignBottom>{t('deposit-funds')}</ElementTitle>
          </Modal.Header>
          {tokenSymbol && !selectedAccount ? (
            <InlineNotification
              desc={t('deposit-help', { tokenSymbol: tokenSymbol })}
              title={t('no-address', { tokenSymbol: tokenSymbol })}
              type="error"
            />
          ) : null}
          {settleDeficit ? (
            <InlineNotification
              desc={t('deposit-before', {
                settleDeficit: settleDeficit,
                tokenSymbol: tokenSymbol,
              })}
              title={t('not-enough-balance')}
              type="error"
            />
          ) : null}
          <AccountSelect
            accounts={walletTokens}
            selectedAccount={selectedAccount}
            onSelectAccount={handleAccountSelect}
          />
          <div className="flex justify-between pb-2 pt-4">
            <div className={`text-th-fgd-1`}>{t('amount')}</div>
            <div
              className="text-th-fgd-1 underline cursor-pointer default-transition hover:text-th-primary hover:no-underline"
              onClick={setMaxForSelectedAccount}
            >
              {t('max')}
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
              suffix={selectedAccount?.config.symbol}
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
              disabled={null}
              value={sliderPercentage}
              onChange={(v) => onChangeSlider(v)}
              step={1}
              maxButtonTransition={maxButtonTransition}
            />
          </div>
          <div className={`pt-8 flex justify-center`}>
            <Button
              onClick={() => setShowConfirm(true)}
              className="w-full"
              disabled={
                !inputAmount ||
                parseFloat(inputAmount) <= 0 ||
                !selectedAccount ||
                parseFloat(inputAmount) > selectedAccount.uiBalance
              }
            >
              {t('next')}
            </Button>
          </div>
          {!mangoAccount ? (
            <div className="flex text-th-fgd-4 text-xxs mt-1">
              <div className="mx-auto">{t('insufficient-sol')}</div>
            </div>
          ) : null}
        </>
      ) : (
        <>
          <Modal.Header>
            <ElementTitle noMarignBottom>{t('confirm-deposit')}</ElementTitle>
          </Modal.Header>
          <div className="bg-th-bkg-1 p-4 rounded-lg text-th-fgd-1 text-center">
            <div className="text-th-fgd-3 pb-1">{t('depositing')}</div>
            <div className="flex items-center justify-center">
              <div className="font-semibold relative text-xl">
                {inputAmount}
                <span className="absolute bottom-0.5 font-normal ml-1.5 text-xs text-th-fgd-4">
                  {selectedAccount?.config.symbol}
                </span>
              </div>
            </div>
          </div>
          <div className={`mt-5 flex justify-center`}>
            <Button
              onClick={handleDeposit}
              className="w-full"
              disabled={submitting}
            >
              <div className={`flex items-center justify-center`}>
                {submitting && <Loading className="-ml-1 mr-3" />}
                {t('deposit')}
              </div>
            </Button>
          </div>
          <LinkButton
            className="flex items-center mt-4 text-th-fgd-3"
            onClick={() => setShowConfirm(false)}
          >
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            {t('back')}
          </LinkButton>
        </>
      )}
    </Modal>
  )
}

export default React.memo(DepositModal)
