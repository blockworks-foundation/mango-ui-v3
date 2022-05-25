import { MangoAccountLayout } from '@blockworks-foundation/mango-client'
import {
  // CalendarIcon,
  ChevronRightIcon,
  UserGroupIcon,
  // MailIcon,
  ArrowSmDownIcon,
  ArrowSmUpIcon,
  LinkIcon,
} from '@heroicons/react/outline'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { ElementTitle } from 'components'
import Button from 'components/Button'
import MangoAccountCard, {
  numberCurrencyCompacter,
} from 'components/MangoAccountCard'
import Modal from 'components/Modal'
import Input from 'components/Input'
import PageBodyContainer from 'components/PageBodyContainer'
import ProfileImage from 'components/ProfileImage'
import ProfileImageButton from 'components/ProfileImageButton'
import SelectMangoAccount from 'components/SelectMangoAccount'
import Tabs from 'components/Tabs'
import TopBar from 'components/TopBar'
import dayjs from 'dayjs'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import useMangoStore from 'stores/useMangoStore'
import { abbreviateAddress, formatUsdValue } from 'utils'
import { notify } from 'utils/notifications'
import { Label } from 'components'
import Select from 'components/Select'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from '../components/TradePageGrid'
import EmptyState from 'components/EmptyState'
import { handleWalletConnect } from 'components/ConnectWalletButton'

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
      // Will be passed to the page component as props
    },
  }
}

const TABS = ['following', 'followers']

export default function Profile() {
  const { t } = useTranslation(['common', 'profile'])
  const [profileData, setProfileData] = useState<any>(null)
  const [walletMangoAccounts, setWalletMangoAccounts] = useState<any[]>([])
  const [walletMangoAccountsStats, setWalletMangoAccountsStats] = useState<
    any[]
  >([])
  const [following, setFollowing] = useState<any[]>([])
  const [followers, setFollowers] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('following')
  const [loadFollowing, setLoadFollowing] = useState(false)
  const [loadFollowers, setLoadFollowers] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoClient = useMangoStore((s) => s.connection.client)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const { publicKey, connected, wallet } = useWallet()
  const router = useRouter()
  const { pk } = router.query
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.md : false

  const handleConnect = useCallback(() => {
    if (wallet) {
      handleWalletConnect(wallet)
    }
  }, [wallet])

  const profilePk = useMemo(() => {
    return pk ? pk : publicKey ? publicKey.toString() : ''
  }, [pk, publicKey])

  useEffect(() => {
    const getProfile = async () => {
      try {
        const response = await fetch(
          `https://mango-transaction-log.herokuapp.com/v3/user-data/settings?wallet-pk=${profilePk}`
        )
        const data = await response.json()
        setProfileData(data)
      } catch (e) {
        console.log(e)
      }
    }
    if (profilePk) {
      getProfile()
    }
  }, [profilePk])

  useEffect(() => {
    if (mangoGroup && profilePk) {
      fetchFollowing()
    }
  }, [mangoGroup, profilePk])

  useEffect(() => {
    if (profilePk) {
      fetchFollowers()
    }
  }, [profilePk])

  useEffect(() => {
    if (profilePk && mangoGroup) {
      const getProfileAccounts = async () => {
        const accounts = await fetchAllMangoAccounts(new PublicKey(profilePk))
        if (accounts) {
          setWalletMangoAccounts(accounts)
          const accountsStats: any[] = []
          for (const acc of accounts) {
            const stats = await fetchAccountStats(acc.publicKey.toString())
            accountsStats.push({
              mangoAccount: acc.publicKey.toString(),
              stats,
            })
          }
          setWalletMangoAccountsStats(accountsStats)
        }
      }
      getProfileAccounts()
    }
  }, [profilePk, mangoGroup])

  const fetchFollowers = async () => {
    if (!publicKey && !pk) return
    const profilePk = pk ? pk : publicKey ? publicKey?.toString() : null
    setLoadFollowers(true)
    try {
      const followerRes = await fetch(
        `https://mango-transaction-log.herokuapp.com/v3/user-data/followers?wallet-pk=${profilePk}`
      )
      const parsedResponse = await followerRes.json()
      if (parsedResponse.length > 0) {
        setFollowers(parsedResponse)
        setLoadFollowers(false)
      } else {
        setLoadFollowers(false)
      }
    } catch {
      notify({
        type: 'error',
        title: 'Unable to load following',
      })
    }
  }

  const fetchFollowing = async () => {
    if (!mangoGroup || !profilePk) return
    setLoadFollowing(true)
    try {
      const followingInfo: any[] = []
      const followingRes = await fetch(
        `https://mango-transaction-log.herokuapp.com/v3/user-data/following?wallet-pk=${profilePk}`
      )
      const parsedResponse = await followingRes.json()
      for (let i = 0; i < parsedResponse.length; i++) {
        const pk = new PublicKey(parsedResponse[i].mango_account)
        const mangoAccount = await mangoClient.getMangoAccount(
          pk,
          mangoGroup?.dexProgramId
        )
        const stats = await fetchAccountStats(parsedResponse[i].mango_account)
        followingInfo.push({
          ...parsedResponse[i],
          mango_account: mangoAccount,
          stats,
        })
      }
      setFollowing(followingInfo)
      setLoadFollowing(false)
    } catch {
      notify({
        type: 'error',
        title: 'Unable to load following',
      })
    }
  }

  const fetchAccountStats = async (pk) => {
    const response = await fetch(
      `https://mango-transaction-log.herokuapp.com/v3/stats/account-performance-detailed?mango-account=${pk}&start-date=${dayjs()
        .subtract(1, 'day')
        .format('YYYY-MM-DD')}`
    )
    const parsedResponse = await response.json()
    const entries: any = Object.entries(parsedResponse).sort((a, b) =>
      b[0].localeCompare(a[0])
    )

    const stats = entries
      .map(([key, value]) => {
        return { ...value, time: key }
      })
      .filter((x) => x)

    return stats
  }

  const fetchAllMangoAccounts = async (walletPk) => {
    if (!walletPk || !mangoGroup) return

    const delegateFilter = [
      {
        memcmp: {
          offset: MangoAccountLayout.offsetOf('delegate'),
          bytes: walletPk.toBase58(),
        },
      },
    ]
    const accountSorter = (a, b) =>
      a.publicKey.toBase58() > b.publicKey.toBase58() ? 1 : -1

    return Promise.all([
      mangoClient.getMangoAccountsForOwner(mangoGroup, walletPk, true),
      mangoClient.getAllMangoAccounts(mangoGroup, delegateFilter, false),
    ])
      .then((values) => {
        const [mangoAccounts, delegatedAccounts] = values
        if (mangoAccounts.length + delegatedAccounts.length > 0) {
          const sortedAccounts = mangoAccounts
            .slice()
            .sort(accountSorter)
            .concat(delegatedAccounts.sort(accountSorter))
          return sortedAccounts
        }
      })
      .catch((err) => {
        notify({
          type: 'error',
          title: 'Unable to load mango account',
          description: err.message,
        })
        console.log('Could not get margin accounts for wallet', err)
      })
  }

  const handleTabChange = (tabName) => {
    setActiveTab(tabName)
  }

  const canEdit = useMemo(() => {
    if (publicKey) {
      return (
        publicKey.toString() === profileData?.wallet_pk ||
        publicKey.toString() === pk
      )
    }
    return false
  }, [publicKey, profileData])

  const totalValue = useMemo(() => {
    return walletMangoAccounts.reduce((a, c) => {
      const value = c.computeValue(mangoGroup, mangoCache)
      return a + Number(value)
    }, 0)
  }, [walletMangoAccounts.length])

  const totalPnl = useMemo(() => {
    return walletMangoAccountsStats.reduce((a, c) => {
      const value = c.stats.length > 0 ? c.stats[0].pnl : 0
      return a + value
    }, 0)
  }, [walletMangoAccountsStats.length])

  return (
    <div className={`bg-th-bkg-1 text-th-fgd-1 transition-all`}>
      <TopBar />
      <PageBodyContainer>
        <div className="flex flex-col pt-8 pb-3 sm:flex-row sm:items-center sm:justify-between sm:pb-6 md:pt-10">
          <div className="mb-4 flex w-full items-center justify-between">
            <h1 className={`text-2xl font-semibold text-th-fgd-1 sm:mb-0`}>
              Profile
            </h1>
            <Button className="flex items-center">
              <UserGroupIcon className="mr-2 h-5 w-5" />
              Browse Profiles
            </Button>
          </div>
        </div>
        {connected || pk ? (
          <div className="md:rounded-lg md:bg-th-bkg-2 md:p-6">
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-8">
                <div className="mb-8 flex items-start justify-between rounded-lg ">
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <ProfileImageButton
                      imageSize="80"
                      placeholderSize="40"
                      disabled={
                        !connected ||
                        profileData?.wallet_pk !== publicKey?.toString()
                      }
                      publicKey={profileData?.wallet_pk || pk}
                    />
                    <div>
                      <h2 className="mb-2">{profileData?.profile_name}</h2>
                      <div className="mb-1.5 flex items-center space-x-3">
                        <div className="w-max rounded-full px-2 py-1 text-xs text-th-fgd-4 ring-1 ring-inset ring-th-fgd-4">
                          Market Maker
                        </div>
                        {/* <div className="flex items-center space-x-1.5">
                          <CalendarIcon className="h-4 w-4 text-th-fgd-3" />
                          <p className="mb-0">Joined April 2020</p>
                        </div> */}
                      </div>
                      <div className="flex space-x-4">
                        {!loadFollowing ? (
                          <p className="mb-0 font-bold text-th-fgd-1">
                            {following.length}{' '}
                            <span className="font-normal text-th-fgd-4">
                              Following
                            </span>
                          </p>
                        ) : (
                          <div className="h-5 w-20 animate-pulse rounded bg-th-bkg-3" />
                        )}
                        {!loadFollowers ? (
                          <p className="mb-0 font-bold text-th-fgd-1">
                            {followers.length}{' '}
                            <span className="font-normal text-th-fgd-4">
                              Followers
                            </span>
                          </p>
                        ) : (
                          <div className="h-5 w-20 animate-pulse rounded bg-th-bkg-3" />
                        )}
                      </div>
                    </div>
                  </div>
                  {canEdit ? (
                    <Button onClick={() => setShowEditProfile(true)}>
                      Edit
                    </Button>
                  ) : publicKey ? (
                    <></>
                  ) : // <IconButton className="h-10 w-10">
                  //   <MailIcon className="h-5 w-5" />
                  // </IconButton>
                  null}
                </div>
                <div className="mb-8 grid grid-flow-col grid-cols-1 grid-rows-2 border-b border-th-bkg-4 md:grid-cols-2 md:grid-rows-1 md:gap-4">
                  <div className="border-t border-th-bkg-4 p-3 sm:p-4 md:border-b">
                    <div className="pb-0.5 text-th-fgd-3">Total Value</div>
                    <div className="text-xl font-bold text-th-fgd-1 md:text-2xl">
                      {formatUsdValue(totalValue)}
                    </div>
                  </div>
                  <div className="border-t border-th-bkg-4 p-3 sm:p-4 md:border-b">
                    <div className="pb-0.5 text-th-fgd-3">Total PnL</div>
                    <div className="text-xl font-bold text-th-fgd-1 md:text-2xl">
                      {formatUsdValue(totalPnl)}
                    </div>
                  </div>
                </div>
                {isMobile ? (
                  <div className="pb-8">
                    <Accounts
                      accounts={walletMangoAccounts}
                      accountsStats={walletMangoAccountsStats}
                      canEdit={canEdit}
                    />
                  </div>
                ) : null}
                <Tabs
                  activeTab={activeTab}
                  onChange={handleTabChange}
                  tabs={TABS}
                />
                <div className="space-y-2">
                  {activeTab === 'following'
                    ? following.map((user, i) => {
                        const accountEquity = user.mango_account.computeValue(
                          mangoGroup,
                          mangoCache
                        )
                        const pnl: number =
                          user.stats.length > 0 ? user.stats[0].pnl : 0
                        return loadFollowing ? (
                          <div
                            className="h-24 animate-pulse rounded-md bg-th-bkg-3"
                            key={i}
                          />
                        ) : (
                          <div
                            className="relative"
                            key={user.mango_account.publicKey.toString()}
                          >
                            <button
                              className="absolute bottom-4 left-20 flex items-center space-x-2 rounded-full bg-th-bkg-button px-2 py-1 hover:brightness-[1.1] hover:filter"
                              onClick={() =>
                                router.push(
                                  `/profile?pk=${user.wallet_pk}`,
                                  undefined,
                                  { shallow: true }
                                )
                              }
                            >
                              <p className="mb-0 text-xs text-th-fgd-3">
                                {user.profile_name}
                              </p>
                            </button>
                            <a
                              className="default-transition block flex h-[104px] w-full rounded-md bg-th-bkg-3 p-4 hover:bg-th-bkg-4 sm:h-[88px] sm:justify-between sm:pb-4"
                              href={`https://trade.mango.markets/account?pubkey=${user.mango_account.publicKey.toString()}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <div className="my-auto">
                                <ProfileImage
                                  imageSize="56"
                                  placeholderSize="32"
                                  publicKey={user.wallet_pk}
                                />
                              </div>
                              <div className="ml-3 flex flex-col sm:flex-grow sm:flex-row sm:justify-between">
                                <p className="mb-0 font-bold text-th-fgd-1">
                                  {user.mango_account.name
                                    ? user.mango_account.name
                                    : abbreviateAddress(
                                        user.mango_account.publicKey
                                      )}
                                </p>
                                <div className="flex items-center">
                                  <p className="mb-0">
                                    {formatUsdValue(accountEquity.toNumber())}
                                  </p>
                                  <span className="pl-2 pr-1 text-th-fgd-4">
                                    |
                                  </span>
                                  <span
                                    className={`flex items-center ${
                                      pnl < 0 ? 'text-th-red' : 'text-th-green'
                                    }`}
                                  >
                                    {pnl < 0 ? (
                                      <ArrowSmDownIcon className="mr-0.5 h-5 w-5" />
                                    ) : (
                                      <ArrowSmUpIcon className="mr-0.5 h-5 w-5" />
                                    )}
                                    {numberCurrencyCompacter.format(pnl)}
                                  </span>
                                </div>
                              </div>
                              <div className="my-auto ml-auto">
                                <ChevronRightIcon className="ml-2 mt-0.5 h-5 w-5 text-th-fgd-3" />
                              </div>
                            </a>
                          </div>
                        )
                      })
                    : null}
                  {activeTab === 'followers'
                    ? followers.map((user) => {
                        return (
                          <button
                            className="default-transition block flex w-full items-center justify-between rounded-md bg-th-bkg-3 p-4 hover:bg-th-bkg-4"
                            onClick={() =>
                              router.push(
                                `/profile?pk=${user.wallet_pk}`,
                                undefined,
                                { shallow: true }
                              )
                            }
                            key={user.wallet_pk}
                          >
                            <ProfileImage
                              imageSize="56"
                              placeholderSize="32"
                              publicKey={user.wallet_pk}
                            />
                            <p className="mb-0 ml-3 font-bold text-th-fgd-1">
                              {user.profile_name}
                            </p>
                            <div className="my-auto ml-auto">
                              <ChevronRightIcon className="ml-2 mt-0.5 h-5 w-5 text-th-fgd-3" />
                            </div>
                          </button>
                        )
                      })
                    : null}
                </div>
              </div>
              {!isMobile ? (
                <div className="col-span-4">
                  <Accounts
                    accounts={walletMangoAccounts}
                    accountsStats={walletMangoAccountsStats}
                    canEdit={canEdit}
                  />
                </div>
              ) : null}
            </div>
          </div>
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
      </PageBodyContainer>
      {showEditProfile ? (
        <EditProfileModal
          isOpen={showEditProfile}
          onClose={() => setShowEditProfile(false)}
          profile={profileData}
        />
      ) : null}
    </div>
  )
}

const TRADER_CATEGORIES = [
  'day-trader',
  'degen',
  'discretionary',
  'market-maker',
  'swing-trader',
  'yolo',
]

const EditProfileModal = ({
  isOpen,
  onClose,
  profile,
}: {
  isOpen: boolean
  onClose: () => void
  profile?: any
}) => {
  const { t } = useTranslation(['common', 'profile'])
  const [profileName, setProfileName] = useState(profile?.profile_name || '')
  const [traderCategory, setTraderCategory] = useState(
    profile?.trader_category || TRADER_CATEGORIES[0]
  )
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header>
        <ElementTitle noMarginBottom>{t('profile:edit-profile')}</ElementTitle>
      </Modal.Header>
      <div className="pb-4">
        <Label>Profile Name</Label>
        <Input
          type="text"
          value={profileName}
          onChange={(e) => setProfileName(e.target.value)}
        />
      </div>
      <div className="pb-6">
        <Label>Trader Category</Label>
        <Select
          value={traderCategory}
          onChange={(cat) => setTraderCategory(cat)}
          className="w-full"
        >
          {TRADER_CATEGORIES.map((cat) => (
            <Select.Option key={cat} value={cat}>
              <div className="flex w-full items-center justify-between">
                {t(`profile:${cat}`)}
              </div>
            </Select.Option>
          ))}
        </Select>
      </div>
      <Button className="w-full">Save Profile</Button>
    </Modal>
  )
}

const Accounts = ({
  accounts,
  accountsStats,
  canEdit,
}: {
  accounts: any[]
  accountsStats: any[]
  canEdit: boolean
}) => {
  const { t } = useTranslation(['common', 'profile'])
  const { publicKey, signMessage } = useWallet()
  const actions = useMangoStore((s) => s.actions)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const following = useMangoStore((s) => s.profile.following)

  useEffect(() => {
    if (mangoGroup && publicKey && !canEdit) {
      actions.fetchProfileFollowing(publicKey?.toString())
    }
  }, [mangoGroup, publicKey, canEdit])

  const handleToggleFollow = async (
    isFollowed: boolean,
    mangoAccountPk: string
  ) => {
    if (publicKey) {
      isFollowed
        ? await actions.unfollowAccount(mangoAccountPk, publicKey, signMessage)
        : await actions.followAccount(mangoAccountPk, publicKey, signMessage)
      actions.fetchProfileFollowing(publicKey?.toString())
    }
  }

  return (
    <div className="rounded-lg border border-th-bkg-4 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="mb-0">{t('accounts')}</h3>
        {/* <LinkButton>Follow All</LinkButton> */}
      </div>
      {canEdit ? (
        <SelectMangoAccount />
      ) : (
        <div className="space-y-2">
          {accounts.map((acc) => {
            const statsAccount = accountsStats.find(
              (a) => a.mangoAccount === acc.publicKey.toString()
            )
            const pnl: number =
              statsAccount && statsAccount.stats.length > 0
                ? statsAccount.stats[0].pnl
                : 0

            const isFollowed = following.find(
              (a) => a.mango_account === acc.publicKey.toString()
            )
            return (
              <div
                className="flex flex-col rounded-md bg-th-bkg-3 p-4 md:flex-row md:items-center md:justify-between lg:flex-col lg:items-start xl:flex-row xl:items-center xl:justify-between"
                key={acc.publicKey.toString()}
              >
                <MangoAccountCard mangoAccount={acc} pnl={pnl} />
                {isFollowed ? (
                  <Button
                    className="mt-4 w-24 bg-transparent pl-4 pr-4 text-xs ring-1 ring-inset ring-th-fgd-3 before:content-['Following'] hover:ring-th-red before:hover:block before:hover:text-th-red before:hover:content-['Unfollow'] md:mt-0 lg:mt-4 xl:mt-0 xl:mt-0"
                    disabled={!publicKey}
                    onClick={() =>
                      handleToggleFollow(isFollowed, acc.publicKey.toString())
                    }
                  >
                    {/* <span className="h-full hover:hidden">
                      {t('profile:following')}
                    </span> */}
                  </Button>
                ) : (
                  <Button
                    className="mt-4 w-24 pl-4 pr-4 text-xs md:mt-0 lg:mt-4 xl:mt-0 xl:mt-0"
                    disabled={!publicKey}
                    onClick={() =>
                      handleToggleFollow(isFollowed, acc.publicKey.toString())
                    }
                  >
                    {t('profile:follow')}
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
