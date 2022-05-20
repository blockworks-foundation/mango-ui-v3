import { MangoAccount, MangoGroup } from '@blockworks-foundation/mango-client'
import { RadioGroup } from '@headlessui/react'
import { CheckCircleIcon, UsersIcon } from '@heroicons/react/outline'
import { useWallet } from '@solana/wallet-adapter-react'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { useTranslation } from 'next-i18next'
import useMangoStore, { LAST_ACCOUNT_KEY } from 'stores/useMangoStore'
import { abbreviateAddress, formatUsdValue } from 'utils'
import Tooltip from './Tooltip'

const SelectMangoAccount = ({ onClose }: { onClose?: () => void }) => {
  const { t } = useTranslation('common')
  const { publicKey } = useWallet()
  const selectedMangoAccount = useMangoStore(
    (s) => s.selectedMangoAccount.current
  )
  const mangoAccounts = useMangoStore((s) => s.mangoAccounts)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
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
                            {publicKey && !account?.owner.equals(publicKey) ? (
                              <Tooltip
                                content={t('delegate:delegated-account')}
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
  )
}

export default SelectMangoAccount

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
