import { Menu } from '@headlessui/react'
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
} from '@heroicons/react/solid'
import useMangoStore from '../stores/useMangoStore'
import { WALLET_PROVIDERS, DEFAULT_PROVIDER } from '../hooks/useWallet'
import useLocalStorageState from '../hooks/useLocalStorageState'

export default function WalletSelect({ isPrimary = false }) {
  const setMangoStore = useMangoStore((s) => s.set)
  const [savedProviderUrl] = useLocalStorageState(
    'walletProvider',
    DEFAULT_PROVIDER.url
  )

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
            className={`flex justify-center items-center h-full rounded-none focus:outline-none text-th-primary hover:text-th-fgd-1 ${
              isPrimary
                ? 'px-3 hover:bg-th-bkg-3'
                : 'px-2 hover:bg-th-bkg-3 border-l border-th-fgd-4'
            } cursor-pointer`}
          >
            {open ? (
              <ChevronUpIcon className="h-4 w-4" />
            ) : (
              <ChevronDownIcon className="h-4 w-4" />
            )}
          </Menu.Button>
          <Menu.Items className="absolute bg-th-bkg-1 divide-y divide-th-bkg-3 p-1 rounded-md right-0.5 mt-1 shadow-lg outline-none w-48 z-20">
            {WALLET_PROVIDERS.map(({ name, url, icon }) => (
              <Menu.Item key={name}>
                <button
                  className="flex flex-row items-center justify-between rounded-none w-full p-2 hover:bg-th-bkg-2 hover:cursor-pointer font-normal focus:outline-none"
                  onClick={() => handleSelectProvider(url)}
                >
                  <div className="flex">
                    <img src={icon} className="w-5 h-5 mr-2" />
                    {name}
                  </div>
                  {savedProviderUrl === url ? (
                    <CheckCircleIcon className="h-4 w-4 text-th-green" />
                  ) : null}{' '}
                </button>
              </Menu.Item>
            ))}
          </Menu.Items>
        </>
      )}
    </Menu>
  )
}
