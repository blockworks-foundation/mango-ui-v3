import { useCallback, useState } from 'react'
import useMangoStore from '../stores/useMangoStore'
import { Menu } from '@headlessui/react'
import {
  CurrencyDollarIcon,
  DuplicateIcon,
  LogoutIcon,
} from '@heroicons/react/outline'
import {
  WALLET_PROVIDERS,
  DEFAULT_PROVIDER,
  PROVIDER_LOCAL_STORAGE_KEY,
} from '../hooks/useWallet'
import useLocalStorageState from '../hooks/useLocalStorageState'
import { abbreviateAddress, copyToClipboard } from '../utils'
import WalletSelect from './WalletSelect'
import { WalletIcon, ProfileIcon } from './icons'
import AccountsModal from './AccountsModal'
import { useEffect } from 'react'
import SettingsModal from './SettingsModal'
import { CogIcon } from '@heroicons/react/solid'

const ConnectWalletButton = () => {
  const wallet = useMangoStore((s) => s.wallet.current)
  const connected = useMangoStore((s) => s.wallet.connected)
  const set = useMangoStore((s) => s.set)
  const [showAccountsModal, setShowAccountsModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState(DEFAULT_PROVIDER.url)
  const [savedProviderUrl] = useLocalStorageState(
    PROVIDER_LOCAL_STORAGE_KEY,
    DEFAULT_PROVIDER.url
  )

  // update in useEffect to prevent SRR error from next.js
  useEffect(() => {
    setSelectedWallet(savedProviderUrl)
  }, [savedProviderUrl])

  const handleWalletConect = () => {
    wallet.connect()
    set((state) => {
      state.selectedMangoAccount.initialLoad = true
    })
  }

  const handleCloseAccounts = useCallback(() => {
    setShowAccountsModal(false)
  }, [])

  return (
    <>
      {connected && wallet?.publicKey ? (
        <Menu>
          <div className="relative">
            <Menu.Button className="bg-th-bkg-4 flex items-center justify-center rounded-full w-10 h-10 text-white focus:outline-none hover:bg-th-bkg-4 hover:text-th-fgd-3">
              <ProfileIcon className="h-6 w-6" />
            </Menu.Button>
            <Menu.Items className="bg-th-bkg-1 mt-2 p-1 absolute right-0 shadow-lg outline-none rounded-md w-48 z-20">
              <Menu.Item>
                <button
                  className="hidden md:flex flex-row font-normal items-center rounded-none w-full p-2 hover:bg-th-bkg-2 hover:cursor-pointer focus:outline-none"
                  onClick={() => setShowAccountsModal(true)}
                >
                  <CurrencyDollarIcon className="h-4 w-4" />
                  <div className="pl-2 text-left">Accounts</div>
                </button>
              </Menu.Item>
              <Menu.Item>
                <button
                  className="hidden md:flex flex-row font-normal items-center rounded-none w-full p-2 hover:bg-th-bkg-2 hover:cursor-pointer focus:outline-none"
                  onClick={() => setShowSettingsModal(true)}
                >
                  <CogIcon className="h-4 w-4" />
                  <div className="pl-2 text-left">Settings</div>
                </button>
              </Menu.Item>
              <Menu.Item>
                <button
                  className="flex flex-row font-normal items-center rounded-none w-full p-2 hover:bg-th-bkg-2 hover:cursor-pointer focus:outline-none"
                  onClick={() => copyToClipboard(wallet?.publicKey)}
                >
                  <DuplicateIcon className="h-4 w-4" />
                  <div className="pl-2 text-left">Copy address</div>
                </button>
              </Menu.Item>
              <Menu.Item>
                <button
                  className="flex flex-row font-normal items-center rounded-none w-full p-2 hover:bg-th-bkg-2 hover:cursor-pointer focus:outline-none"
                  onClick={() => wallet.disconnect()}
                >
                  <LogoutIcon className="h-4 w-4" />
                  <div className="pl-2 text-left">
                    <div className="pb-0.5">Disconnect</div>
                    <div className="text-th-fgd-4 text-xs">
                      {abbreviateAddress(wallet?.publicKey)}
                    </div>
                  </div>
                </button>
              </Menu.Item>
            </Menu.Items>
          </div>
        </Menu>
      ) : (
        <div className="bg-th-bkg-1 h-14 flex divide-x divide-th-bkg-3 justify-between">
          <button
            onClick={handleWalletConect}
            disabled={!wallet}
            className="rounded-none text-th-primary hover:bg-th-bkg-4 focus:outline-none disabled:text-th-fgd-4 disabled:cursor-wait"
          >
            <div className="flex flex-row items-center px-3 justify-center h-full default-transition hover:text-th-fgd-1">
              <WalletIcon className="w-4 h-4 mr-2 fill-current" />
              <div>
                <div className="mb-0.5 whitespace-nowrap">Connect</div>
                <div className="font-normal text-th-fgd-3 text-left leading-3 tracking-wider text-xxs">
                  {WALLET_PROVIDERS.find((p) => p.url === selectedWallet)?.name}
                </div>
              </div>
            </div>
          </button>
          <div className="relative">
            <WalletSelect isPrimary />
          </div>
        </div>
      )}
      {showAccountsModal ? (
        <AccountsModal
          onClose={handleCloseAccounts}
          isOpen={showAccountsModal}
        />
      ) : null}
      {showSettingsModal ? (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
          isOpen={showSettingsModal}
        />
      ) : null}
    </>
  )
}

export default ConnectWalletButton
