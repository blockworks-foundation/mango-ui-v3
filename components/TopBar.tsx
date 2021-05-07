import { useEffect, useState } from 'react'
import { Menu } from '@headlessui/react'
import styled from '@emotion/styled'
import {
  ChevronUpIcon,
  ChevronDownIcon,
  DuplicateIcon,
  LogoutIcon,
  MenuIcon,
  XIcon,
} from '@heroicons/react/outline'
import UiLock from './UiLock'
import { useRouter } from 'next/router'
import MenuItem from './MenuItem'
import ThemeSwitch from './ThemeSwitch'
import { WalletIcon } from './icons'
import useMangoStore from '../stores/useMangoStore'
import ConnectWalletButton from './ConnectWalletButton'
import { copyToClipboard } from '../utils'
import AlertsList from './AlertsList'

const Code = styled.code`
  border: 1px solid hsla(0, 0%, 39.2%, 0.2);
  border-radius: 3px;
  background: hsla(0, 0%, 58.8%, 0.1);
  font-size: 13px;
`

const WALLET_OPTIONS = [
  { name: 'Copy address', icon: <DuplicateIcon /> },
  { name: 'Disconnect', icon: <LogoutIcon /> },
]

const TopBar = () => {
  const { asPath } = useRouter()
  const connected = useMangoStore((s) => s.wallet.connected)
  const wallet = useMangoStore((s) => s.wallet.current)
  const [showMenu, setShowMenu] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isCopied])

  const handleWalletMenu = (option) => {
    if (option === 'Copy address') {
      copyToClipboard(wallet.publicKey)
      setIsCopied(true)
    } else {
      wallet.disconnect()
    }
  }

  return (
    <nav className={`bg-th-bkg-2`}>
      <div className={`px-4 md:px-6 lg:px-8`}>
        <div className={`flex justify-between h-16`}>
          <div className={`flex`}>
            <div className={`flex-shrink-0 flex items-center`}>
              <img
                className={`h-8 w-auto`}
                src="/assets/icons/logo.svg"
                alt="next"
              />
            </div>
            <div className={`hidden md:flex md:space-x-6 md:ml-4 py-2`}>
              <MenuItem href="/">Trade</MenuItem>
              <MenuItem href="/stats">Stats</MenuItem>
              <MenuItem href="/alerts">Alerts</MenuItem>
              <MenuItem href="https://docs.mango.markets/">Learn</MenuItem>
            </div>
          </div>
          <div className="flex">
            <div className="flex items-center">
              <div className="pl-3">{asPath === '/' ? <UiLock /> : null}</div>
              <div className="pl-3">
                <ThemeSwitch />
              </div>
              {connected ? (
                <div className="pl-3">
                  <AlertsList />
                </div>
              ) : null}
              <div className="hidden md:ml-4 md:block">
                {connected && wallet?.publicKey ? (
                  <Menu>
                    {({ open }) => (
                      <div className="relative">
                        <Menu.Button className="w-48 h-11 pl-2 pr-2.5 border border-th-green hover:border-th-fgd-1 focus:outline-none rounded-md text-th-fgd-4 hover:text-th-fgd-1">
                          <div className="flex flex-row items-center justify-between">
                            <div className="flex items-center">
                              <WalletIcon className="w-5 h-5 mr-2 fill-current text-th-green" />
                              <Code className="p-1 text-th-fgd-3 font-light">
                                {isCopied
                                  ? 'Copied!'
                                  : wallet.publicKey.toString().substr(0, 5) +
                                    '...' +
                                    wallet.publicKey.toString().substr(-5)}
                              </Code>
                            </div>
                            {open ? (
                              <ChevronUpIcon className="h-5 w-5" />
                            ) : (
                              <ChevronDownIcon className="h-5 w-5" />
                            )}
                          </div>
                        </Menu.Button>
                        <Menu.Items className="z-20 p-1 absolute right-0 top-11 bg-th-bkg-1 divide-y divide-th-bkg-3 shadow-lg outline-none rounded-md w-48">
                          {WALLET_OPTIONS.map(({ name, icon }) => (
                            <Menu.Item key={name}>
                              <button
                                className="flex flex-row items-center w-full p-2 hover:bg-th-bkg-2 hover:cursor-pointer font-normal"
                                onClick={() => handleWalletMenu(name)}
                              >
                                <div className="w-5 h-5 mr-2">{icon}</div>
                                {name}
                              </button>
                            </Menu.Item>
                          ))}
                        </Menu.Items>
                      </div>
                    )}
                  </Menu>
                ) : (
                  <ConnectWalletButton />
                )}
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
  )
}

export default TopBar
