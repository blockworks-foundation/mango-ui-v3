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
              className={`border border-th-fgd-4 focus:outline-none focus:ring-1 focus:ring-mango-yellow p-2 w-full`}
            >
              <div
                className={`flex items-center text-base justify-between font-light`}
              >
                <div className={`flex items-center flex-grow`}>
                  <img
                    alt=""
                    width="20"
                    height="20"
                    src={`/assets/icons/SRM.svg`}
                    className={`mr-4`}
                  />
                  {abbreviateAddress(selectedAccount?.publicKey)}
                  <div className={`ml-4 text-sm text-right flex-grow`}>
                    ({getBalanceForAccount(selectedAccount)})
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
                className={`z-20 p-1 absolute left-0 w-full mt-1 bg-th-bkg-3 origin-top-left divide-y divide-th-fgd-4 shadow-lg outline-none border border-th-fgd-4`}
              >
                <div className={`opacity-50 p-2`}>Your Mango SRM Accounts</div>
                {accounts.map((account) => {
                  return (
                    <Listbox.Option
                      key={account?.publicKey.toString()}
                      value={account?.publicKey.toString()}
                    >
                      {({ selected }) => (
                        <div
                          className={`p-2 text-sm hover:bg-th-fgd-4 hover:cursor-pointer tracking-wider font-light ${
                            selected && 'text-mango-yellow bg-th-fgd-4'
                          }`}
                        >
                          <div className={`flex items-center space-x-2`}>
                            <img
                              alt=""
                              width="20"
                              height="20"
                              src={`/assets/icons/SRM.svg`}
                            />
                            <div className={`flex-grow text-left`}>
                              {abbreviateAddress(account?.publicKey)}
                            </div>
                            <div className={`text-sm`}>
                              {getBalanceForAccount(account)} (SRM)
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
