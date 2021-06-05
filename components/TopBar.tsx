import { useState } from 'react'
import { MenuIcon, XIcon } from '@heroicons/react/outline'
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/solid'
import { Menu } from '@headlessui/react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import MenuItem from './MenuItem'
import ThemeSwitch from './ThemeSwitch'
import useMangoStore from '../stores/useMangoStore'
import ConnectWalletButton from './ConnectWalletButton'
import AlertsList from './AlertsList'

const TopBar = () => {
  const connected = useMangoStore((s) => s.wallet.connected)
  const wallet = useMangoStore((s) => s.wallet.current)
  const [showMenu, setShowMenu] = useState(false)
  const { asPath } = useRouter()

  return (
    <>
      <nav className={`bg-th-bkg-2 border-b border-th-bkg-2`}>
        <div className={`px-6 md:px-9`}>
          <div className={`flex justify-between h-14`}>
            <div className={`flex`}>
              <div className={`flex-shrink-0 flex items-center`}>
                <img
                  className={`h-8 w-auto`}
                  src="/assets/icons/logo.svg"
                  alt="next"
                />
              </div>
              <div
                className={`hidden md:flex md:items-center md:space-x-6 md:ml-4 py-2`}
              >
                <MenuItem href="/">Trade</MenuItem>
                <MenuItem href="/account">Account</MenuItem>
                <MenuItem href="/borrow">Borrow</MenuItem>
                <MenuItem href="/alerts">Alerts</MenuItem>
                <Menu>
                  {({ open }) => (
                    <div className="relative">
                      <Menu.Button className="flex items-center hover:text-th-primary focus:outline-none">
                        More
                        <div className="pl-1">
                          {open ? (
                            <ChevronUpIcon className="h-5 w-5" />
                          ) : (
                            <ChevronDownIcon className="h-5 w-5" />
                          )}
                        </div>
                      </Menu.Button>
                      <Menu.Items className="absolute z-10 mt-4 p-1 right-0 md:transform md:-translate-x-1/2 md:left-1/2 w-24 bg-th-bkg-1 divide-y divide-th-bkg-3 shadow-lg outline-none rounded-md">
                        <Menu.Item>
                          <Link href="/stats">
                            <a
                              className={`block text-th-fgd-1 font-bold items-center p-2 hover:text-th-primary hover:opacity-100
                              ${
                                asPath === '/stats'
                                  ? `text-th-primary`
                                  : `border-transparent hover:border-th-primary`
                              }
                            `}
                            >
                              Stats
                            </a>
                          </Link>
                        </Menu.Item>
                        <Menu.Item>
                          <Link href="https://docs.mango.markets/">
                            <a
                              className={`block text-th-fgd-1 font-bold items-center p-2 hover:text-th-primary hover:opacity-100`}
                            >
                              Learn
                            </a>
                          </Link>
                        </Menu.Item>
                      </Menu.Items>
                    </div>
                  )}
                </Menu>
              </div>
            </div>
            <div className="flex items-center">
              <div className={`pl-2`}>
                <ThemeSwitch />
              </div>
              {connected ? (
                <div className="pl-2">
                  <AlertsList />
                </div>
              ) : null}
              <div className="flex">
                <div className="hidden md:block pl-4">
                  <ConnectWalletButton />
                </div>
              </div>
              <div className={`-mr-2 ml-2 flex items-center md:hidden`}>
                <button
                  type="button"
                  className={`inline-flex items-center justify-center p-2 rounded-md text-black dark:text-white hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-mango-orange`}
                  aria-controls="mobile-menu"
                  aria-expanded="false"
                  onClick={() => setShowMenu((showMenu) => !showMenu)}
                >
                  <span className="sr-only">Open main menu</span>
                  {showMenu ? (
                    <XIcon className="h-5 w-5 text-th-primary" />
                  ) : (
                    <MenuIcon className="h-5 w-5 text-th-primary" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div
          className={`${showMenu ? `visible` : `hidden`} md:hidden`}
          id="mobile-menu"
        >
          <div
            className={`bg-th-bkg-3 pt-2 pb-3 space-y-1 border-b border-th-fgd-4`}
          >
            <MenuItem href="/">Trade</MenuItem>
            <MenuItem href="/stats">Stats</MenuItem>
            <MenuItem href="/alerts">Alerts</MenuItem>
            <MenuItem href="https://docs.mango.markets/">Learn</MenuItem>

            {connected && wallet?.publicKey ? (
              <button
                className="block text-th-fgd-1 text-base items-center pl-3 pr-4 py-2 font-normal
                  md:inline-flex md:ml-4 md:px-1 md:py-0 border-l-4 md:border-l-0 md:border-b-2 hover:text-th-primary
                  border-transparent hover:border-th-primary rounded-none outline-none focus:outline-none"
                onClick={() => wallet.disconnect()}
              >
                Disconnect
              </button>
            ) : (
              <button
                className="block text-th-fgd-1 text-base items-center pl-3 pr-4 py-2 font-normal
                  md:inline-flex md:ml-4 md:px-1 md:py-0 border-l-4 md:border-l-0 md:border-b-2 hover:text-th-primary
                  border-transparent hover:border-th-primary rounded-none outline-none focus:outline-none"
                onClick={() => wallet.connect()}
              >
                Connect
              </button>
            )}
          </div>
        </div>
      </nav>
    </>
  )
}

export default TopBar
