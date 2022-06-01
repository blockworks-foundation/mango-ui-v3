import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { abbreviateAddress, usdFormatter } from '../utils'
import { MedalIcon } from './icons'
import { useTranslation } from 'next-i18next'
import {
  ChartPieIcon,
  ChevronRightIcon,
  TrendingUpIcon,
} from '@heroicons/react/outline'
import { notify } from 'utils/notifications'
import ProfileImage from './ProfileImage'
import { useRouter } from 'next/router'
import { PublicKey } from '@solana/web3.js'
import ButtonGroup from './ButtonGroup'

const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const leaderboardRangePresets = [
  { label: '7d', value: '7' },
  { label: '30d', value: '29' },
  { label: 'All', value: '9999' },
]
const leaderboardRangePresetLabels = leaderboardRangePresets.map((x) => x.label)
const leaderboardRangePresetValues = leaderboardRangePresets.map((x) => x.value)

const LeaderboardTable = () => {
  const { t } = useTranslation('common')
  const [pnlLeaderboardData, setPnlLeaderboardData] = useState<any[]>([])
  const [perpPnlLeaderboardData, setPerpPnlLeaderboardData] = useState<any[]>(
    []
  )
  const [leaderboardType, setLeaderboardType] = useState<string>('total-pnl')
  const [loading, setLoading] = useState(false)
  const [leaderboardRange, setLeaderboardRange] = useState('29')

  const formatLeaderboardData = async (leaderboard) => {
    console.log(leaderboard)
    const walletPks = leaderboard.map((u) => u.wallet_pk)
    const profileDetailsResponse = await fetch(
      `https://mango-transaction-log.herokuapp.com/v3/user-data/multiple-profile-details?wallet-pks=${walletPks.toString()}`
    )
    const parsedProfileDetailsResponse = await profileDetailsResponse.json()
    const leaderboardData = [] as any[]
    for (const item of leaderboard) {
      const profileDetails = parsedProfileDetailsResponse[item.wallet_pk]
      leaderboardData.push({
        ...item,
        profile: profileDetails ? profileDetails : null,
      })
    }
    return leaderboardData
  }

  const fetchPnlLeaderboard = async (range) => {
    setLoading(true)
    try {
      const response = await fetch(
        `https://mango-transaction-log.herokuapp.com/v3/stats/pnl-leaderboard?start-date=${dayjs()
          .utc()
          .hour(0)
          .minute(0)
          .subtract(parseInt(range), 'day')
          .add(1, 'hour')
          .format('YYYY-MM-DDThh:00:00')}`
      )
      const parsedResponse = await response.json()
      const leaderboardData = await formatLeaderboardData(parsedResponse)
      console.log(leaderboardData)
      setPnlLeaderboardData(leaderboardData)
      setLoading(false)
    } catch {
      notify({ type: 'error', title: t('fetch-leaderboard-fail') })
      setLoading(false)
    }
  }

  const fetchPerpPnlLeaderboard = async (range) => {
    setLoading(true)
    try {
      const response = await fetch(
        `https://mango-transaction-log.herokuapp.com/v3/stats/perp-pnl-leaderboard?start-date=${dayjs()
          .hour(0)
          .minute(0)
          .utc()
          .subtract(parseInt(range), 'day')
          .format('YYYY-MM-DDThh:00:00')}`
      )
      const parsedResponse = await response.json()
      const leaderboardData = await formatLeaderboardData(parsedResponse)
      setPerpPnlLeaderboardData(leaderboardData)
      setLoading(false)
    } catch {
      notify({ type: 'error', title: t('fetch-leaderboard-fail') })
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPnlLeaderboard(leaderboardRange)
  }, [])

  const handleChangeRange = (range) => {
    setLeaderboardRange(range)
    if (leaderboardType === 'total-pnl') {
      fetchPnlLeaderboard(range)
    } else {
      fetchPerpPnlLeaderboard(range)
    }
  }

  const leaderboardData = useMemo(
    () =>
      leaderboardType === 'total-pnl'
        ? pnlLeaderboardData
        : perpPnlLeaderboardData,
    [leaderboardType, pnlLeaderboardData, perpPnlLeaderboardData]
  )

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 flex space-x-3 lg:col-span-4 lg:flex-col lg:space-y-2 lg:space-x-0">
        <div className="w-full">
          <ButtonGroup
            activeValue={leaderboardRange}
            className="h-8"
            onChange={(r) => handleChangeRange(r)}
            values={leaderboardRangePresetValues}
            names={leaderboardRangePresetLabels}
          />
        </div>
        <LeaderboardTypeButton
          leaderboardType={leaderboardType}
          setLeaderboardType={setLeaderboardType}
          label="total-pnl"
          icon={<ChartPieIcon className="mr-3 hidden h-6 w-6 lg:block" />}
          fetchPerpPnlLeaderboard={fetchPerpPnlLeaderboard}
          fetchPnlLeaderboard={fetchPnlLeaderboard}
          leaderboardRange={leaderboardRange}
        />
        <LeaderboardTypeButton
          leaderboardType={leaderboardType}
          setLeaderboardType={setLeaderboardType}
          label="futures-only"
          icon={<TrendingUpIcon className="mr-3 hidden h-6 w-6 lg:block" />}
          fetchPerpPnlLeaderboard={fetchPerpPnlLeaderboard}
          fetchPnlLeaderboard={fetchPnlLeaderboard}
          leaderboardRange={leaderboardRange}
        />
      </div>
      <div className="col-span-12 lg:col-span-8">
        <h3 className="mb-4">
          Top 20{' '}
          <span className="text-sm font-normal text-th-fgd-4">
            (
            {leaderboardRange === '9999'
              ? 'All-time'
              : leaderboardRange === '29'
              ? 'Last 30 days'
              : `Last ${leaderboardRange} days`}
            )
          </span>
        </h3>
        {!loading ? (
          <div className="space-y-2">
            {leaderboardData.map((acc, i) => (
              <AccountCard
                rank={i + 1}
                acc={acc.mango_account}
                key={acc.mango_account}
                rawPnl={
                  leaderboardType === 'total-pnl' ? acc.pnl : acc.perp_pnl
                }
                pnl={
                  leaderboardType === 'total-pnl'
                    ? acc.pnl.toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        maximumFractionDigits: 0,
                      })
                    : usdFormatter(acc.perp_pnl)
                }
                walletPk={acc.wallet_pk}
                profile={acc.profile}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="h-[84px] w-full animate-pulse rounded-md bg-th-bkg-3" />
            <div className="h-[84px] w-full animate-pulse rounded-md bg-th-bkg-3" />
            <div className="h-[84px] w-full animate-pulse rounded-md bg-th-bkg-3" />
            <div className="h-[84px] w-full animate-pulse rounded-md bg-th-bkg-3" />
            <div className="h-[84px] w-full animate-pulse rounded-md bg-th-bkg-3" />
            <div className="h-[84px] w-full animate-pulse rounded-md bg-th-bkg-3" />
            <div className="h-[84px] w-full animate-pulse rounded-md bg-th-bkg-3" />
            <div className="h-[84px] w-full animate-pulse rounded-md bg-th-bkg-3" />
            <div className="h-[84px] w-full animate-pulse rounded-md bg-th-bkg-3" />
            <div className="h-[84px] w-full animate-pulse rounded-md bg-th-bkg-3" />
            <div className="h-[84px] w-full animate-pulse rounded-md bg-th-bkg-3" />
            <div className="h-[84px] w-full animate-pulse rounded-md bg-th-bkg-3" />
            <div className="h-[84px] w-full animate-pulse rounded-md bg-th-bkg-3" />
            <div className="h-[84px] w-full animate-pulse rounded-md bg-th-bkg-3" />
            <div className="h-[84px] w-full animate-pulse rounded-md bg-th-bkg-3" />
            <div className="h-[84px] w-full animate-pulse rounded-md bg-th-bkg-3" />
            <div className="h-[84px] w-full animate-pulse rounded-md bg-th-bkg-3" />
            <div className="h-[84px] w-full animate-pulse rounded-md bg-th-bkg-3" />
            <div className="h-[84px] w-full animate-pulse rounded-md bg-th-bkg-3" />
            <div className="h-[84px] w-full animate-pulse rounded-md bg-th-bkg-3" />
          </div>
        )}
      </div>
    </div>
  )
}

export default LeaderboardTable

const AccountCard = ({ rank, acc, rawPnl, profile, pnl, walletPk }) => {
  const router = useRouter()
  const medalColors =
    rank === 1
      ? {
          darkest: '#E4AF11',
          dark: '#F2C94C',
          light: '#FFCF40',
          lightest: '#FDE877',
        }
      : rank === 2
      ? {
          darkest: '#B8B8B8',
          dark: '#C0C0C0',
          light: '#C7C7C7',
          lightest: '#D8D6D6',
        }
      : {
          darkest: '#CD7F32',
          dark: '#E5994E',
          light: '#DBA36B',
          lightest: '#EFBF8D',
        }
  return (
    <div className="relative" key={acc}>
      {profile ? (
        <button
          className="absolute left-[118px] bottom-4 flex items-center space-x-2 rounded-full bg-th-bkg-button px-2 py-1 hover:brightness-[1.1] hover:filter"
          onClick={() =>
            router.push(`/profile?pk=${walletPk}`, undefined, { shallow: true })
          }
        >
          <p className="mb-0 text-xs capitalize text-th-fgd-3">
            {profile?.profile_name}
          </p>
        </button>
      ) : null}
      <a
        className="default-transition block flex h-[112px] w-full rounded-md bg-th-bkg-3 p-4 hover:bg-th-bkg-4 sm:h-[84px] sm:justify-between sm:pb-4"
        href={`https://trade.mango.markets/account?pubkey=${acc}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <p className="my-auto mr-4 flex w-5 justify-center font-bold">{rank}</p>
        <div className="relative my-auto">
          {rank < 4 ? (
            <MedalIcon
              className="absolute -top-1 -left-1 h-5 w-auto drop-shadow-lg"
              colors={medalColors}
            />
          ) : null}
          <ProfileImage
            imageSize="56"
            placeholderSize="32"
            publicKey={walletPk}
          />
        </div>
        <div className="ml-3 flex flex-col sm:flex-grow sm:flex-row sm:justify-between">
          <p className="mb-0 text-th-fgd-2">
            {abbreviateAddress(new PublicKey(acc))}
          </p>

          <span
            className={`flex items-center text-lg font-bold ${
              rawPnl > 0 ? 'text-th-green' : 'text-th-red'
            }`}
          >
            {pnl}
          </span>
        </div>
        <div className="my-auto ml-auto">
          <ChevronRightIcon className="ml-2 mt-0.5 h-5 w-5 text-th-fgd-3" />
        </div>
      </a>
    </div>
  )
}

const LeaderboardTypeButton = ({
  leaderboardType,
  setLeaderboardType,
  icon,
  label,
  fetchPnlLeaderboard,
  fetchPerpPnlLeaderboard,
  leaderboardRange,
}) => {
  const { t } = useTranslation('common')

  const onClick = (type) => {
    setLeaderboardType(type)
    if (type === 'total-pnl') {
      fetchPnlLeaderboard(leaderboardRange)
    } else {
      fetchPerpPnlLeaderboard(leaderboardRange)
    }
  }
  return (
    <button
      className={`relative flex w-full items-center justify-center rounded-md p-4 text-center lg:h-[84px] lg:justify-start lg:text-left ${
        leaderboardType === label
          ? 'bg-th-bkg-4 text-th-fgd-1 after:absolute after:top-[100%] after:left-1/2 after:-translate-x-1/2 after:transform after:border-l-[12px] after:border-r-[12px] after:border-t-[12px] after:border-l-transparent after:border-t-th-bkg-4 after:border-r-transparent lg:after:left-[100%] lg:after:top-1/2  lg:after:-translate-x-0 lg:after:-translate-y-1/2 lg:after:border-r-0 lg:after:border-b-[12px] lg:after:border-t-transparent lg:after:border-b-transparent lg:after:border-l-th-bkg-4'
          : 'bg-th-bkg-3 text-th-fgd-4 hover:bg-th-bkg-4'
      }`}
      onClick={() => onClick(label)}
    >
      {icon}
      <div className="font-bold sm:text-lg">{t(label)}</div>
    </button>
  )
}
