import { useState } from 'react'
import { Listbox } from '@headlessui/react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/solid'
import { abbreviateAddress, getSymbolForTokenMintAddress } from '../utils'
import useMarketList from '../hooks/useMarketList'
import { nativeToUi } from '@blockworks-foundation/mango-client/lib/utils'
import useMangoStore from '../stores/useMangoStore'
import { SRM_DECIMALS } from '@project-serum/serum/lib/token-instructions'
import { RefreshClockwiseIcon } from './icons'

type AccountSelectProps = {
  accounts: any[]
  selectedAccount: any
  onSelectAccount: (x) => any
  getBalance?: (x) => any
  hideAddress?: boolean
  symbols?: { [key: string]: string }
}

const AccountSelect = ({
  accounts,
  selectedAccount,
  onSelectAccount,
  getBalance,
  hideAddress = false,
  symbols,
}: AccountSelectProps) => {
  const { getTokenIndex } = useMarketList()
  const mintDecimals = useMangoStore((s) => s.selectedMangoGroup.mintDecimals)
  const actions = useMangoStore((s) => s.actions)
  const [loading, setLoading] = useState(false)

  const handleChange = (value) => {
    const newAccount = accounts.find((a) => a.publicKey.toString() === value)
    onSelectAccount(newAccount)
  }

  const getBalanceForAccount = (account) => {
    const mintAddress = account?.account.mint.toString()
    const symbol = getSymbolForTokenMintAddress(mintAddress)
    const balance = nativeToUi(
      account?.account?.amount,
      symbol !== 'SRM' ? mintDecimals[getTokenIndex(mintAddress)] : SRM_DECIMALS
    )

    return balance.toString()
  }

  const handleRefreshBalances = async () => {
    setLoading(true)
    await actions.fetchWalletBalances()
    setLoading(false)
  }

  const symbolsForAccounts = accounts.map((a) =>
    getSymbolForTokenMintAddress(a.account.mint.toString())
  )

  const missingTokens = symbols
    ? Object.keys(symbols).filter((sym) => !symbolsForAccounts.includes(sym))
    : null

  return (
    <div className={`relative inline-block w-full`}>
      <div className="flex justify-between pb-2">
        <div className="text-th-fgd-1">Asset</div>
        {accounts.length < Object.keys(symbols).length ? (
          <button
            className="ml-2 text-th-fgd-1 hover:text-th-primary outline-none focus:outline-none"
            onClick={handleRefreshBalances}
          >
            <div className="flex items-center text-th-fgd-1 font-normal underline cursor-pointer hover:text-th-primary hover:no-underline">
              <RefreshClockwiseIcon
                className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`}
              />
              Refresh
            </div>
          </button>
        ) : null}
      </div>
      <Listbox
        value={selectedAccount?.publicKey.toString()}
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
                        src={`/assets/icons/${getSymbolForTokenMintAddress(
                          selectedAccount?.account?.mint.toString()
                        ).toLowerCase()}.svg`}
                        className={`mr-2`}
                      />
                      <div className="text-left">
                        {getSymbolForTokenMintAddress(
                          selectedAccount?.account?.mint.toString()
                        )}
                        {!hideAddress ? (
                          <div className="text-xs text-th-fgd-4">
                            {abbreviateAddress(selectedAccount?.publicKey)}
                          </div>
                        ) : null}
                      </div>
                      <div className={`ml-4 text-right flex-grow`}>
                        {hideAddress
                          ? getBalance(selectedAccount)
                          : getBalanceForAccount(selectedAccount)}
                      </div>
                    </div>
                  ) : (
                    'Select an asset'
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
                const symbolForAccount = getSymbolForTokenMintAddress(
                  account?.account?.mint.toString()
                )

                return (
                  <Listbox.Option
                    key={account?.publicKey.toString()}
                    value={account?.publicKey.toString()}
                  >
                    {({ selected }) => (
                      <div
                        className={`p-2 hover:bg-th-bkg-2 hover:cursor-pointer ${
                          selected && `text-th-primary`
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
                                {abbreviateAddress(account?.publicKey)}
                              </div>
                            ) : null}
                          </div>
                          {!hideAddress ? (
                            <div className={`text-sm`}>
                              {getBalanceForAccount(account)} {symbolForAccount}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </Listbox.Option>
                )
              })}
              {missingTokens && accounts.length !== Object.keys(symbols).length
                ? missingTokens.map((token) => (
                    <Listbox.Option disabled key={token} value={token}>
                      <div
                        className={`opacity-50 p-2 hover:cursor-not-allowed`}
                      >
                        <div className={`flex items-center text-th-fgd-1`}>
                          <img
                            alt=""
                            width="20"
                            height="20"
                            src={`/assets/icons/${token.toLowerCase()}.svg`}
                            className="mr-2"
                          />
                          <div className={`flex-grow text-left`}>{token}</div>
                          <div className={`text-xs`}>No wallet address</div>
                        </div>
                      </div>
                    </Listbox.Option>
                  ))
                : null}
            </Listbox.Options>
          </>
        )}
      </Listbox>
    </div>
  )
}

export default AccountSelect
