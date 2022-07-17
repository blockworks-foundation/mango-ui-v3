import { MangoAccount } from '@blockworks-foundation/mango-client'
import { RadioGroup } from '@headlessui/react'
import { CheckCircleIcon } from '@heroicons/react/outline'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { useTranslation } from 'next-i18next'
import useMangoStore, { LAST_ACCOUNT_KEY } from 'stores/useMangoStore'
import MangoAccountCard from './MangoAccountCard'

const SelectMangoAccount = ({
  onClose,
  className,
}: {
  onClose?: () => void
  className?: string
}) => {
  const { t } = useTranslation('common')
  const selectedMangoAccount = useMangoStore(
    (s) => s.selectedMangoAccount.current
  )
  const mangoAccounts = useMangoStore((s) => s.mangoAccounts)
  const actions = useMangoStore((s) => s.actions)
  const setMangoStore = useMangoStore((s) => s.set)
  const [, setLastAccountViewed] = useLocalStorageState(LAST_ACCOUNT_KEY)

  const handleMangoAccountChange = (mangoAccount: MangoAccount) => {
    setLastAccountViewed(mangoAccount.publicKey.toString())
    setMangoStore((state) => {
      state.selectedMangoAccount.current = mangoAccount
    })

    actions.fetchTradeHistory()
    if (onClose) {
      onClose()
    }
  }

  return (
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
      <div className={`${className} space-y-2`}>
        {mangoAccounts.map((account) => (
          <RadioGroup.Option
            key={account.publicKey.toString()}
            value={account}
            className={({ checked }) =>
              `${
                checked
                  ? 'ring-1 ring-inset ring-th-green'
                  : 'ring-1 ring-inset ring-th-fgd-4 hover:ring-th-fgd-2'
              }
                      default-transition relative flex w-full cursor-pointer rounded-md px-3 py-3 focus:outline-none`
            }
          >
            {({ checked }) => (
              <>
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center">
                    <div className="text-sm">
                      <RadioGroup.Label className="flex cursor-pointer items-center text-th-fgd-1">
                        <MangoAccountCard mangoAccount={account} />
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
  )
}

export default SelectMangoAccount
