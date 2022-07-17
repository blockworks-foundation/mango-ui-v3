import React, { FunctionComponent, useEffect, useState } from 'react'
import { RadioGroup } from '@headlessui/react'
import {
  CheckCircleIcon,
  HeartIcon,
  PlusCircleIcon,
  UsersIcon,
} from '@heroicons/react/solid'
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
  const { t } = useTranslation(['common', 'delegate'])
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
              <p className="mb-0">
                {mangoAccounts.length > 1
                  ? t('select-account')
                  : t('your-account')}
              </p>
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
                      `border ${
                        checked ? 'border-th-primary' : 'border-th-fgd-4'
                      } default-transition mb-2 flex cursor-pointer items-center rounded-md p-3 text-th-fgd-1 hover:border-th-primary`
                    }
                  >
                    {({ checked }) => (
                      <>
                        <div className="flex w-full items-center justify-between">
                          <div className="flex items-center">
                            <CheckCircleIcon
                              className={`mr-2 h-5 w-5 ${
                                checked ? 'text-th-primary' : 'text-th-fgd-4'
                              }`}
                            />
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
                                    <div className="mt-0.5 text-xs text-th-fgd-3">
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
  const health = mangoAccount.getHealthRatio(mangoGroup, mangoCache, 'Maint')

  return (
    <div className="flex items-center text-xs text-th-fgd-3">
      {formatUsdValue(accountEquity.toNumber())}
      <span className="px-1.5 text-th-fgd-4">|</span>
      <span
        className={`flex items-center ${
          Number(health) < 15
            ? 'text-th-red'
            : Number(health) < 30
            ? 'text-th-orange'
            : 'text-th-green'
        }`}
      >
        <HeartIcon className="mr-0.5 h-4 w-4" />
        {Number(health) > 100 ? '>100' : health.toFixed(2)}%
      </span>
    </div>
  )
}

export default React.memo(AccountsModal)
