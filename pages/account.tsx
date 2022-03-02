import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BellIcon,
  CurrencyDollarIcon,
  DuplicateIcon,
  ExclamationCircleIcon,
  GiftIcon,
  LinkIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
} from '@heroicons/react/outline'
import { nativeToUi, ZERO_BN } from '@blockworks-foundation/mango-client'
import useMangoStore, {
  serumProgramId,
  MNGO_INDEX,
} from '../stores/useMangoStore'
import PageBodyContainer from '../components/PageBodyContainer'
import TopBar from '../components/TopBar'
import AccountOrders from '../components/account_page/AccountOrders'
import AccountHistory from '../components/account_page/AccountHistory'
import AccountsModal from '../components/AccountsModal'
import AccountOverview from '../components/account_page/AccountOverview'
import AccountInterest from '../components/account_page/AccountInterest'
import AccountFunding from '../components/account_page/AccountFunding'
import AccountNameModal from '../components/AccountNameModal'
import Button, { IconButton, LinkButton } from '../components/Button'
import EmptyState from '../components/EmptyState'
import Loading from '../components/Loading'
import Swipeable from '../components/mobile/Swipeable'
import Tabs from '../components/Tabs'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from '../components/TradePageGrid'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import Select from '../components/Select'
import { useRouter } from 'next/router'
import { PublicKey } from '@solana/web3.js'
import CloseAccountModal from '../components/CloseAccountModal'
import { notify } from '../utils/notifications'
import {
  actionsSelector,
  mangoAccountSelector,
  mangoGroupSelector,
  walletConnectedSelector,
} from '../stores/selectors'
import CreateAlertModal from '../components/CreateAlertModal'
import { copyToClipboard } from '../utils'
import DelegateModal from '../components/DelegateModal'

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'common',
        'close-account',
        'delegate',
        'alerts',
      ])),
      // Will be passed to the page component as props
    },
  }
}

const TABS = ['Portfolio', 'Orders', 'History', 'Interest', 'Funding']

export default function Account() {
  const { t } = useTranslation(['common', 'close-account', 'delegate'])
  const { width } = useViewport()
  const router = useRouter()

  const connected = useMangoStore(walletConnectedSelector)
  const mangoAccount = useMangoStore(mangoAccountSelector)
  const mangoClient = useMangoStore((s) => s.connection.client)
  const mangoGroup = useMangoStore(mangoGroupSelector)
  const wallet = useMangoStore((s) => s.wallet.current)
  const isLoading = useMangoStore((s) => s.selectedMangoAccount.initialLoad)
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

  const isMobile = width ? width < breakpoints.sm : false
  const { pubkey } = router.query
  const isDelegatedAccount = wallet?.publicKey
    ? !mangoAccount?.owner?.equals(wallet?.publicKey)
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

  useEffect(() => {
    async function loadUnownedMangoAccount() {
      try {
        const unownedMangoAccountPubkey = new PublicKey(pubkey)
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
    if (connected) {
      router.push('/account')
    }
  }, [connected])

  useEffect(() => {
    const handleRouteChange = () => {
      if (resetOnLeave) {
        setMangoStore((state) => {
          state.selectedMangoAccount.current = undefined
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

  const handleRedeemMngo = async () => {
    const wallet = useMangoStore.getState().wallet.current
    const mngoNodeBank =
      mangoGroup.rootBankAccounts[MNGO_INDEX].nodeBankAccounts[0]

    try {
      const txid = await mangoClient.redeemAllMngo(
        mangoGroup,
        mangoAccount,
        wallet,
        mangoGroup.tokens[MNGO_INDEX].rootBank,
        mngoNodeBank.publicKey,
        mngoNodeBank.vault
      )
      actions.reloadMangoAccount()
      setMngoAccrued(ZERO_BN)
      notify({
        title: t('redeem-success'),
        description: '',
        txid,
      })
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
        <div className="flex flex-col md:flex-row md:items-end md:justify-between py-4 md:pb-4 md:pt-10">
          {mangoAccount ? (
            <>
              <div className="pb-3 md:pb-0">
                <div className="flex items-center mb-1">
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
                    className="flex items-center no-underline text-th-fgd-4"
                    onClick={() =>
                      handleCopyAddress(mangoAccount.publicKey.toString())
                    }
                  >
                    <span className="text-xxs sm:text-xs font-normal">
                      {mangoAccount.publicKey.toBase58()}
                    </span>
                    <DuplicateIcon className="h-4 w-4 ml-1.5" />
                  </LinkButton>
                  {isCopied ? (
                    <span className="bg-th-bkg-3 ml-2 px-1.5 py-0.5 rounded text-xs">
                      Copied
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center text-th-fgd-4 text-xxs">
                  <ExclamationCircleIcon className="h-4 mr-1.5 w-4" />
                  {t('account-address-warning')}
                </div>
              </div>
              {!pubkey ? (
                <div className="flex flex-col sm:flex-row items-center pb-1.5 space-y-2 sm:space-y-0 sm:space-x-2">
                  <button
                    className="bg-th-primary flex font-bold items-center justify-center h-8 text-th-bkg-1 text-xs px-3 py-0 rounded-full w-full hover:brightness-[1.15] focus:outline-none disabled:bg-th-bkg-4 disabled:text-th-fgd-4 disabled:cursor-not-allowed disabled:hover:brightness-100"
                    disabled={mngoAccrued.eq(ZERO_BN)}
                    onClick={handleRedeemMngo}
                  >
                    <div className="flex items-center whitespace-nowrap">
                      <GiftIcon className="flex-shrink-0 h-4 w-4 mr-1.5" />
                      {!mngoAccrued.eq(ZERO_BN)
                        ? `Claim ${nativeToUi(
                            mngoAccrued.toNumber(),
                            mangoGroup.tokens[MNGO_INDEX].decimals
                          ).toLocaleString(undefined, {
                            minimumSignificantDigits: 1,
                          })} MNGO`
                        : '0 MNGO Rewards'}
                    </div>
                  </button>
                  {!isDelegatedAccount ? (
                    <Button
                      className="flex items-center justify-center pt-0 pb-0 h-8 pl-3 pr-3 text-xs w-full"
                      onClick={() => setShowCloseAccountModal(true)}
                    >
                      <div className="flex items-center whitespace-nowrap">
                        <TrashIcon className="flex-shrink-0 h-4 w-4 mr-1.5" />
                        {t('close-account:close-account')}
                      </div>
                    </Button>
                  ) : null}
                  <Button
                    className="flex items-center justify-center pt-0 pb-0 h-8 pl-3 pr-3 text-xs w-full"
                    onClick={() => setShowAlertsModal(true)}
                  >
                    <div className="flex items-center">
                      <BellIcon className="h-4 w-4 mr-1.5" />
                      {t('alerts')}
                    </div>
                  </Button>
                  {!isDelegatedAccount && (
                    <Button
                      className="col-span-1 flex items-center justify-center pt-0 pb-0 h-8 pl-3 pr-3 text-xs"
                      onClick={() => setShowDelegateModal(true)}
                    >
                      <div className="flex items-center">
                        <UsersIcon className="h-4 w-4 mr-1.5" />
                        {t('delegate:set-delegate')}
                      </div>
                    </Button>
                  )}
                </div>
              ) : null}
            </>
          ) : null}
        </div>
        <div className="bg-th-bkg-2 p-4 sm:p-6 rounded-lg">
          {mangoAccount ? (
            !isMobile ? (
              <Tabs
                activeTab={activeTab}
                onChange={handleTabChange}
                tabs={TABS}
              />
            ) : (
              <div className="pb-2 pt-3">
                <Select
                  value={t(TABS[viewIndex].toLowerCase())}
                  onChange={(e) => handleChangeViewIndex(e)}
                >
                  {TABS.map((tab, index) => (
                    <Select.Option key={index + tab} value={index}>
                      {t(tab.toLowerCase())}
                    </Select.Option>
                  ))}
                </Select>
              </div>
            )
          ) : null}
          {mangoAccount ? (
            !isMobile ? (
              <TabContent activeTab={activeTab} />
            ) : (
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
              </Swipeable>
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
              />
            )
          ) : (
            <EmptyState
              buttonText={t('connect')}
              desc={t('connect-view')}
              icon={<LinkIcon />}
              onClickButton={() => wallet.connect()}
              title={t('connect-wallet')}
            />
          )}
        </div>
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
    </div>
  )
}

const TabContent = ({ activeTab }) => {
  switch (activeTab) {
    case 'Portfolio':
      return <AccountOverview />
    case 'Orders':
      return <AccountOrders />
    case 'History':
      return <AccountHistory />
    case 'Interest':
      return <AccountInterest />
    case 'Funding':
      return <AccountFunding />
    default:
      return <AccountOverview />
  }
}
