import { Menu, Transition } from '@headlessui/react'
import { DotsHorizontalIcon, CheckCircleIcon } from '@heroicons/react/outline'
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
          <Menu.Button className="p-2 h-full border-l border-th-primary focus:outline-none text-th-primary hover:text-th-fgd-1 hover:bg-th-primary cursor-pointer">
            <DotsHorizontalIcon className="h-5 w-5 text-th-primary" />
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
              className="z-40 absolute right-0 w-48 mt-2 origin-top-right border border-th-primary bg-th-bkg-2 divide-y divide-th-fgd-1 rounded-md shadow-lg outline-none"
            >
              {WALLET_PROVIDERS.map(({ name, url }) => (
                <Menu.Item key={name}>
                  <button
                    className="p-4 w-full text-left flex items-center hover:text-th-primary"
                    onClick={() => handleSelectProvider(url)}
                  >
                    {providerUrl === url ? (
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                    ) : null}{' '}
                    {name}
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
