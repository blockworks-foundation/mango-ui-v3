import { useEffect, useState } from 'react'
import styled from '@emotion/styled'
import {
  DuplicateIcon,
  LogoutIcon,
  MenuIcon,
  XIcon,
} from '@heroicons/react/outline'
import MenuItem from './MenuItem'
import useWallet from '../hooks/useWallet'
import ThemeSwitch from './ThemeSwitch'
import WalletIcon from './WalletIcon'
import UiLock from './UiLock'
import DropMenu from './DropMenu'
import { useRouter } from 'next/router'

const Code = styled.code`
  border: 1px solid hsla(0, 0%, 39.2%, 0.2);
  border-radius: 3px;
  background: hsla(0, 0%, 58.8%, 0.1);
`

const TopBar = () => {
  const { asPath } = useRouter()
  const { connected, wallet } = useWallet()
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
    <nav className={`bg-th-bkg-1 border-b border-th-bkg-3`}>
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
                {connected ? (
                  <DropMenu
                    options={WALLET_OPTIONS}
                    onChange={(option) => handleWalletMenu(option)}
                    value={''}
                    button={
                      <div className="flex flex-row items-center justify-center">
                        <WalletIcon className="w-5 h-5 mr-2 fill-current" />
                        <Code
                          className={`text-xs p-1 text-th-fgd-1 font-extralight`}
                        >
                          {isCopied
                            ? 'Copied!'
                            : wallet.publicKey.toString().substr(0, 5) +
                              '...' +
                              wallet.publicKey.toString().substr(-5)}
                        </Code>
                      </div>
                    }
                    buttonClassName="w-44 h-10 border border-th-primary hover:border-th-fgd-1 rounded-md text-th-primary hover:text-th-fgd-1"
                  />
                ) : (
                  <button
                    onClick={handleConnectDisconnect}
                    className="border border-th-primary hover:border-th-fgd-1 rounded-md py-2 w-44  text-th-primary hover:text-th-fgd-1 font-semibold text-bas"
                  >
                    <div className="flex flex-row items-center justify-center">
                      <WalletIcon className="w-5 h-5 mr-2 fill-current" />
                      Connect Wallet
                    </div>
                  </button>
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
