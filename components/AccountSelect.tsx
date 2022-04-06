import { useMemo, useState } from 'react'
import { Listbox } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/solid'
import { abbreviateAddress } from '../utils'
import useMangoStore, { WalletToken } from '../stores/useMangoStore'
import { RefreshClockwiseIcon } from './icons'
import { useTranslation } from 'next-i18next'
import { LinkButton } from './Button'
import { Label } from './Input'

type AccountSelectProps = {
  accounts: WalletToken[]
  selectedAccount: WalletToken
  onSelectAccount: (WalletToken) => any
  hideAddress?: boolean
}

const AccountSelect = ({
  accounts,
  selectedAccount,
  onSelectAccount,
  hideAddress = false,
}: AccountSelectProps) => {
  const { t } = useTranslation('common')
  const groupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const tokenSymbols = useMemo(
    () => groupConfig?.tokens.map((t) => t.symbol),
    [groupConfig]
  )
  const missingTokenSymbols = useMemo(() => {
    const symbolsForAccounts = accounts.map((a) => a.config.symbol)
    return tokenSymbols?.filter((sym) => !symbolsForAccounts.includes(sym))
  }, [accounts, tokenSymbols])

  const actions = useMangoStore((s) => s.actions)
  const [loading, setLoading] = useState(false)

  const handleChange = (value: string) => {
    const newAccount = accounts.find(
      (a) => a.account.publicKey.toBase58() === value
    )
    onSelectAccount(newAccount)
  }

  const handleRefreshBalances = async () => {
    setLoading(true)
    await actions.fetchWalletTokens()
    setLoading(false)
  }

  return (
    <div className={`relative inline-block w-full`}>
      <div className="flex justify-between">
        <Label>{t('asset')}</Label>
        {missingTokenSymbols && missingTokenSymbols.length > 0 ? (
          <LinkButton className="mb-1.5 ml-2" onClick={handleRefreshBalances}>
            <div className="flex items-center">
              <RefreshClockwiseIcon
                className={`mr-1 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              />
              {t('refresh')}
            </div>
          </LinkButton>
        ) : null}
      </div>
      <Listbox
        value={selectedAccount?.account.publicKey.toBase58()}
        onChange={handleChange}
      >
        {({ open }) => (
          <div className="relative">
            <div className="flex items-center">
              <Listbox.Button
                className={`default-transition w-full rounded-md border border-th-bkg-4 bg-th-bkg-1 p-2 font-normal hover:border-th-fgd-4 focus:border-th-fgd-4 focus:outline-none`}
              >
                <div
                  className={`flex items-center justify-between text-th-fgd-1`}
                >
                  {selectedAccount ? (
                    <div className={`flex flex-grow items-center`}>
                      <img
                        alt=""
                        width="20"
                        height="20"
                        src={`/assets/icons/${selectedAccount.config.symbol.toLowerCase()}.svg`}
                        className={`mr-2`}
                      />
                      <div className="text-left">
                        {selectedAccount.config.symbol}
                        {!hideAddress ? (
                          <div className="text-xs text-th-fgd-4">
                            {abbreviateAddress(
                              selectedAccount.account.publicKey
                            )}
                          </div>
                        ) : null}
                      </div>
                      <div className={`ml-4 flex-grow text-right`}>
                        {selectedAccount.uiBalance}
                      </div>
                    </div>
                  ) : (
                    t('select-asset')
                  )}
                  <ChevronDownIcon
                    className={`default-transition ml-2 h-5 w-5 text-th-fgd-1 ${
                      open ? 'rotate-180 transform' : 'rotate-360 transform'
                    }`}
                  />
                </div>
              </Listbox.Button>
            </div>
            <Listbox.Options
              className={`thin-scroll absolute right-0 top-14 z-20 max-h-60 w-full overflow-auto rounded-md bg-th-bkg-3 p-1`}
            >
              {accounts.map((account) => {
                const symbolForAccount = account.config.symbol

                return (
                  <Listbox.Option
                    disabled={account.uiBalance === 0}
                    key={account?.account.publicKey.toBase58()}
                    value={account?.account.publicKey.toBase58()}
                  >
                    {({ disabled, selected }) => (
                      <div
                        className={`default-transition px-2 py-1 text-th-fgd-1 ${
                          selected && `text-th-primary`
                        } ${
                          disabled
                            ? 'text-th-fgd-1 opacity-50 hover:cursor-not-allowed hover:text-th-fgd-1'
                            : 'hover:cursor-pointer hover:text-th-primary'
                        }`}
                      >
                        <div className={`flex items-center`}>
                          <img
                            alt=""
                            width="16"
                            height="16"
                            src={`/assets/icons/${symbolForAccount.toLowerCase()}.svg`}
                            className="mr-2"
                          />
                          <div className={`flex-grow text-left`}>
                            {symbolForAccount}
                            {!hideAddress ? (
                              <div className="text-xs text-th-fgd-4">
                                {abbreviateAddress(account.account.publicKey)}
                              </div>
                            ) : null}
                          </div>
                          {!hideAddress ? (
                            <div className={`text-sm`}>
                              {account.uiBalance} {symbolForAccount}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </Listbox.Option>
                )
              })}
              {missingTokenSymbols?.map((token) => (
                <Listbox.Option disabled key={token} value={token}>
                  <div
                    className={`px-2 py-1 opacity-50 hover:cursor-not-allowed`}
                  >
                    <div className={`flex items-center text-th-fgd-1`}>
                      <img
                        alt=""
                        width="16"
                        height="16"
                        src={`/assets/icons/${token.toLowerCase()}.svg`}
                        className="mr-2"
                      />
                      <div className={`flex-grow text-left`}>{token}</div>
                      <div className={`text-xs`}>{t('no-wallet')}</div>
                    </div>
                  </div>
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </div>
        )}
      </Listbox>
    </div>
  )
}

export default AccountSelect
