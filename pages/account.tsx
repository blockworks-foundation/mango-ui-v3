import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  BellIcon,
  ChevronDownIcon,
  CurrencyDollarIcon,
  DuplicateIcon,
  ExclamationCircleIcon,
  GiftIcon,
  LinkIcon,
  SwitchHorizontalIcon,
  TrashIcon,
  UsersIcon,
} from '@heroicons/react/solid'
import { nativeToUi, ZERO_BN } from '@blockworks-foundation/mango-client'
import useMangoStore, { serumProgramId, MNGO_INDEX } from 'stores/useMangoStore'
import AccountOrders from 'components/account_page/AccountOrders'
import AccountHistory from 'components/account_page/AccountHistory'
import AccountsModal from 'components/AccountsModal'
import AccountOverview from 'components/account_page/AccountOverview'
import AccountPerformancePerToken from 'components/account_page/AccountPerformancePerToken'
import AccountNameModal from 'components/AccountNameModal'
import Button, { LinkButton } from 'components/Button'
import EmptyState from 'components/EmptyState'
import Loading from 'components/Loading'
import Swipeable from 'components/mobile/Swipeable'
import Tabs from 'components/Tabs'
import { useViewport } from 'hooks/useViewport'
import { breakpoints } from 'components/TradePageGrid'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { PublicKey } from '@solana/web3.js'
import CloseAccountModal from 'components/CloseAccountModal'
import { notify } from 'utils/notifications'
import {
  actionsSelector,
  mangoAccountSelector,
  mangoGroupSelector,
} from 'stores/selectors'
import CreateAlertModal from 'components/CreateAlertModal'
import {
  abbreviateAddress,
  // abbreviateAddress,
  copyToClipboard,
} from 'utils'
import DelegateModal from 'components/DelegateModal'
import { Menu, Transition } from '@headlessui/react'
import { useWallet } from '@solana/wallet-adapter-react'
import { handleWalletConnect } from 'components/ConnectWalletButton'
import { MangoAccountLookup } from 'components/account_page/MangoAccountLookup'
import NftProfilePicModal from 'components/NftProfilePicModal'
import SwipeableTabs from 'components/mobile/SwipeableTabs'
import useLocalStorageState from 'hooks/useLocalStorageState'
import dayjs from 'dayjs'
import Link from 'next/link'
import ProfileImage from 'components/ProfileImage'
import Tooltip from 'components/Tooltip'

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'common',
        'close-account',
        'delegate',
        'alerts',
        'account-performance',
        'share-modal',
        'profile',
      ])),
      // Will be passed to the page component as props
    },
  }
}

const TABS = ['Overview', 'Orders', 'History', 'Performance']

export default function Account() {
  const { t } = useTranslation(['common', 'close-account', 'delegate'])
  const { width } = useViewport()
  const router = useRouter()
  const { connected, wallet, publicKey } = useWallet()
  const isLoading = useMangoStore((s) => s.selectedMangoAccount.initialLoad)
  const mangoAccount = useMangoStore(mangoAccountSelector)
  const mangoGroup = useMangoStore(mangoGroupSelector)
  const actions = useMangoStore(actionsSelector)
  const setMangoStore = useMangoStore((s) => s.set)
  const [showAccountsModal, setShowAccountsModal] = useState(false)
  const [showNameModal, setShowNameModal] = useState(false)
  const [showCloseAccountModal, setShowCloseAccountModal] = useState(false)
  const [showAlertsModal, setShowAlertsModal] = useState(false)
  const [showDelegateModal, setShowDelegateModal] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [resetOnLeave, setResetOnLeave] = useState(false)
  const [mngoAccrued, setMngoAccrued] = useState(ZERO_BN)
  const [viewIndex, setViewIndex] = useState(0)
  const [activeTab, setActiveTab] = useState(TABS[0])
  const [showProfilePicModal, setShowProfilePicModal] = useState(false)
  const [savedLanguage] = useLocalStorageState('language', '')

  const [profileData, setProfileData] = useState<any>(null)
  const [loadProfileDetails, setLoadProfileDetails] = useState(false)

  const connecting = wallet?.adapter?.connecting
  const isMobile = width ? width < breakpoints.sm : false
  const { pubkey } = router.query
  const isDelegatedAccount = publicKey
    ? !mangoAccount?.owner?.equals(publicKey)
    : false

  const handleCloseAlertModal = useCallback(() => {
    setShowAlertsModal(false)
  }, [])

  const handleCloseAccounts = useCallback(() => {
    setShowAccountsModal(false)
  }, [])

  const handleCloseNameModal = useCallback(() => {
    setShowNameModal(false)
  }, [])

  const handleCloseCloseAccountModal = useCallback(() => {
    setShowCloseAccountModal(false)
  }, [])

  const handleCloseDelegateModal = useCallback(() => {
    setShowDelegateModal(false)
  }, [])

  const handleCloseProfilePicModal = useCallback(() => {
    setShowProfilePicModal(false)
  }, [])

  const handleConnect = useCallback(() => {
    if (wallet) {
      handleWalletConnect(wallet)
    }
  }, [wallet])

  useEffect(() => {
    dayjs.locale(savedLanguage == 'zh_tw' ? 'zh-tw' : savedLanguage)
  })

  useEffect(() => {
    async function loadUnownedMangoAccount() {
      try {
        if (!pubkey) {
          return
        }
        const unownedMangoAccountPubkey = new PublicKey(pubkey)
        const mangoClient = useMangoStore.getState().connection.client
        if (mangoGroup) {
          const unOwnedMangoAccount = await mangoClient.getMangoAccount(
            unownedMangoAccountPubkey,
            serumProgramId
          )
          setMangoStore((state) => {
            state.selectedMangoAccount.current = unOwnedMangoAccount
            state.selectedMangoAccount.initialLoad = false
          })
          actions.fetchTradeHistory()
          setResetOnLeave(true)
        }
      } catch (error) {
        console.log('error', error)
        router.push('/account')
      }
    }

    if (pubkey) {
      setMangoStore((state) => {
        state.selectedMangoAccount.initialLoad = true
      })
      loadUnownedMangoAccount()
    }
  }, [pubkey, mangoGroup])

  useEffect(() => {
    const handleRouteChange = () => {
      if (resetOnLeave) {
        setMangoStore((state) => {
          state.selectedMangoAccount.current = null
        })
      }
    }
    router.events.on('routeChangeStart', handleRouteChange)
    return () => {
      router.events.off('routeChangeStart', handleRouteChange)
    }
  }, [resetOnLeave])

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [isCopied])

  const handleCopyAddress = (address) => {
    setIsCopied(true)
    copyToClipboard(address)
  }

  const handleChangeViewIndex = (index) => {
    setViewIndex(index)
  }

  const handleTabChange = (tabName) => {
    setActiveTab(tabName)
    setViewIndex(TABS.findIndex((t) => t === tabName))
  }

  useMemo(() => {
    setMngoAccrued(
      mangoAccount
        ? mangoAccount.perpAccounts.reduce((acc, perpAcct) => {
            return perpAcct.mngoAccrued.add(acc)
          }, ZERO_BN)
        : ZERO_BN
    )
  }, [mangoAccount])

  useEffect(() => {
    if (connecting) {
      router.push('/account')
    }
  }, [connecting, router])

  const handleRedeemMngo = async () => {
    const mangoClient = useMangoStore.getState().connection.client
    const mngoNodeBank =
      mangoGroup?.rootBankAccounts?.[MNGO_INDEX]?.nodeBankAccounts?.[0]

    if (!mangoAccount || !mngoNodeBank || !mangoGroup || !wallet) {
      return
    }

    try {
      const txids = await mangoClient.redeemAllMngo(
        mangoGroup,
        mangoAccount,
        wallet.adapter,
        mangoGroup.tokens[MNGO_INDEX].rootBank,
        mngoNodeBank.publicKey,
        mngoNodeBank.vault
      )
      actions.reloadMangoAccount()
      setMngoAccrued(ZERO_BN)
      if (txids) {
        for (const txid of txids) {
          notify({
            title: t('redeem-success'),
            description: '',
            txid,
          })
        }
      } else {
        notify({
          title: t('redeem-failure'),
          description: t('transaction-failed'),
          type: 'error',
        })
      }
    } catch (e) {
      notify({
        title: t('redeem-failure'),
        description: e.message,
        txid: e.txid,
        type: 'error',
      })
    }
  }

  const fetchProfileDetails = async (walletPk: string) => {
    setLoadProfileDetails(true)
    try {
      const response = await fetch(
        `https://mango-transaction-log.herokuapp.com/v3/user-data/profile-details?wallet-pk=${walletPk}`
      )
      const data = await response.json()
      setProfileData(data)
      setLoadProfileDetails(false)
    } catch (e) {
      notify({ type: 'error', title: t('profile:profile-fetch-fail') })
      console.log(e)
      setLoadProfileDetails(false)
    }
  }

  useEffect(() => {
    if (mangoAccount && pubkey) {
      fetchProfileDetails(mangoAccount.owner.toString())
    }
  }, [mangoAccount, pubkey])

  return (
    <div className="pt-6">
      <div className="flex flex-col pb-4 lg:flex-row lg:items-end lg:justify-between">
        {mangoAccount ? (
          <>
            <div className="flex flex-col pb-3 sm:flex-row sm:items-center lg:pb-0">
              <div>
                <div className="flex h-8 items-center">
                  <Tooltip content="Copy account address">
                    <LinkButton
                      className="flex items-center text-th-fgd-4 no-underline"
                      onClick={() =>
                        handleCopyAddress(mangoAccount.publicKey.toString())
                      }
                    >
                      <h1>
                        {mangoAccount?.name ||
                          abbreviateAddress(mangoAccount.publicKey)}
                      </h1>
                      <DuplicateIcon className="ml-1.5 h-5 w-5" />
                    </LinkButton>
                  </Tooltip>
                  {isCopied ? (
                    <span className="ml-2 rounded bg-th-bkg-3 px-1.5 py-0.5 text-xs">
                      Copied
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center text-xxs text-th-fgd-4">
                  <ExclamationCircleIcon className="mr-1.5 h-4 w-4" />
                  {t('account-address-warning')}
                </div>
                {pubkey && mangoAccount ? (
                  profileData && !loadProfileDetails ? (
                    <Link
                      href={`/profile?name=${profileData?.profile_name.replace(
                        /\s/g,
                        '-'
                      )}`}
                      shallow={true}
                    >
                      <a className="default-transition mt-2 flex items-center space-x-2 text-th-fgd-3 hover:text-th-fgd-2">
                        <ProfileImage
                          imageSize="24"
                          placeholderSize="12"
                          publicKey={mangoAccount.owner.toString()}
                        />
                        <span className="mb-0 capitalize">
                          {profileData?.profile_name}
                        </span>
                      </a>
                    </Link>
                  ) : (
                    <div className="mt-2 h-7 w-40 animate-pulse rounded bg-th-bkg-3" />
                  )
                ) : null}
              </div>
            </div>
            {!pubkey ? (
              <div className="flex items-center space-x-2">
                <Button
                  className="flex h-8 w-full items-center justify-center rounded-full px-3 py-0 text-xs"
                  disabled={mngoAccrued.eq(ZERO_BN)}
                  onClick={handleRedeemMngo}
                >
                  <div className="flex items-center whitespace-nowrap">
                    <GiftIcon className="mr-1.5 h-4 w-4 flex-shrink-0" />
                    {!mngoAccrued.eq(ZERO_BN) && mangoGroup
                      ? t('claim-x-mngo', {
                          amount: nativeToUi(
                            mngoAccrued.toNumber(),
                            mangoGroup.tokens[MNGO_INDEX].decimals
                          ).toLocaleString(undefined, {
                            minimumSignificantDigits: 1,
                          }),
                        })
                      : t('zero-mngo-rewards')}
                  </div>
                </Button>
                <Menu>
                  {({ open }) => (
                    <div className="relative sm:w-full">
                      <Menu.Button className="flex h-8 items-center justify-center rounded-full border border-th-fgd-4 bg-transparent pt-0 pb-0 pl-3 pr-2 text-xs font-bold text-th-fgd-2 hover:brightness-[1.1] hover:filter sm:w-full">
                        {t('more')}
                        <ChevronDownIcon
                          className={`default-transition h-5 w-5 ${
                            open
                              ? 'rotate-180 transform'
                              : 'rotate-360 transform'
                          }`}
                        />
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
                        <Menu.Items className="absolute right-0 z-20 mt-1 w-full space-y-1.5 rounded-md bg-th-bkg-3 px-4 py-2.5 sm:w-48">
                          <Menu.Item>
                            <button
                              className="flex w-full flex-row items-center rounded-none py-0.5 font-normal focus:outline-none md:hover:cursor-pointer md:hover:text-th-primary"
                              onClick={() => setShowAlertsModal(true)}
                            >
                              <div className="flex items-center">
                                <BellIcon className="mr-1.5 h-4 w-4" />
                                {t('alerts')}
                              </div>
                            </button>
                          </Menu.Item>
                          {!isDelegatedAccount ? (
                            <Menu.Item>
                              <button
                                className="flex w-full flex-row items-center rounded-none py-0.5 font-normal focus:outline-none md:hover:cursor-pointer md:hover:text-th-primary"
                                onClick={() => setShowDelegateModal(true)}
                              >
                                <div className="flex items-center">
                                  <UsersIcon className="mr-1.5 h-4 w-4" />
                                  {t('delegate:set-delegate')}
                                </div>
                              </button>
                            </Menu.Item>
                          ) : null}
                          <Menu.Item>
                            <button
                              className="flex w-full flex-row items-center rounded-none py-0.5 font-normal focus:outline-none md:hover:cursor-pointer md:hover:text-th-primary"
                              onClick={() => setShowAccountsModal(true)}
                            >
                              <div className="flex items-center">
                                <SwitchHorizontalIcon className="mr-1.5 h-4 w-4" />
                                {t('change-account')}
                              </div>
                            </button>
                          </Menu.Item>
                          {!isDelegatedAccount ? (
                            <Menu.Item>
                              <button
                                className="flex w-full flex-row items-center rounded-none py-0.5 font-normal focus:outline-none md:hover:cursor-pointer md:hover:text-th-primary"
                                onClick={() => setShowCloseAccountModal(true)}
                              >
                                <div className="flex items-center whitespace-nowrap">
                                  <TrashIcon className="mr-1.5 h-4 w-4 flex-shrink-0" />
                                  {t('close-account:close-account')}
                                </div>
                              </button>
                            </Menu.Item>
                          ) : null}
                        </Menu.Items>
                      </Transition>
                    </div>
                  )}
                </Menu>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
      <div>
        {mangoAccount ? (
          !isMobile ? (
            <div className="mt-2">
              <Tabs
                activeTab={activeTab}
                onChange={handleTabChange}
                tabs={TABS}
              />
              <TabContent activeTab={activeTab} />
            </div>
          ) : (
            <div className="mt-2">
              <SwipeableTabs
                onChange={handleChangeViewIndex}
                items={TABS}
                tabIndex={viewIndex}
                width="w-40 sm:w-48"
              />
              <Swipeable
                index={viewIndex}
                onChangeIndex={handleChangeViewIndex}
              >
                <div>
                  <AccountOverview />
                </div>
                <div>
                  <AccountOrders />
                </div>
                <div>
                  <AccountHistory />
                </div>
                <div>
                  <AccountPerformancePerToken />
                </div>
              </Swipeable>
            </div>
          )
        ) : isLoading && (connected || pubkey) ? (
          <div className="flex justify-center py-10">
            <Loading />
          </div>
        ) : connected ? (
          <div className="-mt-4 rounded-lg border border-th-bkg-3 p-4 md:p-6">
            <EmptyState
              buttonText={t('create-account')}
              icon={<CurrencyDollarIcon />}
              onClickButton={() => setShowAccountsModal(true)}
              title={t('no-account-found')}
              disabled={!wallet || !mangoGroup}
            />
          </div>
        ) : (
          <div className="-mt-4 rounded-lg border border-th-bkg-3 p-4 md:p-6">
            <EmptyState
              buttonText={t('connect')}
              desc={t('connect-view')}
              disabled={!wallet || !mangoGroup}
              icon={<LinkIcon />}
              onClickButton={handleConnect}
              title={t('connect-wallet')}
            />
            {!connected && !pubkey ? (
              <div className="flex flex-col items-center pt-2">
                <p>OR</p>
                <MangoAccountLookup />
              </div>
            ) : null}
          </div>
        )}
      </div>

      {showAccountsModal ? (
        <AccountsModal
          onClose={handleCloseAccounts}
          isOpen={showAccountsModal}
        />
      ) : null}
      {showNameModal ? (
        <AccountNameModal
          accountName={mangoAccount?.name}
          isOpen={showNameModal}
          onClose={handleCloseNameModal}
        />
      ) : null}
      {showCloseAccountModal ? (
        <CloseAccountModal
          isOpen={showCloseAccountModal}
          onClose={handleCloseCloseAccountModal}
        />
      ) : null}
      {showAlertsModal ? (
        <CreateAlertModal
          isOpen={showAlertsModal}
          onClose={handleCloseAlertModal}
        />
      ) : null}
      {showDelegateModal ? (
        <DelegateModal
          delegate={mangoAccount?.delegate}
          isOpen={showDelegateModal}
          onClose={handleCloseDelegateModal}
        />
      ) : null}
      {showProfilePicModal ? (
        <NftProfilePicModal
          isOpen={showProfilePicModal}
          onClose={handleCloseProfilePicModal}
        />
      ) : null}
    </div>
  )
}

const TabContent = ({ activeTab }) => {
  switch (activeTab) {
    case 'Overview':
      return <AccountOverview />
    case 'Orders':
      return <AccountOrders />
    case 'History':
      return <AccountHistory />
    case 'Performance':
      return <AccountPerformancePerToken />
    default:
      return <AccountOverview />
  }
}
