import { Menu, Transition } from '@headlessui/react'
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
} from '@heroicons/react/outline'
import useMangoStore from '../stores/useMangoStore'
import { WALLET_PROVIDERS } from '../hooks/useWallet'

export default function WalletSelect() {
  const setMangoStore = useMangoStore((s) => s.set)
  const { providerUrl } = useMangoStore((s) => s.wallet)

  const handleSelectProvider = (url) => {
    setMangoStore((state) => {
      state.wallet.providerUrl = url
    })
  }

  return (
    <Menu>
      {({ open }) => (
        <>
          <Menu.Button className="p-2 w-10 flex justify-center items-center h-full rounded-r focus:outline-none text-th-primary hover:text-th-fgd-1 hover:bg-th-primary cursor-pointer">
            {open ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </Menu.Button>
          <Transition
            show={open}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items
              static
              className="z-20 p-1 absolute right-0 top-11 bg-th-bkg-1 divide-y divide-th-bkg-3 shadow-lg outline-none rounded-md w-48"
            >
              {WALLET_PROVIDERS.map(({ name, url, icon }) => (
                <Menu.Item key={name}>
                  <button
                    className="flex flex-row items-center justify-between w-full p-2 hover:bg-th-bkg-2 hover:cursor-pointer tracking-wider"
                    onClick={() => handleSelectProvider(url)}
                  >
                    <div className="flex">
                      <img src={icon} className="w-5 h-5 mr-2" />
                      {name}
                    </div>
                    {providerUrl === url ? (
                      <CheckCircleIcon className="h-4 w-4 text-th-green" />
                    ) : null}{' '}
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
