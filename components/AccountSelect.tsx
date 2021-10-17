import { useMemo, useState } from 'react'
import { Listbox } from '@headlessui/react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/solid'
import { abbreviateAddress } from '../utils'
import useMangoStore, { WalletToken } from '../stores/useMangoStore'
import { RefreshClockwiseIcon } from './icons'
import useMangoGroupConfig from '../hooks/useMangoGroupConfig'
import { useTranslation } from 'next-i18next'

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
  const groupConfig = useMangoGroupConfig()
  const tokenSymbols = useMemo(
    () => groupConfig.tokens.map((t) => t.symbol),
    [groupConfig]
  )
  const missingTokenSymbols = useMemo(() => {
    const symbolsForAccounts = accounts.map((a) => a.config.symbol)
    return tokenSymbols.filter((sym) => !symbolsForAccounts.includes(sym))
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
      <div className="flex justify-between pb-2">
        <div className="text-th-fgd-1">{t('asset')}</div>
        {missingTokenSymbols.length > 0 ? (
          <button
            className="ml-2 text-th-fgd-1 hover:text-th-primary outline-none focus:outline-none"
            onClick={handleRefreshBalances}
          >
            <div className="flex items-center text-th-fgd-1 font-normal underline cursor-pointer hover:text-th-primary hover:no-underline">
              <RefreshClockwiseIcon
                className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`}
              />
              {t('refresh')}
            </div>
          </button>
        ) : null}
      </div>
      <Listbox
        value={selectedAccount?.account.publicKey.toBase58()}
        onChange={handleChange}
      >
        {({ open }) => (
          <>
            <div className="flex items-center">
              <Listbox.Button
                className={`border border-th-fgd-4 bg-th-bkg-1 rounded-md default-transition hover:border-th-primary focus:outline-none focus:border-th-primary p-2 w-full font-normal`}
              >
                <div
                  className={`flex items-center text-th-fgd-1 justify-between`}
                >
                  {selectedAccount ? (
                    <div className={`flex items-center flex-grow`}>
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
                      <div className={`ml-4 text-right flex-grow`}>
                        {selectedAccount.uiBalance}
                      </div>
                    </div>
                  ) : (
                    t('select-asset')
                  )}
                  {open ? (
                    <ChevronUpIcon className="h-5 w-5 ml-2 text-th-primary" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 ml-2 text-th-primary" />
                  )}
                </div>
              </Listbox.Button>
            </div>
            <Listbox.Options
              className={`z-20 p-1 absolute right-0 top-13 bg-th-bkg-1 divide-y divide-th-bkg-3 shadow-lg outline-none rounded-md w-full max-h-60 overflow-auto`}
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
                        className={`p-2 hover:bg-th-bkg-2 hover:cursor-pointer ${
                          selected && `text-th-primary`
                        } ${
                          disabled &&
                          'opacity-50 hover:bg-th-bkg-1 hover:cursor-not-allowed'
                        }`}
                      >
                        <div className={`flex items-center text-th-fgd-1`}>
                          <img
                            alt=""
                            width="20"
                            height="20"
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
              {missingTokenSymbols.map((token) => (
                <Listbox.Option disabled key={token} value={token}>
                  <div className={`opacity-50 p-2 hover:cursor-not-allowed`}>
                    <div className={`flex items-center text-th-fgd-1`}>
                      <img
                        alt=""
                        width="20"
                        height="20"
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
          </>
        )}
      </Listbox>
    </div>
  )
}

export default AccountSelect
