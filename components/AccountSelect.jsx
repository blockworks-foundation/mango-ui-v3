import { Listbox, Transition } from '@headlessui/react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/solid'
import {
  abbreviateAddress,
  floorToDecimal,
  getSymbolForTokenMintAddress,
} from '../utils'
import useMarketList from '../hooks/useMarketList'
import { nativeToUi } from '@blockworks-foundation/mango-client/lib/utils'
import useMangoStore from '../stores/useMangoStore'
import { tokenPrecision } from '../utils/index'
import { SRM_DECIMALS } from '@project-serum/serum/lib/token-instructions'

const AccountSelect = ({
  accounts,
  selectedAccount,
  onSelectAccount,
  hideBalance = false,
  getMaxForSelectedAccount,
}) => {
  const { getTokenIndex } = useMarketList()
  const mintDecimals = useMangoStore((s) => s.selectedMangoGroup.mintDecimals)
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

    return floorToDecimal(
      balance,
      symbol !== 'SRM' ? tokenPrecision[symbol] : SRM_DECIMALS
    ).toString()
  }

  return (
    <div className={`relative inline-block w-full`}>
      <Listbox
        value={selectedAccount?.publicKey.toString()}
        onChange={handleChange}
      >
        {({ open }) => (
          <>
            <Listbox.Button
              className={`border border-th-fgd-4 bg-th-bkg-1 rounded-md default-transition hover:border-th-primary focus:outline-none focus:border-th-primary p-2 h-10 w-full font-normal`}
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
                    {abbreviateAddress(selectedAccount?.publicKey)}
                    <div className={`ml-4 text-right flex-grow`}>
                      {!hideBalance
                        ? getBalanceForAccount(selectedAccount)
                        : getMaxForSelectedAccount(selectedAccount)}
                    </div>
                  </div>
                ) : (
                  'No wallet addresses found'
                )}
                {open ? (
                  <ChevronUpIcon className={`h-5 w-5 ml-2 text-th-primary`} />
                ) : (
                  <ChevronDownIcon className={`h-5 w-5 ml-2 text-th-primary`} />
                )}
              </div>
            </Listbox.Button>
            {/* <Transition
              show={open}
              appear={true}
              enter="transition duration-100 ease-out"
              enterFrom="transform scale-95 opacity-0"
              enterTo="transform scale-100 opacity-100"
              leave="transition duration-75 ease-out"
              leaveFrom="transform scale-100 opacity-100"
              leaveTo="transform scale-95 opacity-0"
            > */}
            <Listbox.Options
              className={`z-20 p-1 absolute right-0 top-11 bg-th-bkg-1 divide-y divide-th-bkg-3 shadow-lg outline-none rounded-md w-full`}
            >
              <div className="flex justify-between">
                <div className={`text-th-fgd-4 p-2`}>Accounts</div>
                <div className={`text-th-fgd-4 p-2`}>Balance</div>
              </div>
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
                            {abbreviateAddress(selectedAccount?.publicKey)}
                          </div>
                          <div className={`text-sm`}>
                            {!hideBalance
                              ? getBalanceForAccount(account)
                              : getMaxForSelectedAccount(account)}{' '}
                            {symbolForAccount}
                          </div>
                        </div>
                      </div>
                    )}
                  </Listbox.Option>
                )
              })}
            </Listbox.Options>
            {/* </Transition> */}
          </>
        )}
      </Listbox>
    </div>
  )
}

export default AccountSelect
