import {
  CalendarIcon,
  ExternalLinkIcon,
  //   SearchIcon,
  ChevronRightIcon,
  UserGroupIcon,
} from '@heroicons/react/outline'
import { useWallet } from '@solana/wallet-adapter-react'
import { numberCompacter } from 'components'
import Button from 'components/Button'
// import Input from 'components/Input'
import PageBodyContainer from 'components/PageBodyContainer'
import ProfileImage from 'components/ProfileImage'
import ProfileImageButton from 'components/ProfileImageButton'
import SelectMangoAccount from 'components/SelectMangoAccount'
import Tabs from 'components/Tabs'
import TopBar from 'components/TopBar'
import dayjs from 'dayjs'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useEffect, useMemo, useState } from 'react'
// import useMangoStore from 'stores/useMangoStore'
import { formatUsdValue } from 'utils'

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
      // Will be passed to the page component as props
    },
  }
}

const TABS = ['Following', 'Followers']

const following = [
  {
    wallet_pk: 'AMMS71iywhGZJ3Hdb9jJgkT8hRd7E1rPvAbB6vMyfDRL',
    profile_name: 'Satoshi Nakamoto',
    trader_category: 'Degen',
    pnl: 3456789,
    accounts_value: 234567890,
  },
  {
    wallet_pk: 'E8fEXpzHwgYRgzeRnEw71HKNih7YKK19MJYKvCAHf5AU',
    profile_name: 'Alphonse Mangotano',
    trader_category: 'Degen',
    pnl: 3456789,
    accounts_value: 234567890,
  },
]

const feed = [
  {
    wallet_pk: 'AMMS71iywhGZJ3Hdb9jJgkT8hRd7E1rPvAbB6vMyfDRL',
    profile_name: 'Satoshi Nakamoto',
    trader_category: 'Degen',
    pnl: 3456789,
    activity: {
      asset: 'SOL-PERP',
      baseSymbol: 'SOL',
      side: 'long',
      entry_price: 50,
      size: 100,
      notional_size: 5000,
      pnl: 200,
      timestamp: 1653015473,
    },
  },
  {
    wallet_pk: 'E8fEXpzHwgYRgzeRnEw71HKNih7YKK19MJYKvCAHf5AU',
    profile_name: 'Alphonse Mangotano',
    trader_category: 'Degen',
    pnl: 3456789,
    activity: {
      asset: 'SOL-PERP',
      baseSymbol: 'SOL',
      side: 'short',
      entry_price: 50,
      size: 100,
      notional_size: 5000,
      pnl: 200,
      timestamp: 1653215473,
    },
  },
]

export default function Profile() {
  const { t } = useTranslation(['common', 'profile'])
  const [profileData, setProfileData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('Following')
  //   const [searchString, setSearchString] = useState('')
  const { publicKey, connected } = useWallet()

  useEffect(() => {
    const getProfile = async () => {
      try {
        const response = await fetch(
          'https://mango-transaction-log.herokuapp.com/v3/user-data/settings?wallet-pk=AMMS71iywhGZJ3Hdb9jJgkT8hRd7E1rPvAbB6vMyfDRL'
        )
        const data = await response.json()
        setProfileData(data)
      } catch (e) {
        console.log(e)
      }
    }
    getProfile()
  }, [])

  const handleTabChange = (tabName) => {
    setActiveTab(tabName)
  }

  const canEdit = useMemo(() => {
    if (connected && publicKey) {
      return !!publicKey.toString() === profileData?.wallet_pk
    }
    return false
  }, [connected, publicKey, profileData])

  return (
    <div className={`bg-th-bkg-1 text-th-fgd-1 transition-all`}>
      <TopBar />
      <PageBodyContainer>
        <div className="flex flex-col pt-8 pb-3 sm:flex-row sm:items-center sm:justify-between sm:pb-6 md:pt-10">
          <div className="flex w-full items-center justify-between">
            <h1 className={`mb-4 text-2xl font-semibold text-th-fgd-1 sm:mb-0`}>
              Profile
            </h1>
            {/* <div className="w-56">
              <Input
                type="text"
                placeholder="Search profiles..."
                value={searchString}
                onChange={(e) => setSearchString(e.target.value)}
                prefix={<SearchIcon className="h-4 w-4 text-th-fgd-3" />}
              />
            </div> */}
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
                    imageSize="24"
                    placeholderSize="12"
                    disabled={profileData?.wallet_pk !== publicKey?.toString()}
                  />
                  <div>
                    <div className="mb-2 flex items-center space-x-2">
                      <h2>{profileData?.profile_name}</h2>
                      <div className="rounded-full bg-th-bkg-3 px-2 py-1 text-xs text-th-fgd-3">
                        Market Maker
                      </div>
                    </div>
                    <div className="mb-1.5 flex items-center space-x-1.5">
                      <CalendarIcon className="h-4 w-4 text-th-fgd-3" />
                      <p className="mb-0">Joined April 2020</p>
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
                {!canEdit ? <Button>Edit</Button> : null}
              </div>
              <div className="grid grid-flow-col grid-cols-1 grid-rows-2 pb-8 md:grid-cols-2 md:grid-rows-1 md:gap-4">
                <div className="border-t border-th-bkg-4 p-3 sm:p-4 md:border-b">
                  <div className="pb-0.5 text-th-fgd-3">Total Value</div>
                  <div className="text-xl font-bold text-th-fgd-1 md:text-2xl">
                    {formatUsdValue(123456789)}
                  </div>
                </div>
                <div className="border-t border-th-bkg-4 p-3 sm:p-4 md:border-b">
                  <div className="pb-0.5 text-th-fgd-3">Total PnL</div>
                  <div className="text-xl font-bold text-th-fgd-1 md:text-2xl">
                    {formatUsdValue(23456789)}
                  </div>
                </div>
              </div>
              <h3 className="mb-2">Feed</h3>
              {/* <p>
                Show trades from users following here. When not connected or
                looking at another users profile it would show only their trades
                and be titled "Activity"
              </p> */}
              <div className="space-y-2">
                {feed.map((user) => (
                  <div
                    className="flex items-center justify-between rounded-md border border-th-bkg-4 px-4 py-3"
                    key={user.wallet_pk}
                  >
                    <div className="flex items-center space-x-3">
                      <ProfileImage
                        imageSize="12"
                        placeholderSize="6"
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
                        {/* <p
                          className={`mb-0 text-xs ${
                            user.pnl >= 0 ? 'text-th-green' : 'text-th-red'
                          }`}
                        >
                          <span className="text-th-fgd-4">PnL:</span>{' '}
                          {numberCompacter.format(user.pnl)}
                        </p> */}
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
              </div>
            </div>
            <div className="col-span-4 space-y-6">
              <div className="rounded-lg border border-th-bkg-4 p-6">
                <h3 className="mb-4">{t('accounts')}</h3>
                <SelectMangoAccount />
              </div>
              <div className="rounded-lg border border-th-bkg-4 p-6">
                <Tabs
                  activeTab={activeTab}
                  onChange={handleTabChange}
                  tabs={TABS}
                />
                <div className="space-y-2">
                  {activeTab === 'Following'
                    ? following.map((user) => (
                        <div
                          className="flex items-center justify-between rounded-md border border-th-bkg-4 px-4 py-3"
                          key={user.wallet_pk}
                        >
                          <div className="flex items-center space-x-3">
                            <ProfileImage
                              imageSize="12"
                              placeholderSize="6"
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
                              <p
                                className={`mb-0 text-xs ${
                                  user.pnl >= 0
                                    ? 'text-th-green'
                                    : 'text-th-red'
                                }`}
                              >
                                <span className="text-th-fgd-4">PnL:</span>{' '}
                                {numberCompacter.format(user.pnl)}
                              </p>
                            </div>
                          </div>
                          <ChevronRightIcon className="h-5 w-5 text-th-fgd-3" />
                        </div>
                      ))
                    : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageBodyContainer>
    </div>
  )
}
