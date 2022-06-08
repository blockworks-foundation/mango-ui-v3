import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  BellIcon,
  CurrencyDollarIcon,
  DuplicateIcon,
  ExclamationCircleIcon,
  GiftIcon,
  LinkIcon,
  PencilIcon,
  SwitchHorizontalIcon,
  TrashIcon,
  UsersIcon,
} from '@heroicons/react/outline'
import { ChevronDownIcon } from '@heroicons/react/solid'
import { nativeToUi, ZERO_BN } from '@blockworks-foundation/mango-client'
import useMangoStore, { serumProgramId, MNGO_INDEX } from 'stores/useMangoStore'
import PageBodyContainer from 'components/PageBodyContainer'
import TopBar from 'components/TopBar'
import AccountOrders from 'components/account_page/AccountOrders'
import AccountHistory from 'components/account_page/AccountHistory'
import AccountsModal from 'components/AccountsModal'
import AccountOverview from 'components/account_page/AccountOverview'
import AccountInterest from 'components/account_page/AccountInterest'
import AccountFunding from 'components/account_page/AccountFunding'
import AccountPerformancePerToken from 'components/account_page/AccountPerformancePerToken'
import AccountNameModal from 'components/AccountNameModal'
import { IconButton, LinkButton } from 'components/Button'
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
import { copyToClipboard } from 'utils'
import DelegateModal from 'components/DelegateModal'
import { Menu, Transition } from '@headlessui/react'
import { useWallet } from '@solana/wallet-adapter-react'
import { handleWalletConnect } from 'components/ConnectWalletButton'
import { MangoAccountLookup } from 'components/account_page/MangoAccountLookup'
import NftProfilePicModal from 'components/NftProfilePicModal'
import ProfileImage from 'components/ProfileImage'
import SwipeableTabs from 'components/mobile/SwipeableTabs'

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

const TABS = [
  'Overview',
  'Orders',
  'History',
  'Interest',
  'Funding',
  'Performance',
]

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
  const loadingTransaction = useMangoStore(
    (s) => s.wallet.nfts.loadingTransaction
  )

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

  return (
    <div className={`bg-th-bkg-1 text-th-fgd-1 transition-all`}>
      <TopBar />
      <PageBodyContainer>
        <div className="flex flex-col pt-4 pb-6 md:flex-row md:items-end md:justify-between md:pb-4 md:pt-10">
          {mangoAccount ? (
            <>
              <div className="flex flex-col pb-3 sm:flex-row sm:items-center md:pb-0">
                <button
                  disabled={!!pubkey}
                  className={`relative mb-2 mr-4 flex h-20 w-20 items-center justify-center rounded-full sm:mb-0 ${
                    loadingTransaction
                      ? 'animate-pulse bg-th-bkg-4'
                      : 'bg-th-bkg-button'
                  }`}
                  onClick={() => setShowProfilePicModal(true)}
                >
                  <ProfileImage
                    thumbHeightClass="h-20"
                    thumbWidthClass="w-20"
                    placeholderHeightClass="h-12"
                    placeholderWidthClass="w-12"
                  />
                  <div className="default-transition absolute bottom-0 top-0 left-0 right-0 flex h-full w-full items-center justify-center rounded-full bg-[rgba(0,0,0,0.6)] opacity-0 hover:opacity-100">
                    <PencilIcon className="h-5 w-5 text-th-fgd-1" />
                  </div>
                </button>
                <div>
                  <div className="mb-1 flex items-center">
                    <h1 className={`mr-3`}>
                      {mangoAccount?.name || t('account')}
                    </h1>
                    {!pubkey ? (
                      <IconButton
                        className="h-7 w-7"
                        onClick={() => setShowNameModal(true)}
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                      </IconButton>
                    ) : null}
                  </div>
                  <div className="flex h-4 items-center">
                    <LinkButton
                      className="flex items-center text-th-fgd-4 no-underline"
                      onClick={() =>
                        handleCopyAddress(mangoAccount.publicKey.toString())
                      }
                    >
                      <span className="text-xxs font-normal sm:text-xs">
                        {mangoAccount.publicKey.toBase58()}
                      </span>
                      <DuplicateIcon className="ml-1.5 h-4 w-4" />
                    </LinkButton>
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
                </div>
              </div>
              {!pubkey ? (
                <div className="flex items-center space-x-2">
                  <button
                    className="flex h-8 w-full items-center justify-center rounded-full bg-th-primary px-3 py-0 text-xs font-bold text-th-bkg-1 focus:outline-none disabled:cursor-not-allowed disabled:bg-th-bkg-4 disabled:text-th-fgd-4"
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
                  </button>
                  <Menu>
                    {({ open }) => (
                      <div className="relative sm:w-full">
                        <Menu.Button className="flex h-8 items-center justify-center rounded-full bg-th-bkg-button pt-0 pb-0 pl-3 pr-2 text-xs font-bold hover:brightness-[1.1] hover:filter sm:w-full">
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
        <div className="md:rounded-lg md:bg-th-bkg-2 md:p-6">
          {mangoAccount ? (
            !isMobile ? (
              <>
                <Tabs
                  activeTab={activeTab}
                  onChange={handleTabChange}
                  tabs={TABS}
                />
                <TabContent activeTab={activeTab} />
              </>
            ) : (
              <>
                <SwipeableTabs
                  onChange={handleChangeViewIndex}
                  items={TABS}
                  tabIndex={viewIndex}
                  width="w-24 sm:w-32"
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
                    <AccountInterest />
                  </div>
                  <div>
                    <AccountFunding />
                  </div>
                  <div>
                    <AccountPerformancePerToken />
                  </div>
                </Swipeable>
              </>
            )
          ) : connected ? (
            isLoading ? (
              <div className="flex justify-center py-10">
                <Loading />
              </div>
            ) : (
              <EmptyState
                buttonText={t('create-account')}
                icon={<CurrencyDollarIcon />}
                onClickButton={() => setShowAccountsModal(true)}
                title={t('no-account-found')}
                disabled={!wallet || !mangoGroup}
              />
            )
          ) : (
            <EmptyState
              buttonText={t('connect')}
              desc={t('connect-view')}
              disabled={!wallet || !mangoGroup}
              icon={<LinkIcon />}
              onClickButton={handleConnect}
              title={t('connect-wallet')}
            />
          )}
        </div>
        {!connected && (
          <div className="mt-6 md:mt-3 md:rounded-lg md:bg-th-bkg-2 md:p-6">
            <MangoAccountLookup />
          </div>
        )}
      </PageBodyContainer>
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
    case 'Interest':
      return <AccountInterest />
    case 'Funding':
      return <AccountFunding />
    case 'Performance':
      return <AccountPerformancePerToken />
    default:
      return <AccountOverview />
  }
}
