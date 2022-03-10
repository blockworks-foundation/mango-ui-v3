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
            className={`flex h-full w-10 cursor-pointer items-center justify-center rounded-none bg-th-primary-dark text-th-bkg-1 hover:brightness-[1.1] focus:outline-none`}
          >
            <ChevronDownIcon
              className={`default-transition h-5 w-5 ${
                open ? 'rotate-180 transform' : 'rotate-360 transform'
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
            <Menu.Items className="absolute right-0 z-20 w-44 rounded-b-md bg-th-bkg-3 px-4 py-2.5 outline-none">
              {WALLET_PROVIDERS.map(({ name, url, icon }) => (
                <Menu.Item key={name}>
                  <button
                    className="flex w-full flex-row items-center justify-between rounded-none py-1.5 font-normal hover:cursor-pointer hover:text-th-primary focus:outline-none"
                    onClick={() => handleSelectProvider(url)}
                  >
                    <div className="flex items-center">
                      <img src={icon} className="mr-2 h-4 w-4" />
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
