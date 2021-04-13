import { useState } from 'react'
import styled from '@emotion/styled'
import { MenuIcon, XIcon } from '@heroicons/react/outline'
import MenuItem from './MenuItem'
import useWallet from '../hooks/useWallet'
import ThemeSwitch from './ThemeSwitch'

const Code = styled.code`
  border: 1px solid hsla(0, 0%, 39.2%, 0.2);
  border-radius: 3px;
  background: hsla(0, 0%, 58.8%, 0.1);
`

const TopBar = () => {
  const { connected, wallet } = useWallet()
  const [showMenu, setShowMenu] = useState(false)

  const handleConnectDisconnect = () => {
    connected ? wallet.disconnect() : wallet.connect()
  }

  return (
    <nav className={`bg-th-bkg-1`}>
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
          <div className={`flex`}>
            <div className={`flex items-center pr-1`}>
              <ThemeSwitch />
              {/*<button
                type="button"
                className={`inline-flex items-center justify-center p-2 rounded-md text-black dark:text-white hover:text-gray-400 focus:outline-none`}
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'light' ? (
                  <MoonIcon className={`h-5 w-5`} />
                ) : (
                  <SunIcon className={`h-5 w-5`} />
                )}
                </button>*/}
              <div className={`hidden sm:ml-4 sm:flex sm:items-center`}>
                <button
                  onClick={handleConnectDisconnect}
                  className={`border border-th-primary hover:bg-th-primary rounded-md px-4 py-2 focus:outline-none text-th-primary hover:text-th-fgd-1 font-semibold text-base`}
                >
                  <div>
                    {connected ? (
                      <div onClick={wallet.disconnect}>
                        <span>Disconnect: </span>
                        <Code
                          className={`text-xs p-1 text-th-fgd-1 font-extralight`}
                        >
                          {wallet.publicKey.toString().substr(0, 4) +
                            '...' +
                            wallet.publicKey.toString().substr(-4)}
                        </Code>
                      </div>
                    ) : (
                      'Connect Wallet'
                    )}
                  </div>
                </button>
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
                <span className={`sr-only`}>Open main menu</span>
                {showMenu ? (
                  <XIcon className={`h-5 w-5 text-th-primary`} />
                ) : (
                  <MenuIcon className={`h-5 w-5 text-th-primary`} />
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
