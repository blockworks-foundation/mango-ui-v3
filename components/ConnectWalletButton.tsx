import React, {
  Fragment,
  useCallback,
  useState,
  useMemo,
  useEffect,
} from 'react'
import { Menu, Transition } from '@headlessui/react'
import { useWallet, Wallet } from '@solana/wallet-adapter-react'
import { WalletReadyState } from '@solana/wallet-adapter-base'
import {
  CurrencyDollarIcon,
  LogoutIcon,
  UserCircleIcon,
} from '@heroicons/react/outline'
import { notify } from 'utils/notifications'
import { abbreviateAddress } from 'utils'
import useMangoStore from 'stores/useMangoStore'
import { WalletIcon } from './icons'
import { useTranslation } from 'next-i18next'
import { WalletSelect } from 'components/WalletSelect'
import AccountsModal from './AccountsModal'
import uniqBy from 'lodash/uniqBy'
import ProfileImage from './ProfileImage'
import { useRouter } from 'next/router'
import { PublicKey } from '@solana/web3.js'
import { breakpoints } from '../components/TradePageGrid'
import { useViewport } from 'hooks/useViewport'

export const handleWalletConnect = (wallet: Wallet) => {
  if (!wallet) {
    return
  }

  wallet?.adapter?.connect().catch((e) => {
    if (e.name.includes('WalletLoadError')) {
      notify({
        title: `${wallet.adapter.name} Error`,
        type: 'error',
        description: `Please install ${wallet.adapter.name} and then reload this page.`,
      })
    }
  })
}

export const ConnectWalletButton: React.FC = () => {
  const { connected, publicKey, wallet, wallets, select } = useWallet()
  const { t } = useTranslation(['common', 'profile'])
  const router = useRouter()
  const loadingTransaction = useMangoStore(
    (s) => s.wallet.nfts.loadingTransaction
  )
  const set = useMangoStore((s) => s.set)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const [showAccountsModal, setShowAccountsModal] = useState(false)
  const actions = useMangoStore((s) => s.actions)
  const profileDetails = useMangoStore((s) => s.profile.details)
  const loadProfileDetails = useMangoStore((s) => s.profile.loadDetails)
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.md : false

  useEffect(() => {
    if (publicKey) {
      actions.fetchProfileDetails(publicKey.toString())
    }
  }, [publicKey])

  const installedWallets = useMemo(() => {
    const installed: Wallet[] = []

    for (const wallet of wallets) {
      if (wallet.readyState === WalletReadyState.Installed) {
        installed.push(wallet)
      }
    }

    return installed?.length ? installed : wallets
  }, [wallets])

  const displayedWallets = useMemo(() => {
    return uniqBy([...installedWallets, ...wallets], (w) => {
      return w.adapter.name
    })
  }, [wallets, installedWallets])

  const handleConnect = useCallback(() => {
    if (wallet) {
      handleWalletConnect(wallet)
    }
  }, [wallet])

  const handleCloseAccounts = useCallback(() => {
    setShowAccountsModal(false)
  }, [])

  const handleDisconnect = useCallback(() => {
    wallet?.adapter?.disconnect()
    set((state) => {
      state.mangoAccounts = []
      state.selectedMangoAccount.current = null
      state.tradeHistory = {
        spot: [],
        perp: [],
        parsed: [],
        initialLoad: false,
      }
    })
    notify({
      type: 'info',
      title: t('wallet-disconnected'),
    })
  }, [wallet, set, t])

  useEffect(() => {
    if (!wallet && displayedWallets?.length) {
      select(displayedWallets[0].adapter.name)
    }
  }, [wallet, displayedWallets, select])

  return (
    <>
      {connected && publicKey ? (
        <Menu>
          {({ open }) => (
            <div className="relative" id="profile-menu-tip">
              <Menu.Button
                className={`flex h-14 ${
                  !isMobile ? 'w-48 border-x border-th-bkg-3 px-3' : ''
                } items-center rounded-none rounded-full hover:bg-th-bkg-2 focus:outline-none ${
                  loadingTransaction ? 'animate-pulse bg-th-bkg-4' : ''
                }`}
              >
                <ProfileImage imageSize="40" placeholderSize="24" />
                {!loadProfileDetails && !isMobile ? (
                  <div className="ml-2 w-32 text-left">
                    <p className="mb-0.5 truncate text-xs font-bold capitalize text-th-fgd-1">
                      {profileDetails.profile_name}
                    </p>
                    <p className="mb-0 text-xs text-th-fgd-4">
                      {profileDetails.wallet_pk
                        ? abbreviateAddress(
                            new PublicKey(profileDetails.wallet_pk)
                          )
                        : ''}
                    </p>
                  </div>
                ) : null}
              </Menu.Button>
              <Transition
                appear={true}
                show={open}
                as={Fragment}
                enter="transition-all ease-in duration-200"
                enterFrom="opacity-0 transform scale-75"
                enterTo="opacity-100 transform scale-100"
                leave="transition ease-out duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Menu.Items className="absolute right-0 z-20 mt-1 w-48 space-y-1.5 rounded-md bg-th-bkg-2 px-4 py-2.5">
                  <Menu.Item>
                    <button
                      className="flex w-full flex-row items-center rounded-none py-0.5 font-normal hover:cursor-pointer hover:text-th-primary focus:outline-none"
                      onClick={() => router.push('/profile')}
                    >
                      <UserCircleIcon className="h-4 w-4" />
                      <div className="pl-2 text-left">
                        {t('profile:profile')}
                      </div>
                    </button>
                  </Menu.Item>
                  <Menu.Item>
                    <button
                      className="flex w-full flex-row items-center rounded-none py-0.5 font-normal hover:cursor-pointer hover:text-th-primary focus:outline-none"
                      onClick={() => setShowAccountsModal(true)}
                    >
                      <CurrencyDollarIcon className="h-4 w-4" />
                      <div className="pl-2 text-left">{t('accounts')}</div>
                    </button>
                  </Menu.Item>
                  <Menu.Item>
                    <button
                      className="flex w-full flex-row items-center rounded-none py-0.5 font-normal hover:cursor-pointer focus:outline-none md:hover:text-th-primary"
                      onClick={handleDisconnect}
                    >
                      <LogoutIcon className="h-4 w-4" />
                      <div className="pl-2 text-left">
                        <div className="pb-0.5">{t('disconnect')}</div>
                        <div className="text-xs text-th-fgd-4">
                          {abbreviateAddress(publicKey)}
                        </div>
                      </div>
                    </button>
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </div>
          )}
        </Menu>
      ) : (
        <div
          className="flex h-14 divide-x divide-th-bkg-3"
          id="connect-wallet-tip"
        >
          <button
            onClick={handleConnect}
            disabled={!mangoGroup}
            className="rounded-none bg-th-primary-dark text-th-bkg-1 focus:outline-none disabled:cursor-wait disabled:text-th-bkg-2"
          >
            <div className="default-transition flex h-full flex-row items-center justify-center px-3">
              <WalletIcon className="mr-2 h-4 w-4 fill-current" />
              <div className="text-left">
                <div className="mb-1 whitespace-nowrap font-bold leading-none">
                  {t('connect')}
                </div>
                {wallet?.adapter?.name && (
                  <div className="text-xxs font-normal leading-3 tracking-wider text-th-bkg-2">
                    {wallet.adapter.name}
                  </div>
                )}
              </div>
            </div>
          </button>
          <div className="relative">
            <WalletSelect wallets={displayedWallets} />
          </div>
        </div>
      )}
      {showAccountsModal && (
        <AccountsModal
          onClose={handleCloseAccounts}
          isOpen={showAccountsModal}
        />
      )}
    </>
  )
}
