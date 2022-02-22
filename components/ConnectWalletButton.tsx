import { useCallback, useState } from 'react'
import useMangoStore from '../stores/useMangoStore'
import { Menu } from '@headlessui/react'
import {
  CurrencyDollarIcon,
  DuplicateIcon,
  LogoutIcon,
} from '@heroicons/react/outline'
import { PROVIDER_LOCAL_STORAGE_KEY } from '../hooks/useWallet'
import useLocalStorageState from '../hooks/useLocalStorageState'
import { abbreviateAddress, copyToClipboard } from '../utils'
import WalletSelect from './WalletSelect'
import { WalletIcon, ProfileIcon } from './icons'
import AccountsModal from './AccountsModal'
import { useEffect } from 'react'
import { useTranslation } from 'next-i18next'
import { DEFAULT_PROVIDER, WALLET_PROVIDERS } from '../utils/wallet-adapters'

const ConnectWalletButton = () => {
  const { t } = useTranslation('common')
  const wallet = useMangoStore((s) => s.wallet.current)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const pfp = useMangoStore((s) => s.wallet.pfp)
  const connected = useMangoStore((s) => s.wallet.connected)
  const set = useMangoStore((s) => s.set)
  const [showAccountsModal, setShowAccountsModal] = useState(false)
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
          <div className="relative" id="profile-menu-tip">
            <Menu.Button className="bg-th-bkg-4 flex items-center justify-center rounded-full w-10 h-10 text-white focus:outline-none hover:bg-th-bkg-4 hover:text-th-fgd-3">
              {pfp?.isAvailable ? (
                <img alt="" src={pfp.url} className="rounded-full" />
              ) : (
                <ProfileIcon className="h-6 w-6" />
              )}
            </Menu.Button>
            <Menu.Items className="bg-th-bkg-1 mt-2 p-1 absolute right-0 shadow-lg outline-none rounded-md w-48 z-20">
              <Menu.Item>
                <button
                  className="flex flex-row font-normal items-center rounded-none w-full p-2 hover:bg-th-bkg-2 hover:cursor-pointer focus:outline-none"
                  onClick={() => setShowAccountsModal(true)}
                >
                  <CurrencyDollarIcon className="h-4 w-4" />
                  <div className="pl-2 text-left">{t('accounts')}</div>
                </button>
              </Menu.Item>
              <Menu.Item>
                <button
                  className="flex flex-row font-normal items-center rounded-none w-full p-2 hover:bg-th-bkg-2 hover:cursor-pointer focus:outline-none"
                  onClick={() => copyToClipboard(wallet?.publicKey)}
                >
                  <DuplicateIcon className="h-4 w-4" />
                  <div className="pl-2 text-left">{t('copy-address')}</div>
                </button>
              </Menu.Item>
              <Menu.Item>
                <button
                  className="flex flex-row font-normal items-center rounded-none w-full p-2 hover:bg-th-bkg-2 hover:cursor-pointer focus:outline-none"
                  onClick={() => wallet.disconnect()}
                >
                  <LogoutIcon className="h-4 w-4" />
                  <div className="pl-2 text-left">
                    <div className="pb-0.5">{t('disconnect')}</div>
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
        <div
          className="h-14 flex divide-x divide-th-bkg-3 justify-between"
          id="connect-wallet-tip"
        >
          <button
            onClick={handleWalletConect}
            disabled={!wallet || !mangoGroup}
            className="bg-th-primary-dark rounded-none text-th-bkg-1 hover:brightness-[1.1] focus:outline-none disabled:text-th-bkg-2 disabled:cursor-wait"
          >
            <div className="flex flex-row items-center px-3 justify-center h-full default-transition">
              <WalletIcon className="w-4 h-4 mr-2 fill-current" />
              <div className="text-left">
                <div className="font-bold mb-0.5 whitespace-nowrap">
                  {t('connect')}
                </div>
                <div className="font-normal text-th-bkg-2 leading-3 tracking-wider text-xxs">
                  {WALLET_PROVIDERS.find((p) => p.url === selectedWallet)?.name}
                </div>
              </div>
            </div>
          </button>
          <div className="relative">
            <WalletSelect />
          </div>
        </div>
      )}
      {showAccountsModal ? (
        <AccountsModal
          onClose={handleCloseAccounts}
          isOpen={showAccountsModal}
        />
      ) : null}
    </>
  )
}

export default ConnectWalletButton
