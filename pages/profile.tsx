import { MangoAccountLayout } from '@blockworks-foundation/mango-client'
import {
  ChevronRightIcon,
  UserGroupIcon,
  ArrowSmDownIcon,
  ArrowSmUpIcon,
  LinkIcon,
  ExclamationCircleIcon,
  UserCircleIcon,
  PencilIcon,
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
import ProfileImage from 'components/ProfileImage'
import ProfileImageButton from 'components/ProfileImageButton'
import SelectMangoAccount from 'components/SelectMangoAccount'
import Tabs from 'components/Tabs'
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
import EmptyState from 'components/EmptyState'
import { handleWalletConnect } from 'components/ConnectWalletButton'
import { sign } from 'tweetnacl'
import bs58 from 'bs58'
import Loading from 'components/Loading'
import InlineNotification from 'components/InlineNotification'
import { startCase } from 'lodash'
import useMangoAccount from 'hooks/useMangoAccount'

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'profile'])),
      // Will be passed to the page component as props
    },
  }
}

const TABS = ['following', 'followers']

export default function Profile() {
  const { t } = useTranslation(['common', 'profile'])
  const [profileData, setProfileData] = useState<any>(null)
  const [walletMangoAccounts, setWalletMangoAccounts] = useState<any[]>([])
  const [loadMangoAccounts, setLoadMangoAccounts] = useState(false)
  const { initialLoad } = useMangoAccount()
  const [walletMangoAccountsStats, setWalletMangoAccountsStats] = useState<
    any[]
  >([])
  const [loadMangoAccountsStats, setLoadMangoAccountsStats] = useState(false)
  const [following, setFollowing] = useState<any[]>([])
  const [followers, setFollowers] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('following')
  const [loadFollowing, setLoadFollowing] = useState(false)
  const [loadFollowers, setLoadFollowers] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [initialFollowingLoad, setInitialFollowingLoad] = useState(false)
  const [loadProfileDetails, setLoadProfileDetails] = useState(false)
  const [profilePk, setProfilePk] = useState<string | string[]>('')
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoClient = useMangoStore((s) => s.connection.client)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const mangoAccounts = useMangoStore((s) => s.mangoAccounts)
  const { publicKey, connected, wallet } = useWallet()
  const router = useRouter()
  const { name } = router.query
  const ownedProfile = useMangoStore((s) => s.profile.details)
  const loadOwnedProfile = useMangoStore((s) => s.profile.loadDetails)

  const handleConnect = useCallback(() => {
    if (wallet) {
      handleWalletConnect(wallet)
    }
  }, [wallet])

  useEffect(() => {
    if (profileData) {
      setProfilePk(profileData.wallet_pk)
    }
    setInitialFollowingLoad(false)
    setActiveTab('following')
  }, [profileData])

  useEffect(() => {
    const fetchProfileDetails = async () => {
      setLoadProfileDetails(true)
      try {
        const response = await fetch(
          `https://mango-transaction-log.herokuapp.com/v3/user-data/profile-details?profile-name=${name
            ?.toString()
            .replace(/-/g, ' ')}`
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
    if (name) {
      fetchProfileDetails()
    } else {
      if (loadOwnedProfile) {
        setLoadProfileDetails(true)
      } else {
        setProfileData(ownedProfile)
        setLoadProfileDetails(false)
      }
    }
  }, [name, loadOwnedProfile])

  useEffect(() => {
    if (mangoGroup && profilePk && !initialFollowingLoad) {
      fetchFollowing()
    }
  }, [mangoGroup, profilePk])

  useEffect(() => {
    if (profilePk) {
      fetchFollowers()
    }
  }, [profilePk])

  useEffect(() => {
    if (mangoGroup) {
      const getProfileAccounts = async (unownedPk: string) => {
        setLoadMangoAccounts(true)
        const accounts = await fetchAllMangoAccounts(new PublicKey(unownedPk))
        if (accounts) {
          setWalletMangoAccounts(accounts)
        }
        setLoadMangoAccounts(false)
      }
      if (profilePk) {
        getProfileAccounts(profilePk.toString())
      } else {
        setWalletMangoAccounts(mangoAccounts)
      }
    }
  }, [profilePk, mangoAccounts, mangoGroup])

  useEffect(() => {
    const getAccountsStats = async () => {
      setLoadMangoAccountsStats(true)
      const accountsStats: any[] = []
      for (const acc of walletMangoAccounts) {
        const stats = await fetchAccountStats(acc.publicKey.toString())
        accountsStats.push({
          mangoAccount: acc.publicKey.toString(),
          stats,
        })
      }
      setWalletMangoAccountsStats(accountsStats)
      setLoadMangoAccountsStats(false)
    }
    if (walletMangoAccounts.length) {
      getAccountsStats()
    }
  }, [walletMangoAccounts])

  const fetchFollowers = async () => {
    if (!publicKey && !profilePk) return
    const pubkey = profilePk
      ? profilePk
      : publicKey
      ? publicKey?.toString()
      : null
    setLoadFollowers(true)
    try {
      const followerRes = await fetch(
        `https://mango-transaction-log.herokuapp.com/v3/user-data/followers?wallet-pk=${pubkey}`
      )
      const parsedResponse = await followerRes.json()
      if (parsedResponse.length > 0) {
        setFollowers(parsedResponse)
      } else {
        setFollowers([])
      }
      setLoadFollowers(false)
    } catch {
      setLoadFollowers(false)
      notify({
        type: 'error',
        title: 'Unable to load followers',
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
      setInitialFollowingLoad(true)
    } catch {
      notify({
        type: 'error',
        title: 'Unable to load following',
      })
      setLoadFollowing(false)
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
      return publicKey.toString() === profileData?.wallet_pk
    }
    return false
  }, [publicKey, profileData])

  const totalValue = useMemo(() => {
    return walletMangoAccounts.reduce((a, c) => {
      const value = c.computeValue(mangoGroup, mangoCache)
      return a + Number(value)
    }, 0)
  }, [walletMangoAccounts])

  const totalPnl = useMemo(() => {
    return walletMangoAccountsStats.reduce((a, c) => {
      const value = c.stats.length > 0 ? c.stats[0].pnl : 0
      return a + value
    }, 0)
  }, [walletMangoAccountsStats])

  const accountsLoaded = publicKey
    ? !loadMangoAccounts && !initialLoad
    : !loadMangoAccounts
  const accountsStatsLoaded = publicKey
    ? !loadMangoAccounts && !initialLoad && !loadMangoAccountsStats
    : !loadMangoAccounts && !loadMangoAccountsStats

  return name && !profileData && !loadProfileDetails ? (
    <div className="mt-6 rounded-lg border border-th-bkg-3 p-6">
      <EmptyState
        icon={<div className="mb-4 text-2xl">🙃</div>}
        title={t('profile:no-profile-exists')}
      />
    </div>
  ) : (
    <div className="pt-6">
      <div className="flex flex-col pb-6 md:flex-row md:items-end md:justify-between md:pb-4">
        {connected || name ? (
          <div className="flex w-full items-start justify-between md:items-end">
            <div className="flex items-start justify-between rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <ProfileImageButton
                  imageSize="80"
                  placeholderSize="40"
                  disabled={
                    !connected ||
                    profileData?.wallet_pk !== publicKey?.toString()
                  }
                  publicKey={profilePk ? profilePk.toString() : undefined}
                />
                <div>
                  {!loadProfileDetails ? (
                    <>
                      <div className="mb-1.5 flex items-center space-x-3">
                        <h1 className="capitalize">
                          {profileData?.profile_name}
                        </h1>
                        <div className="w-max rounded-full px-2 py-1 text-xs text-th-fgd-4 ring-1 ring-inset ring-th-fgd-4">
                          {t(
                            `profile:${profileData?.trader_category.toLowerCase()}`
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="mb-1.5 flex space-x-3">
                      <div className="h-7 w-40 animate-pulse rounded bg-th-bkg-3" />
                      <div className="h-7 w-12 animate-pulse rounded bg-th-bkg-3" />
                    </div>
                  )}
                  <div className="flex space-x-4">
                    {!loadFollowing ? (
                      <p className="mb-0 font-bold text-th-fgd-1">
                        {following.length}{' '}
                        <span className="font-normal text-th-fgd-4">
                          {t('following')}
                        </span>
                      </p>
                    ) : (
                      <div className="h-5 w-20 animate-pulse rounded bg-th-bkg-3" />
                    )}
                    {!loadFollowers ? (
                      <p className="mb-0 font-bold text-th-fgd-1">
                        {followers.length}{' '}
                        <span className="font-normal text-th-fgd-4">
                          {t('followers')}
                        </span>
                      </p>
                    ) : (
                      <div className="h-5 w-20 animate-pulse rounded bg-th-bkg-3" />
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {canEdit ? (
                <Button
                  className="flex h-8 w-full items-center justify-center rounded-full px-3 py-0 text-xs"
                  onClick={() => setShowEditProfile(true)}
                >
                  <PencilIcon className="mr-2 h-5 w-5" />
                  {t('profile:edit-profile')}
                </Button>
              ) : null}
              {!canEdit && publicKey ? (
                <Button
                  className="flex h-8 w-full items-center justify-center rounded-full px-3 py-0 text-xs"
                  onClick={() => router.push('/profile')}
                >
                  <UserCircleIcon className="mr-2 h-5 w-5" />
                  {t('profile:your-profile')}
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
      {connected || name ? (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8">
            <div className="mb-8 grid grid-flow-col grid-cols-1 grid-rows-2 md:grid-cols-2 md:grid-rows-1 md:gap-4">
              <div className="border-t border-th-bkg-3 p-3 sm:p-4 md:border-b">
                {accountsLoaded ? (
                  <>
                    <div className="pb-0.5 text-th-fgd-3">
                      {t('profile:total-value')}
                    </div>
                    <div className="text-2xl font-bold text-th-fgd-1 md:text-3xl">
                      {formatUsdValue(totalValue)}
                    </div>
                  </>
                ) : (
                  <div className="h-14 w-40 animate-pulse rounded-md bg-th-bkg-3" />
                )}
              </div>
              <div className="border-y border-th-bkg-3 p-3 sm:p-4">
                {accountsStatsLoaded ? (
                  <>
                    <div className="pb-0.5 text-th-fgd-3">
                      {t('profile:total-pnl')}
                    </div>
                    <div className="text-2xl font-bold text-th-fgd-1 md:text-3xl">
                      {formatUsdValue(totalPnl)}
                    </div>
                  </>
                ) : (
                  <div className="h-14 w-40 animate-pulse rounded-md bg-th-bkg-3" />
                )}
              </div>
            </div>
            <div className="pb-8 lg:hidden">
              <Accounts
                accounts={walletMangoAccounts}
                accountsStats={walletMangoAccountsStats}
                canEdit={canEdit}
                fetchFollowers={fetchFollowers}
                loaded={accountsLoaded}
              />
            </div>
            <Tabs
              activeTab={activeTab}
              onChange={handleTabChange}
              tabs={TABS}
            />
            <div className="space-y-2">
              {activeTab === 'following' ? (
                loadFollowing ? (
                  <div className="space-y-2">
                    <div className="h-24 animate-pulse rounded-md bg-th-bkg-3" />
                    <div className="h-24 animate-pulse rounded-md bg-th-bkg-3" />
                    <div className="h-24 animate-pulse rounded-md bg-th-bkg-3" />
                  </div>
                ) : following.length > 0 ? (
                  following.map((user) => {
                    const accountEquity = user.mango_account.computeValue(
                      mangoGroup,
                      mangoCache
                    )
                    const pnl: number =
                      user.stats.length > 0 ? user.stats[0].pnl : 0
                    return (
                      <div
                        className="relative"
                        key={user.mango_account.publicKey.toString()}
                      >
                        <button
                          className="default-transition absolute bottom-4 left-20 flex items-center space-x-2 rounded-full border border-th-fgd-4 px-2 py-1 hover:border-th-fgd-2"
                          onClick={() =>
                            router.push(
                              `/profile?name=${user.profile_name.replace(
                                /\s/g,
                                '-'
                              )}`,
                              undefined,
                              { shallow: true }
                            )
                          }
                        >
                          <p className="mb-0 text-xs capitalize text-th-fgd-3">
                            {user.profile_name}
                          </p>
                        </button>
                        <a
                          className="default-transition block flex h-[104px] w-full rounded-md border border-th-bkg-4 p-4 hover:border-th-fgd-4 sm:h-[84px] sm:justify-between sm:pb-4"
                          href={`/account?pubkey=${user.mango_account.publicKey.toString()}`}
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
                              <span className="pl-2 pr-1 text-th-fgd-4">|</span>
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
                            <ChevronRightIcon className="ml-2 mt-0.5 h-5 w-5 text-th-fgd-4" />
                          </div>
                        </a>
                      </div>
                    )
                  })
                ) : (
                  <div className="rounded-lg border border-th-bkg-3 p-4 md:p-6">
                    <EmptyState
                      desc={t('profile:no-following-desc')}
                      icon={<UserGroupIcon />}
                      title={t('profile:no-following')}
                    />
                  </div>
                )
              ) : null}
              {activeTab === 'followers' ? (
                loadFollowers ? (
                  <div className="space-y-2">
                    <div className="h-24 animate-pulse rounded-md bg-th-bkg-3" />
                    <div className="h-24 animate-pulse rounded-md bg-th-bkg-3" />
                    <div className="h-24 animate-pulse rounded-md bg-th-bkg-3" />
                  </div>
                ) : followers.length > 0 ? (
                  followers.map((user) => {
                    return (
                      <button
                        className="default-transition block flex w-full items-center justify-between rounded-md border border-th-bkg-4 p-4 hover:border-th-fgd-4"
                        onClick={() =>
                          router.push(
                            `/profile?name=${user.profile_name.replace(
                              /\s/g,
                              '-'
                            )}`,
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
                        <p className="mb-0 ml-3 font-bold capitalize text-th-fgd-1">
                          {user.profile_name}
                        </p>
                        <div className="my-auto ml-auto">
                          <ChevronRightIcon className="ml-2 mt-0.5 h-5 w-5 text-th-fgd-4" />
                        </div>
                      </button>
                    )
                  })
                ) : (
                  <div className="rounded-lg border border-th-bkg-3 p-4 md:p-6">
                    <EmptyState
                      desc={t('profile:no-followers-desc')}
                      icon={<UserGroupIcon />}
                      title={t('profile:no-followers')}
                    />
                  </div>
                )
              ) : null}
            </div>
          </div>
          <div className="col-span-4 hidden lg:block">
            <Accounts
              accounts={walletMangoAccounts}
              accountsStats={walletMangoAccountsStats}
              canEdit={canEdit}
              fetchFollowers={fetchFollowers}
              loaded={accountsLoaded}
            />
          </div>
        </div>
      ) : (
        <div className="-mt-4 rounded-lg border border-th-bkg-3 p-4 md:p-6">
          <EmptyState
            buttonText={t('connect')}
            desc={t('profile:connect-view-profile')}
            disabled={!wallet || !mangoGroup}
            icon={<LinkIcon />}
            onClickButton={handleConnect}
            title={t('connect-wallet')}
          />
        </div>
      )}
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
  'trader',
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
  const { publicKey, signMessage } = useWallet()
  const [profileName, setProfileName] = useState(
    startCase(profile?.profile_name) || ''
  )
  const [traderCategory, setTraderCategory] = useState(
    profile?.trader_category || TRADER_CATEGORIES[5]
  )
  const [inputErrors, setInputErrors] = useState({})
  const [loadUniquenessCheck, setLoadUniquenessCheck] = useState(false)
  const [loadUpdateProfile, setLoadUpdateProfile] = useState(false)
  const [updateError, setUpdateError] = useState('')
  const actions = useMangoStore((s) => s.actions)

  const validateProfileName = async (name) => {
    const re = /^([a-zA-Z0-9]+\s)*[a-zA-Z0-9]+$/
    if (!re.test(name)) {
      setInputErrors({
        ...inputErrors,
        regex: t('profile:invalid-characters'),
      })
    }
    if (name.length > 29) {
      setInputErrors({
        ...inputErrors,
        length: t('profile:length-error'),
      })
    }
    try {
      setLoadUniquenessCheck(true)
      const response = await fetch(
        `https://mango-transaction-log.herokuapp.com/v3/user-data/check-profile-name-unique?profile-name=${name.toLowerCase()}`
      )
      const uniquenessCheck = await response.json()
      setLoadUniquenessCheck(false)

      if (response.status === 200 && !uniquenessCheck) {
        setInputErrors({
          ...inputErrors,
          uniqueness: t('profile:uniqueness-fail'),
        })
      }
    } catch {
      setInputErrors({
        ...inputErrors,
        api: t('profile:uniqueness-api-fail'),
      })
      setLoadUniquenessCheck(false)
    }
  }

  const onChangeNameInput = (name) => {
    setProfileName(name)
    setInputErrors({})
  }

  const saveProfile = async () => {
    setUpdateError('')
    const name = profileName.toLowerCase()
    await validateProfileName(name)
    if (!Object.keys(inputErrors).length) {
      setLoadUpdateProfile(true)
      try {
        if (!publicKey) throw new Error('Wallet not connected!')
        if (!signMessage)
          throw new Error('Wallet does not support message signing!')

        const messageString = JSON.stringify({
          profile_name: name,
          trader_category: traderCategory,
        })
        const message = new TextEncoder().encode(messageString)
        const signature = await signMessage(message)
        if (!sign.detached.verify(message, signature, publicKey.toBytes()))
          throw new Error('Invalid signature!')

        const requestOptions = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallet_pk: publicKey.toString(),
            message: messageString,
            signature: bs58.encode(signature),
          }),
        }
        const response = await fetch(
          'https://mango-transaction-log.herokuapp.com/v3/user-data/profile-details',
          requestOptions
        )
        if (response.status === 200) {
          setLoadUpdateProfile(false)
          await actions.fetchProfileDetails(publicKey.toString())
          onClose()
          notify({
            type: 'success',
            title: t('profile:profile-update-success'),
          })
        }
      } catch {
        setLoadUpdateProfile(false)
        setUpdateError(t('profile:profile-update-fail'))
      }
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header>
        <ElementTitle noMarginBottom>{t('profile:edit-profile')}</ElementTitle>
      </Modal.Header>
      {updateError ? (
        <div className="pb-3">
          <InlineNotification type="error" desc={updateError} />
        </div>
      ) : null}
      <div className="pb-4">
        <Label>{t('profile:profile-name')}</Label>
        <Input
          type="text"
          error={Object.keys(inputErrors).length}
          value={profileName}
          onChange={(e) => onChangeNameInput(e.target.value)}
        />
        {Object.keys(inputErrors).length ? (
          <div className="mt-1.5 flex items-center space-x-1">
            <ExclamationCircleIcon className="h-4 w-4 text-th-red" />
            <p className="mb-0 text-xs text-th-red">
              {Object.values(inputErrors).toString()}
            </p>
          </div>
        ) : null}
      </div>
      <div className="pb-6">
        <Label>{t('profile:trader-category')}</Label>
        <Select
          value={t(`profile:${traderCategory}`)}
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
      <Button
        className="flex w-full justify-center"
        disabled={
          !!Object.keys(inputErrors).length ||
          loadUniquenessCheck ||
          !profileName
        }
        onClick={() => saveProfile()}
      >
        {loadUniquenessCheck || loadUpdateProfile ? (
          <Loading />
        ) : (
          t('profile:save-profile')
        )}
      </Button>
    </Modal>
  )
}

const Accounts = ({
  accounts,
  accountsStats,
  canEdit,
  fetchFollowers,
  loaded,
}: {
  accounts: any[]
  accountsStats: any[]
  canEdit: boolean
  fetchFollowers: () => void
  loaded: boolean
}) => {
  const { t } = useTranslation(['common', 'profile'])
  const { publicKey, signMessage } = useWallet()
  const actions = useMangoStore((s) => s.actions)
  const following = useMangoStore((s) => s.profile.following)

  useEffect(() => {
    if (publicKey && !canEdit) {
      actions.fetchProfileFollowing(publicKey?.toString())
    }
  }, [publicKey, canEdit])

  const handleToggleFollow = async (
    isFollowed: boolean,
    mangoAccountPk: string
  ) => {
    if (publicKey) {
      isFollowed
        ? await actions.unfollowAccount(mangoAccountPk, publicKey, signMessage)
        : await actions.followAccount(mangoAccountPk, publicKey, signMessage)
      fetchFollowers()
    }
  }

  return (
    <div className="rounded-lg border border-th-bkg-3 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="mb-0">{t('accounts')}</h3>
      </div>
      {canEdit ? (
        loaded ? (
          accounts.length ? (
            <SelectMangoAccount />
          ) : (
            <p className="mb-0">{t('no-account-found')}</p>
          )
        ) : (
          <div className="space-y-2">
            <div className="h-16 w-full animate-pulse rounded-md bg-th-bkg-3" />
            <div className="h-16 w-full animate-pulse rounded-md bg-th-bkg-3" />
          </div>
        )
      ) : loaded ? (
        accounts.length ? (
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
                  className="flex flex-col rounded-md border border-th-bkg-4 p-4 md:flex-row md:items-center md:justify-between lg:flex-col lg:items-start xl:flex-row xl:items-center xl:justify-between"
                  key={acc.publicKey.toString()}
                >
                  <MangoAccountCard mangoAccount={acc} pnl={pnl} />
                  {isFollowed ? (
                    <Button
                      className={`mt-4 w-24 bg-transparent pl-4 pr-4 text-xs ring-1 ring-inset ring-th-fgd-3 before:content-[attr(data-before)] hover:ring-th-red before:hover:block before:hover:text-th-red before:hover:content-[attr(data-before-hover)] md:mt-0 lg:mt-4 xl:mt-0 xl:mt-0`}
                      disabled={!publicKey}
                      onClick={() =>
                        handleToggleFollow(isFollowed, acc.publicKey.toString())
                      }
                      data-before={t('profile:following')}
                      data-before-hover={t('profile:unfollow')}
                    />
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
        ) : (
          <p className="mb-0">{t('no-account-found')}</p>
        )
      ) : (
        <div className="space-y-2">
          <div className="h-32 w-full animate-pulse rounded-md bg-th-bkg-3" />
          <div className="h-32 w-full animate-pulse rounded-md bg-th-bkg-3" />
        </div>
      )}
    </div>
  )
}
