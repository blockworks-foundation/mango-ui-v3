import React, { FunctionComponent, useEffect, useState } from 'react'
import { RadioGroup } from '@headlessui/react'
import { CheckCircleIcon } from '@heroicons/react/solid'
import { PlusCircleIcon, UsersIcon } from '@heroicons/react/outline'
import useMangoStore from '../stores/useMangoStore'
import { MangoAccount, MangoGroup } from '@blockworks-foundation/mango-client'
import { abbreviateAddress, formatUsdValue } from '../utils'
import useLocalStorageState from '../hooks/useLocalStorageState'
import Modal from './Modal'
import { ElementTitle } from './styles'
import Button, { LinkButton } from './Button'
import NewAccount from './NewAccount'
import { useTranslation } from 'next-i18next'
import Tooltip from './Tooltip'
import { useWallet } from '@solana/wallet-adapter-react'

export const LAST_ACCOUNT_KEY = 'lastAccountViewed-3.0'

interface AccountsModalProps {
  onClose: () => void
  isOpen: boolean
}

const AccountsModal: FunctionComponent<AccountsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation('common')
  const { publicKey } = useWallet()
  const [showNewAccountForm, setShowNewAccountForm] = useState(false)
  const [newAccPublicKey, setNewAccPublicKey] = useState(null)
  const mangoAccounts = useMangoStore((s) => s.mangoAccounts)
  const selectedMangoAccount = useMangoStore(
    (s) => s.selectedMangoAccount.current
  )
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const setMangoStore = useMangoStore((s) => s.set)
  const actions = useMangoStore((s) => s.actions)
  const [, setLastAccountViewed] = useLocalStorageState(LAST_ACCOUNT_KEY)

  const handleMangoAccountChange = (mangoAccount: MangoAccount) => {
    setLastAccountViewed(mangoAccount.publicKey.toString())
    setMangoStore((state) => {
      state.selectedMangoAccount.current = mangoAccount
    })

    actions.fetchTradeHistory()
    onClose()
  }

  useEffect(() => {
    if (newAccPublicKey) {
      setMangoStore((state) => {
        state.selectedMangoAccount.current =
          mangoAccounts.find(
            (ma) => ma.publicKey.toString() === newAccPublicKey
          ) ?? null
      })
    }
  }, [mangoAccounts, newAccPublicKey])

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

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {mangoAccounts.length > 0 ? (
        !showNewAccountForm ? (
          <>
            <Modal.Header>
              <ElementTitle noMarginBottom>{t('mango-accounts')}</ElementTitle>
            </Modal.Header>
            <div className="flex items-center justify-between pb-3 text-th-fgd-1">
              <div className="font-semibold">
                {mangoAccounts.length > 1
                  ? t('select-account')
                  : t('your-account')}
              </div>
              <Button
                className="flex h-8 items-center justify-center pt-0 pb-0 pl-3 pr-3 text-xs"
                onClick={() => handleShowNewAccountForm()}
              >
                <div className="flex items-center">
                  <PlusCircleIcon className="mr-1.5 h-5 w-5" />
                  {t('new-account')}
                </div>
              </Button>
            </div>
            <RadioGroup
              value={selectedMangoAccount}
              onChange={(acc) => {
                if (acc) {
                  handleMangoAccountChange(acc)
                }
              }}
            >
              <RadioGroup.Label className="sr-only">
                {t('select-account')}
              </RadioGroup.Label>
              <div className="space-y-2">
                {mangoAccounts.map((account) => (
                  <RadioGroup.Option
                    key={account.publicKey.toString()}
                    value={account}
                    className={({ checked }) =>
                      `${
                        checked
                          ? 'bg-th-bkg-3 ring-1 ring-inset ring-th-green'
                          : 'bg-th-bkg-1'
                      }
                      default-transition relative flex w-full cursor-pointer rounded-md px-3 py-3 hover:bg-th-bkg-3 focus:outline-none`
                    }
                  >
                    {({ checked }) => (
                      <>
                        <div className="flex w-full items-center justify-between">
                          <div className="flex items-center">
                            <div className="text-sm">
                              <RadioGroup.Label className="flex cursor-pointer items-center text-th-fgd-1">
                                <div>
                                  <div className="flex items-center pb-0.5">
                                    {account?.name ||
                                      abbreviateAddress(account.publicKey)}
                                    {publicKey &&
                                    !account?.owner.equals(publicKey) ? (
                                      <Tooltip
                                        content={t(
                                          'delegate:delegated-account'
                                        )}
                                      >
                                        <UsersIcon className="ml-1.5 h-3 w-3" />
                                      </Tooltip>
                                    ) : (
                                      ''
                                    )}
                                  </div>
                                  {mangoGroup && (
                                    <div className="text-xs text-th-fgd-3">
                                      <AccountInfo
                                        mangoGroup={mangoGroup}
                                        mangoAccount={account}
                                      />
                                    </div>
                                  )}
                                </div>
                              </RadioGroup.Label>
                            </div>
                          </div>
                          {checked && (
                            <div className="flex-shrink-0 text-th-green">
                              <CheckCircleIcon className="h-5 w-5" />
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
              className="mt-4 flex w-full justify-center"
              onClick={() => setShowNewAccountForm(false)}
            >
              {t('cancel')}
            </LinkButton>
          </>
        )
      ) : (
        <NewAccount onAccountCreation={handleNewAccountCreation} />
      )}
    </Modal>
  )
}

const AccountInfo = ({
  mangoGroup,
  mangoAccount,
}: {
  mangoGroup: MangoGroup
  mangoAccount: MangoAccount
}) => {
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  if (!mangoCache) {
    return null
  }
  const accountEquity = mangoAccount.computeValue(mangoGroup, mangoCache)
  const leverage = mangoAccount.getLeverage(mangoGroup, mangoCache).toFixed(2)

  return (
    <div className="text-xs text-th-fgd-3">
      {formatUsdValue(accountEquity.toNumber())}
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

export default React.memo(AccountsModal)
