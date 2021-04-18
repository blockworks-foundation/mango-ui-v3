import { Listbox } from '@headlessui/react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/solid'
import { abbreviateAddress } from '../utils'
import { nativeToUi } from '@blockworks-foundation/mango-client/lib/utils'
import { SRM_DECIMALS } from '@project-serum/serum/lib/token-instructions'

const MangoSrmAccountSelector = ({
  accounts,
  selectedAccount,
  onSelectAccount,
}) => {
  const handleChange = (value) => {
    const newAccount = accounts.find((a) => a.publicKey.toString() === value)
    onSelectAccount(newAccount)
  }

  const getBalanceForAccount = (account) => {
    const balance = nativeToUi(account.amount, SRM_DECIMALS)
    return balance.toFixed(SRM_DECIMALS)
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
                <div className={`flex items-center flex-grow`}>
                  <img
                    alt=""
                    width="20"
                    height="20"
                    src={`/assets/icons/SRM.svg`}
                    className={`mr-2`}
                  />
                  {abbreviateAddress(selectedAccount?.publicKey)}
                  <div className={`ml-4 text-right flex-grow`}>
                    {getBalanceForAccount(selectedAccount)}
                  </div>
                </div>
                {open ? (
                  <ChevronUpIcon className={`h-5 w-5 ml-2`} />
                ) : (
                  <ChevronDownIcon className={`h-5 w-5 ml-2`} />
                )}
              </div>
            </Listbox.Button>
            {open ? (
              <Listbox.Options
                static
                className={`z-20 p-1 absolute right-0 top-11 bg-th-bkg-1 divide-y divide-th-bkg-3 shadow-lg outline-none rounded-md w-full`}
              >
                <div className={`text-th-fgd-4 p-2`}>SRM Accounts</div>
                {accounts.map((account) => {
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
                              src={`/assets/icons/SRM.svg`}
                              className="mr-2"
                            />
                            <div className={`flex-grow text-left`}>
                              {abbreviateAddress(account?.publicKey)}
                            </div>
                            <div className={`text-sm`}>
                              {getBalanceForAccount(account)} SRM
                            </div>
                          </div>
                        </div>
                      )}
                    </Listbox.Option>
                  )
                })}
              </Listbox.Options>
            ) : null}
          </>
        )}
      </Listbox>
    </div>
  )
}

export default MangoSrmAccountSelector
