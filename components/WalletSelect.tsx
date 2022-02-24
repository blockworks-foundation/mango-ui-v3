import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/solid'
import useMangoStore from '../stores/useMangoStore'
import { WALLET_PROVIDERS } from '../utils/wallet-adapters'

export default function WalletSelect() {
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
            className={`bg-th-primary-dark flex justify-center items-center h-full rounded-none focus:outline-none text-th-bkg-1 hover:brightness-[1.1] cursor-pointer w-10`}
          >
            <ChevronDownIcon
              className={`default-transition h-5 w-5 ${
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
            <Menu.Items className="absolute bg-th-bkg-3 px-4 py-2.5 rounded-b-md right-0 outline-none w-44 z-20">
              {WALLET_PROVIDERS.map(({ name, url, icon }) => (
                <Menu.Item key={name}>
                  <button
                    className="flex flex-row items-center justify-between py-1.5 rounded-none w-full hover:text-th-primary hover:cursor-pointer font-normal focus:outline-none"
                    onClick={() => handleSelectProvider(url)}
                  >
                    <div className="flex items-center">
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
