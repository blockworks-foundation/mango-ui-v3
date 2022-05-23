import { MangoAccountLayout } from '@blockworks-foundation/mango-client'
import {
  CalendarIcon,
  ChevronRightIcon,
  UserGroupIcon,
  MailIcon,
  ArrowSmDownIcon,
  ArrowSmUpIcon,
} from '@heroicons/react/outline'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { ElementTitle } from 'components'
import Button, { IconButton, LinkButton } from 'components/Button'
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
import { useEffect, useMemo, useState } from 'react'
import useMangoStore from 'stores/useMangoStore'
import { abbreviateAddress, formatUsdValue } from 'utils'
import { notify } from 'utils/notifications'
import { Label } from 'components'
import Select from 'components/Select'

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
      // Will be passed to the page component as props
    },
  }
}

const TABS = ['following', 'followers']

const followingRes = [
  {
    mango_account_pk: '6SuBRXz5mywtjMXfQiTo4ZC5WLtuGhpjvDCTStbHryjS',
    profile: {
      wallet_pk: 'AMMS71iywhGZJ3Hdb9jJgkT8hRd7E1rPvAbB6vMyfDRL',
      profile_name: 'Satoshi Nakamoto',
      trader_category: 'Degen',
    },
  },
  {
    mango_account_pk: 'D6kE84eHZcLZTcYgjZGXcLtN1KUAvL7LCyf6dJf23Y65',
    profile: {
      wallet_pk: 'E8fEXpzHwgYRgzeRnEw71HKNih7YKK19MJYKvCAHf5AU',
      profile_name: 'Alphonse Mangotano',
      trader_category: 'Degen',
    },
  },
]

// const feed = [
//   {
//     wallet_pk: 'AMMS71iywhGZJ3Hdb9jJgkT8hRd7E1rPvAbB6vMyfDRL',
//     profile_name: 'Satoshi Nakamoto',
//     trader_category: 'Degen',
//     pnl: 3456789,
//     activity: {
//       asset: 'SOL-PERP',
//       baseSymbol: 'SOL',
//       side: 'long',
//       entry_price: 50,
//       size: 100,
//       notional_size: 5000,
//       pnl: 200,
//       timestamp: 1653015473,
//     },
//   },
//   {
//     wallet_pk: 'E8fEXpzHwgYRgzeRnEw71HKNih7YKK19MJYKvCAHf5AU',
//     profile_name: 'Alphonse Mangotano',
//     trader_category: 'Degen',
//     pnl: 3456789,
//     activity: {
//       asset: 'SOL-PERP',
//       baseSymbol: 'SOL',
//       side: 'short',
//       entry_price: 50,
//       size: 100,
//       notional_size: 5000,
//       pnl: 200,
//       timestamp: 1653215473,
//     },
//   },
// ]

export default function Profile() {
  const { t } = useTranslation(['common', 'profile'])
  const [profileData, setProfileData] = useState<any>(null)
  const [walletMangoAccounts, setWalletMangoAccounts] = useState<any[]>([])
  const [walletMangoAccountsStats, setWalletMangoAccountsStats] = useState<
    any[]
  >([])
  const [following, setFollowing] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('following')
  const [loadFollowing, setLoadFollowing] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoClient = useMangoStore((s) => s.connection.client)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const { publicKey, connected } = useWallet()
  const router = useRouter()
  const { wallet } = router.query

  useEffect(() => {
    const profilePk = wallet ? wallet : publicKey ? publicKey?.toString() : null
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
    getProfile()
  }, [wallet, publicKey])

  const fetchFollowing = async () => {
    if (!mangoGroup) return
    setLoadFollowing(true)
    const followingInfo: any[] = []
    for (let i = 0; i < followingRes.length; i++) {
      const pk = new PublicKey(followingRes[i].mango_account_pk)
      const mangoAccount = await mangoClient.getMangoAccount(
        pk,
        mangoGroup?.dexProgramId
      )
      const stats = await fetchAccountStats(followingRes[i].mango_account_pk)
      followingInfo.push({
        ...followingRes[i],
        mango_account: mangoAccount,
        stats,
      })
    }
    setFollowing(followingInfo)
    setLoadFollowing(false)
  }

  useEffect(() => {
    if (following.length === 0) {
      fetchFollowing()
    }
  }, [mangoGroup])

  useEffect(() => {
    if ((wallet || publicKey) && mangoGroup) {
      const profilePk = wallet
        ? new PublicKey(wallet)
        : publicKey
        ? publicKey
        : null
      const getProfileAccounts = async () => {
        const accounts = await fetchAllMangoAccounts(profilePk)
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
  }, [wallet, mangoGroup])

  const fetchAccountStats = async (pk) => {
    const response = await fetch(
      `https://mango-transaction-log.herokuapp.com/v3/stats/account-performance-detailed?mango-account=${pk}&start-date=${dayjs()
        .subtract(2, 'hour')
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
    if (connected && publicKey) {
      return (
        publicKey.toString() === profileData?.wallet_pk ||
        publicKey.toString() === wallet
      )
    }
    return false
  }, [connected, publicKey, profileData])

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
          <div className="flex w-full items-center justify-between">
            <h1 className={`mb-4 text-2xl font-semibold text-th-fgd-1 sm:mb-0`}>
              Profile
            </h1>
            <Button className="flex items-center">
              <UserGroupIcon className="mr-2 h-5 w-5" />
              Browse Profiles
            </Button>
          </div>
        </div>
        <div className="rounded-lg bg-th-bkg-2 p-6">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-8">
              <div className="mb-8 flex items-start justify-between rounded-lg ">
                <div className="flex items-center">
                  <ProfileImageButton
                    imageSize="80"
                    placeholderSize="40"
                    disabled={profileData?.wallet_pk !== publicKey?.toString()}
                    publicKey={profileData?.wallet_pk || wallet}
                  />
                  <div>
                    <div className="mb-2 flex items-center space-x-2">
                      <h2>{profileData?.profile_name}</h2>
                    </div>
                    <div className="mb-1.5 flex items-center space-x-3">
                      <div className="w-max rounded-full px-2 py-1 text-xs text-th-fgd-4 ring-1 ring-inset ring-th-fgd-4">
                        Market Maker
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <CalendarIcon className="h-4 w-4 text-th-fgd-3" />
                        <p className="mb-0">Joined April 2020</p>
                      </div>
                    </div>
                    <div className="flex space-x-4">
                      <p className="mb-0 font-bold text-th-fgd-1">
                        {2}{' '}
                        <span className="font-normal text-th-fgd-4">
                          Following
                        </span>
                      </p>
                      <p className="mb-0 font-bold text-th-fgd-1">
                        {500}{' '}
                        <span className="font-normal text-th-fgd-4">
                          Followers
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
                {canEdit ? (
                  <Button onClick={() => setShowEditProfile(true)}>Edit</Button>
                ) : connected ? (
                  <IconButton className="h-10 w-10">
                    <MailIcon className="h-5 w-5" />
                  </IconButton>
                ) : null}
              </div>
              <div className="grid grid-flow-col grid-cols-1 grid-rows-2 pb-8 md:grid-cols-2 md:grid-rows-1 md:gap-4">
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
              <Tabs
                activeTab={activeTab}
                onChange={handleTabChange}
                tabs={TABS}
              />
              <div className="space-y-2">
                {activeTab === 'following'
                  ? following.map((user) => {
                      const accountEquity = user.mango_account.computeValue(
                        mangoGroup,
                        mangoCache
                      )
                      const pnl: number = user.stats ? user.stats[0].pnl : 0
                      return loadFollowing ? (
                        <>
                          <div className="h-24 animate-pulse rounded-md bg-th-bkg-3" />
                        </>
                      ) : (
                        <div className="relative" key={user.profile.wallet_pk}>
                          <button
                            className="absolute bottom-4 left-20 flex items-center space-x-2 rounded-full bg-th-bkg-button px-2 py-1 hover:brightness-[1.1] hover:filter"
                            onClick={() =>
                              router.push(
                                `/profile?wallet=${user.profile.wallet_pk}`,
                                undefined,
                                { shallow: true }
                              )
                            }
                          >
                            <p className="mb-0 text-xs text-th-fgd-3">
                              {user.profile.profile_name}
                            </p>
                          </button>
                          <a
                            className="default-transition block w-full rounded-md bg-th-bkg-3 px-4 pb-4 pt-4 hover:bg-th-bkg-4"
                            href={`https://trade.mango.markets/account?pubkey=${user.mango_account_pk}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start">
                                <ProfileImage
                                  imageSize="56"
                                  placeholderSize="32"
                                  publicKey={user.profile.wallet_pk}
                                />
                                <p className="mb-2 ml-3 font-bold text-th-fgd-1">
                                  {user.mango_account.name
                                    ? user.mango_account.name
                                    : abbreviateAddress(
                                        new PublicKey(user.mango_account_pk)
                                      )}
                                </p>
                              </div>
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
                                <ChevronRightIcon className="ml-2 mt-0.5 h-5 w-5 text-th-fgd-3" />
                              </div>
                            </div>
                          </a>
                        </div>
                      )
                    })
                  : null}
              </div>
              {/* <h3 className="mb-2">Feed</h3>
              <div className="space-y-2">
                {feed.map((user) => (
                  <div
                    className="flex items-center justify-between rounded-md border border-th-bkg-4 px-4 py-3"
                    key={user.wallet_pk}
                  >
                    <div className="flex items-center space-x-3">
                      <ProfileImage
                        imageSize="40"
                        placeholderSize="24"
                        publicKey={user.wallet_pk}
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="mb-1 font-bold text-th-fgd-2">
                            {user.profile_name}
                          </p>
                          <div className="mb-1 w-max rounded-full bg-th-bkg-3 px-2 py-1 text-xs text-th-fgd-3">
                            {user.trader_category}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1.5 text-th-fgd-3">
                          <CalendarIcon className="h-4 w-4" />
                          <p className="mb-0 text-xs">
                            {dayjs(user.activity.timestamp).format(
                              'D MMM h:mma'
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div>
                        <div className="mb-1 flex items-center justify-end">
                          <img
                            alt=""
                            width="16"
                            height="16"
                            src={`/assets/icons/${user.activity.baseSymbol.toLowerCase()}.svg`}
                            className={`mr-2 mt-0.5`}
                          />
                          <p className="mb-0 font-bold text-th-fgd-2">
                            {user.activity.asset}
                          </p>
                        </div>
                        <p className="mb-0 text-xs">
                          <span
                            className={
                              user.activity.side === 'long'
                                ? 'text-th-green'
                                : 'text-th-red'
                            }
                          >
                            {user.activity.side.toUpperCase()}
                          </span>{' '}
                          {`${user.activity.size} at ${formatUsdValue(
                            user.activity.entry_price
                          )}`}
                        </p>
                      </div>
                      <ExternalLinkIcon className="h-5 w-5 text-th-fgd-3" />
                    </div>
                  </div>
                ))}
              </div> */}
            </div>
            <div className="col-span-4 space-y-6">
              <div className="rounded-lg border border-th-bkg-4 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="mb-0">{t('accounts')}</h3>
                  <LinkButton>Follow All</LinkButton>
                </div>
                {canEdit ? (
                  <SelectMangoAccount />
                ) : (
                  <div className="space-y-2">
                    {walletMangoAccounts.map((acc) => {
                      const statsAccount = walletMangoAccountsStats.find(
                        (a) => a.mangoAccount === acc.publicKey.toString()
                      )
                      const pnl: number = statsAccount
                        ? statsAccount.stats[0].pnl
                        : 0
                      return (
                        <div
                          className="flex items-center justify-between rounded-md bg-th-bkg-3 p-4"
                          key={acc.publicKey.toString()}
                        >
                          <MangoAccountCard mangoAccount={acc} pnl={pnl} />
                          <Button className="pl-4 pr-4 text-xs">Follow</Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
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
