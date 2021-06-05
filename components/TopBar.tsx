import { useState } from 'react'
import { MenuIcon, XIcon } from '@heroicons/react/outline'
import MenuItem from './MenuItem'
import ThemeSwitch from './ThemeSwitch'
import useMangoStore from '../stores/useMangoStore'
import ConnectWalletButton from './ConnectWalletButton'
import AlertsList from './AlertsList'

const TopBar = () => {
  const connected = useMangoStore((s) => s.wallet.connected)
  const wallet = useMangoStore((s) => s.wallet.current)
  const [showMenu, setShowMenu] = useState(false)

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
                <MenuItem href="/stats">Stats</MenuItem>
                <MenuItem href="https://docs.mango.markets/">Learn</MenuItem>
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
            <MenuItem href="/account">Account</MenuItem>
            <MenuItem href="/borrow">Borrow</MenuItem>
            <MenuItem href="/alerts">Alerts</MenuItem>
            <MenuItem href="/stats">Stats</MenuItem>
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
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </nav>
    </>
  )
}

export default TopBar
