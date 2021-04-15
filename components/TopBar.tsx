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
import MenuItem from './MenuItem'
import ThemeSwitch from './ThemeSwitch'
import { WalletIcon } from './icons'
import UiLock from './UiLock'
import { useRouter } from 'next/router'
import WalletSelect from './WalletSelect'
import useMangoStore from '../stores/useMangoStore'
import { WALLET_PROVIDERS, DEFAULT_PROVIDER } from '../hooks/useWallet'
import useLocalStorageState from '../hooks/useLocalStorageState'

const Code = styled.code`
  border: 1px solid hsla(0, 0%, 39.2%, 0.2);
  border-radius: 3px;
  background: hsla(0, 0%, 58.8%, 0.1);
  font-size: 13px;
`

const StyledWalletTypeLabel = styled.div`
  font-size: 0.6rem;
`

const TopBar = () => {
  const { asPath } = useRouter()
  const connected = useMangoStore((s) => s.wallet.connected)
  const wallet = useMangoStore((s) => s.wallet.current)
  const [showMenu, setShowMenu] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [savedProviderUrl] = useLocalStorageState(
    'walletProvider',
    DEFAULT_PROVIDER.url
  )

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
      const el = document.createElement('textarea')
      el.value = wallet.publicKey.toString()
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setIsCopied(true)
    } else {
      wallet.disconnect()
    }
  }

  const handleConnectDisconnect = () => {
    connected ? wallet.disconnect() : wallet.connect()
  }

  const WALLET_OPTIONS = [
    { name: 'Copy address', icon: <DuplicateIcon /> },
    { name: 'Disconnect', icon: <LogoutIcon /> },
  ]

  return (
    <nav className={`bg-th-bkg-2`}>
      <div className={`px-4 sm:px-6 lg:px-8`}>
        <div className={`flex justify-between h-16`}>
          <div className={`flex`}>
            <div className={`flex-shrink-0 flex items-center ml-2`}>
              <img
                className={`h-8 w-auto`}
                src="/assets/icons/logo.svg"
                alt="next"
              />
            </div>
            <div className={`hidden sm:flex sm:space-x-8 sm:ml-4 py-2`}>
              <MenuItem href="/">Trade</MenuItem>
              <MenuItem href="/stats">Stats</MenuItem>
              <MenuItem href="https://docs.mango.markets/">Learn</MenuItem>
            </div>
          </div>
          <div className="flex">
            <div className="flex items-center pr-1">
              {asPath === '/' ? <UiLock className="mr-1" /> : null}
              <ThemeSwitch />
              <div className="hidden sm:ml-4 sm:block">
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
                                className="flex flex-row items-center justify-between w-full p-2 hover:bg-th-bkg-2 hover:cursor-pointer tracking-wider"
                                onClick={() => handleWalletMenu(name)}
                              >
                                <div className="flex">
                                  <div className="w-5 h-5 mr-2">{icon}</div>
                                  {name}
                                </div>
                              </button>
                            </Menu.Item>
                          ))}
                        </Menu.Items>
                      </div>
                    )}
                  </Menu>
                ) : (
                  <div className="flex justify-between border border-th-primary rounded-md h-11 w-48">
                    <button
                      onClick={handleConnectDisconnect}
                      className="text-th-primary hover:text-th-fgd-1 focus:outline-none font-semibold"
                    >
                      <div className="flex flex-row items-center px-2 justify-center h-full rounded-l hover:bg-th-primary hover:text-th-fgd-1">
                        <WalletIcon className="w-5 h-5 mr-3 fill-current" />
                        <div>
                          <span className="whitespace-nowrap">
                            Connect Wallet
                          </span>
                          <StyledWalletTypeLabel className="font-normal text-th-fgd-1 text-left leading-3">
                            {WALLET_PROVIDERS.filter(
                              (p) => p.url === savedProviderUrl
                            ).map(({ name }) => name)}
                          </StyledWalletTypeLabel>
                        </div>
                      </div>
                    </button>
                    {!connected && (
                      <div className="relative h-full">
                        <WalletSelect />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className={`-mr-2 flex items-center sm:hidden`}>
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
        className={`${showMenu ? `visible` : `hidden`} sm:hidden`}
        id="mobile-menu"
      >
        <div
          className={`bg-th-bkg-3 pt-2 pb-3 space-y-1 border-b border-th-fgd-4`}
        >
          <MenuItem href="/">Trade</MenuItem>
          <MenuItem href="/stats">Stats</MenuItem>
          <MenuItem href="https://docs.mango.markets/">Learn</MenuItem>
        </div>
      </div>
    </nav>
  )
}

export default TopBar
