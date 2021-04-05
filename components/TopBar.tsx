import { useState } from 'react'
import xw from 'xwind'
import styled from '@emotion/styled'
import MenuItem from './MenuItem'
import useWallet from '../hooks/useWallet'

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
    <nav css={xw`bg-mango-dark`}>
      <div css={xw`px-4 sm:px-6 lg:px-8`}>
        <div css={xw`flex justify-between h-16`}>
          <div css={xw`flex`}>
            <div css={xw`flex-shrink-0 flex items-center`}>
              <img
                css={xw`h-8 w-auto`}
                src="/assets/icons/logo.svg"
                alt="next"
              />
              <h4 css={xw`block text-white ml-4 text-xl`}>Mango Markets</h4>
            </div>
            <div css={xw`hidden sm:ml-6 sm:flex sm:space-x-8`}>
              <MenuItem href="/">Trade</MenuItem>
              <MenuItem href="/stats">Stats</MenuItem>
              <MenuItem href="https://docs.mango.markets/">Learn</MenuItem>
            </div>
          </div>
          <div css={xw`flex`}>
            <div css={xw`hidden sm:ml-6 sm:flex sm:items-center`}>
              <button
                onClick={handleConnectDisconnect}
                css={xw`bg-mango-dark-light hover:bg-mango-dark-lighter text-mango-yellow rounded-md px-4 py-2 focus:outline-none`}
              >
                <div css={xw`text-base font-light`}>
                  {connected ? (
                    <div onClick={wallet.disconnect}>
                      <span>Disconnect: </span>
                      <Code css={xw`text-xs p-1 text-white font-extralight`}>
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
              css={xw`inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-mango-yellow`}
              aria-controls="mobile-menu"
              aria-expanded="false"
              onClick={() => setShowMenu((showMenu) => !showMenu)}
            >
              <span css={xw`sr-only`}>Open main menu</span>
              <svg
                css={[xw`h-6 w-6`, showMenu ? xw`hidden` : xw`block`]}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                css={[xw`h-6 w-6`, showMenu ? xw`block` : xw`hidden`]}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div
        css={[showMenu ? xw`visible` : xw`hidden`, xw`sm:hidden`]}
        id="mobile-menu"
      >
        <div css={xw`pt-2 pb-3 space-y-1`}>
          <MenuItem href="/">Trade</MenuItem>
          <MenuItem href="/stats">Stats</MenuItem>
          <MenuItem href="https://docs.mango.markets/">Learn</MenuItem>
        </div>
      </div>
    </nav>
  )
}

export default TopBar
