import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/solid'
import useMangoStore from '../stores/useMangoStore'
import { WALLET_PROVIDERS } from '../utils/wallet-adapters'

export default function WalletSelect({ isPrimary = false }) {
  const setMangoStore = useMangoStore((s) => s.set)

  const handleSelectProvider = (url) => {
    setMangoStore((state) => {
      state.wallet.providerUrl = url
    })
  }

  return (
    <Menu>
      {({ open }) => (
        <>
          <Menu.Button
            className={`bg-th-bkg-4 flex justify-center items-center h-full rounded-none focus:outline-none text-th-primary hover:brightness-[1.15] hover:text-th-fgd-1 ${
              isPrimary
                ? 'px-3 hover:bg-th-bkg-4'
                : 'px-2 hover:bg-th-bkg-4 border-l border-th-fgd-4'
            } cursor-pointer`}
          >
            <ChevronDownIcon
              className={`default-transition h-4 w-4 ${
                open ? 'transform rotate-180' : 'transform rotate-360'
              }`}
            />
          </Menu.Button>
          <Transition
            appear={true}
            show={open}
            as={Fragment}
            enter="transition-all ease-in duration-200"
            enterFrom="opacity-0 transform scale-75"
            enterTo="opacity-100 transform scale-100"
            leave="transition ease-out duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Menu.Items className="absolute bg-th-bkg-1 divide-y divide-th-bkg-3 p-1 rounded-md right-0.5 mt-1 shadow-lg outline-none w-36 z-20">
              {WALLET_PROVIDERS.map(({ name, url, icon }) => (
                <Menu.Item key={name}>
                  <button
                    className="flex flex-row items-center justify-between rounded-none text-xs w-full p-2 hover:bg-th-bkg-2 hover:cursor-pointer font-normal focus:outline-none"
                    onClick={() => handleSelectProvider(url)}
                  >
                    <div className="flex">
                      <img src={icon} className="w-4 h-4 mr-2" />
                      {name}
                    </div>
                  </button>
                </Menu.Item>
              ))}
            </Menu.Items>
          </Transition>
        </>
      )}
    </Menu>
  )
}
