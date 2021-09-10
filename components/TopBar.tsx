import { useCallback, useState } from 'react'
import Link from 'next/link'
import { abbreviateAddress } from '../utils/index'
import MenuItem from './MenuItem'
import ThemeSwitch from './ThemeSwitch'
import useMangoStore from '../stores/useMangoStore'
import ConnectWalletButton from './ConnectWalletButton'
import NavDropMenu from './NavDropMenu'
import AccountsModal from './AccountsModal'
import MobileMenu from './mobile/MobileMenu'

const TopBar = () => {
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const [showAccountsModal, setShowAccountsModal] = useState(false)

  const handleCloseAccounts = useCallback(() => {
    setShowAccountsModal(false)
  }, [])

  return (
    <>
      <nav className={`bg-th-bkg-2 border-b border-th-bkg-2`}>
        <div className={`px-6 md:px-9`}>
          <div className={`flex justify-between h-14`}>
            <div className={`flex`}>
              <Link href="/spot/BTC">
                <div
                  className={`cursor-pointer flex-shrink-0 flex items-center`}
                >
                  <img
                    className={`h-8 w-auto`}
                    src="/assets/icons/logo.svg"
                    alt="next"
                  />
                </div>
              </Link>
              <div
                className={`hidden md:flex md:items-center md:space-x-6 md:ml-4`}
              >
                <MenuItem href="/spot/BTC">Trade</MenuItem>
                <MenuItem href="/account">Account</MenuItem>
                <MenuItem href="/borrow">Borrow</MenuItem>
                <MenuItem href="/stats">Stats</MenuItem>
                <MenuItem href="https://docs.mango.markets/" newWindow>
                  Learn
                </MenuItem>
                <NavDropMenu
                  menuTitle="More"
                  // linksArray: [name: string, href: string, isExternal: boolean]
                  linksArray={[
                    ['Mango v1', 'https://usdt.mango.markets', true],
                    ['Mango v2', 'https://v2.mango.markets', true],
                  ]}
                />
              </div>
            </div>
            <div className="flex items-center">
              <div className={`pl-2`}>
                <ThemeSwitch />
              </div>
              {mangoAccount ? (
                <div className="pl-3">
                  <button
                    className="border border-th-bkg-4 py-1 px-2 rounded text-xs focus:outline-none hover:border-th-fgd-4"
                    onClick={() => setShowAccountsModal(true)}
                  >
                    <div className="font-normal text-th-primary tiny-text">
                      Account
                    </div>
                    {mangoAccount.name
                      ? mangoAccount.name
                      : abbreviateAddress(mangoAccount.publicKey)}
                  </button>
                </div>
              ) : null}
              <div className="flex">
                <div className="hidden md:block pl-3">
                  <ConnectWalletButton />
                </div>
              </div>
              <MobileMenu />
            </div>
          </div>
        </div>
      </nav>
      {showAccountsModal ? (
        <AccountsModal
          onClose={handleCloseAccounts}
          isOpen={showAccountsModal}
        />
      ) : null}
    </>
  )
}

export default TopBar
