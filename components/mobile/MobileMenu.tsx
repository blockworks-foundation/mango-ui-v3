import { useState } from 'react'
import { Transition } from '@headlessui/react'
import { MenuIcon, XIcon } from '@heroicons/react/outline'
import MenuItem from '../MenuItem'
import ConnectWalletButton from '../ConnectWalletButton'
import { IconButton } from '../Button'

const MobileMenu = () => {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <>
      <IconButton
        aria-controls="mobile-menu"
        aria-expanded="false"
        className="md:hidden ml-2"
        onClick={() => setShowMenu((showMenu) => !showMenu)}
      >
        <span className="sr-only">Open main menu</span>
        <MenuIcon className="h-5 w-5" />
      </IconButton>
      <Transition
        appear={true}
        show={showMenu}
        enter="transition ease-in-out duration-500 transform"
        enterFrom="translate-x-full"
        enterTo="translate-x-0"
        leave="transition ease-in-out duration-500 transform"
        leaveFrom="translate-x-0"
        leaveTo="translate-x-full"
        className={`md:hidden fixed h-full right-0 top-0 w-[96%] bg-th-bkg-2 space-y-1 z-20`}
      >
        <div className="bg-th-bkg-3 flex h-14 items-center justify-between px-4">
          <IconButton className="block" onClick={() => setShowMenu(false)}>
            <XIcon className="h-5 w-5" />
          </IconButton>
          <ConnectWalletButton />
        </div>
        <div className="p-6">
          <MenuItem href="/spot/BTC">Trade</MenuItem>
          <MenuItem href="/account">Account</MenuItem>
          <MenuItem href="/borrow">Borrow</MenuItem>
          <MenuItem href="/stats">Stats</MenuItem>
          <MenuItem href="https://docs.mango.markets/">Learn</MenuItem>
        </div>
      </Transition>
      <div
        className={`${
          showMenu ? `visible` : `hidden`
        } md:hidden fixed right-0 top-0 h-full w-full bg-[rgba(0,0,0,0.4)] p-6 z-10`}
      />
    </>
  )
}

export default MobileMenu
