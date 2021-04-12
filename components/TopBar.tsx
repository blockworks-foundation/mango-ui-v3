import { useState } from 'react'
import xw from 'xwind'
import styled from '@emotion/styled'
// import { useTheme } from 'next-themes'
import { SunIcon, MoonIcon, MenuIcon, XIcon } from '@heroicons/react/outline'
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
  // const { theme, setTheme } = useTheme()

  const handleConnectDisconnect = () => {
    connected ? wallet.disconnect() : wallet.connect()
  }

  return (
    <nav css={xw`bg-th-bkg-1`}>
      <div css={xw`px-4 sm:px-6 lg:px-8`}>
        <div css={xw`flex justify-between h-16`}>
          <div css={xw`flex`}>
            <div css={xw`flex-shrink-0 flex items-center`}>
              <img
                css={xw`h-8 w-auto`}
                src="/assets/icons/logo.svg"
                alt="next"
              />
            </div>
            <div css={xw`hidden sm:flex sm:space-x-8 sm:ml-4`}>
              <MenuItem href="/">Trade</MenuItem>
              <MenuItem href="/stats">Stats</MenuItem>
              <MenuItem href="https://docs.mango.markets/">Learn</MenuItem>
            </div>
          </div>
          <div css={xw`flex`}>
            <div css={xw`flex items-center pr-1`}>
              <ThemeSwitch />
              {/*<button
                type="button"
                css={xw`inline-flex items-center justify-center p-2 rounded-md text-black dark:text-white hover:text-gray-400 focus:outline-none`}
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'light' ? (
                  <MoonIcon css={xw`h-5 w-5`} />
                ) : (
                  <SunIcon css={xw`h-5 w-5`} />
                )}
                </button>*/}
              <div css={xw`hidden sm:ml-4 sm:flex sm:items-center`}>
                <button
                  onClick={handleConnectDisconnect}
                  css={xw`border border-th-primary hover:bg-th-primary rounded-md px-4 py-2 focus:outline-none text-base text-th-primary hover:text-th-fgd-1 font-semibold`}
                >
                  <div>
                    {connected ? (
                      <div onClick={wallet.disconnect}>
                        <span>Disconnect: </span>
                        <Code
                          css={xw`text-xs p-1 text-th-fgd-1 font-extralight`}
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
            <div css={xw`-mr-2 flex items-center sm:hidden`}>
              <button
                type="button"
                css={xw`inline-flex items-center justify-center p-2 rounded-md text-black dark:text-white hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-mango-orange`}
                aria-controls="mobile-menu"
                aria-expanded="false"
                onClick={() => setShowMenu((showMenu) => !showMenu)}
              >
                <span css={xw`sr-only`}>Open main menu</span>
                {showMenu ? (
                  <XIcon css={xw`h-5 w-5`} />
                ) : (
                  <MenuIcon css={xw`h-5 w-5`} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div
        css={[showMenu ? xw`visible` : xw`hidden`, xw`sm:hidden`]}
        id="mobile-menu"
      >
        <div css={xw`bg-mango-grey-dark pt-2 pb-3 space-y-1`}>
          <MenuItem href="/">Trade</MenuItem>
          <MenuItem href="/stats">Stats</MenuItem>
          <MenuItem href="https://docs.mango.markets/">Learn</MenuItem>
        </div>
      </div>
    </nav>
  )
}

export default TopBar
