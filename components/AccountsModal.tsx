import React, { FunctionComponent, useEffect, useState } from 'react'
import { RadioGroup } from '@headlessui/react'
import { CheckCircleIcon } from '@heroicons/react/solid'
import {
  ChevronLeftIcon,
  CurrencyDollarIcon,
  PlusCircleIcon,
} from '@heroicons/react/outline'
import useMangoStore from '../stores/useMangoStore'
import { MarginAccount } from '@blockworks-foundation/mango-client'
import { abbreviateAddress } from '../utils'
import useLocalStorageState from '../hooks/useLocalStorageState'
import Modal from './Modal'
import { ElementTitle } from './styles'
import Button, { LinkButton } from './Button'
import NewAccount from './NewAccount'

interface AccountsModalProps {
  onClose: () => void
  isOpen: boolean
}

const AccountsModal: FunctionComponent<AccountsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [showNewAccountForm, setShowNewAccountForm] = useState(false)
  const [newAccPublicKey, setNewAccPublicKey] = useState(null)
  const marginAccounts = useMangoStore((s) => s.marginAccounts)
  const selectedMarginAccount = useMangoStore(
    (s) => s.selectedMarginAccount.current
  )
  const selectedMangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const prices = useMangoStore((s) => s.selectedMangoGroup.prices)
  const setMangoStore = useMangoStore((s) => s.set)
  const actions = useMangoStore((s) => s.actions)
  const [, setLastAccountViewed] = useLocalStorageState('lastAccountViewed')

  const handleMarginAccountChange = (marginAccount: MarginAccount) => {
    setLastAccountViewed(marginAccount.publicKey.toString())
    setMangoStore((state) => {
      state.selectedMarginAccount.current = marginAccount
    })
    actions.fetchTradeHistory()
    onClose()
  }

  useEffect(() => {
    if (newAccPublicKey) {
      setMangoStore((state) => {
        state.selectedMarginAccount.current = marginAccounts.find((ma) =>
          ma.publicKey.equals(newAccPublicKey)
        )
      })
    }
  }, [marginAccounts, newAccPublicKey])

  const handleNewAccountCreation = (newAccPublicKey) => {
    if (newAccPublicKey) {
      setNewAccPublicKey(newAccPublicKey)
    }
    setShowNewAccountForm(false)
  }

  const handleShowNewAccountForm = () => {
    setNewAccPublicKey(null)
    setShowNewAccountForm(true)
  }

  const getAccountInfo = (acc) => {
    const accountEquity = acc
      .computeValue(selectedMangoGroup, prices)
      .toFixed(2)
    const leverage = accountEquity
      ? (1 / (acc.getCollateralRatio(selectedMangoGroup, prices) - 1)).toFixed(
          2
        )
      : '∞'
    return (
      <div className="text-th-fgd-3 text-xs">
        ${accountEquity}
        <span className="px-1.5 text-th-fgd-4">|</span>
        <span
          className={
            parseFloat(leverage) > 4
              ? 'text-th-red'
              : parseFloat(leverage) > 2
              ? 'text-th-orange'
              : 'text-th-green'
          }
        >
          {leverage}x
        </span>
      </div>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {marginAccounts.length > 0 ? (
        !showNewAccountForm ? (
          <>
            <Modal.Header>
              <ElementTitle noMarignBottom>Margin Accounts</ElementTitle>
            </Modal.Header>
            <div className="flex items-center justify-between pb-3 text-th-fgd-1">
              <div className="font-semibold">
                {marginAccounts.length > 1
                  ? 'Select an account'
                  : 'Your Account'}
              </div>
              <Button
                className="text-xs flex items-center justify-center pt-0 pb-0 h-8 pl-3 pr-3"
                onClick={() => handleShowNewAccountForm()}
              >
                <div className="flex items-center">
                  <PlusCircleIcon className="h-5 w-5 mr-1.5" />
                  New
                </div>
              </Button>
            </div>
            <RadioGroup
              value={selectedMarginAccount}
              onChange={(acc) => handleMarginAccountChange(acc)}
            >
              <RadioGroup.Label className="sr-only">
                Select a Margin Account
              </RadioGroup.Label>
              <div className="space-y-2">
                {marginAccounts.map((account) => (
                  <RadioGroup.Option
                    key={account.publicKey.toString()}
                    value={account}
                    className={({ checked }) =>
                      `${
                        checked
                          ? 'bg-th-bkg-3 ring-1 ring-th-green ring-inset'
                          : 'bg-th-bkg-1'
                      }
                      relative rounded-md w-full px-3 py-3 cursor-pointer default-transition flex hover:bg-th-bkg-3 focus:outline-none`
                    }
                  >
                    {({ checked }) => (
                      <>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center">
                            <div className="text-sm">
                              <RadioGroup.Label className="cursor-pointer flex items-center text-th-fgd-1">
                                <CurrencyDollarIcon className="h-5 w-5 mr-2.5" />
                                <div>
                                  <div className="pb-0.5">
                                    {abbreviateAddress(account.publicKey)}
                                  </div>
                                  {prices && selectedMangoGroup ? (
                                    <div className="text-th-fgd-3 text-xs">
                                      {getAccountInfo(account)}
                                    </div>
                                  ) : null}
                                </div>
                              </RadioGroup.Label>
                            </div>
                          </div>
                          {checked && (
                            <div className="flex-shrink-0 text-th-green">
                              <CheckCircleIcon className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </RadioGroup.Option>
                ))}
              </div>
            </RadioGroup>
          </>
        ) : (
          <>
            <NewAccount onAccountCreation={handleNewAccountCreation} />
            <LinkButton
              className="flex items-center mt-4 text-th-fgd-3"
              onClick={() => setShowNewAccountForm(false)}
            >
              <ChevronLeftIcon className="h-5 w-5 mr-1" />
              Back
            </LinkButton>
          </>
        )
      ) : (
        <NewAccount onAccountCreation={handleNewAccountCreation} />
      )}
    </Modal>
  )
}

export default React.memo(AccountsModal)
