import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { usdFormatter } from '../utils'
import { MedalIcon, ProfileIcon } from './icons'
import { useTranslation } from 'next-i18next'
import {
  ChartPieIcon,
  ExternalLinkIcon,
  TrendingUpIcon,
} from '@heroicons/react/outline'
import { getProfilePicture } from '@solflare-wallet/pfp'
import useMangoStore from '../stores/useMangoStore'
import { connectionSelector } from '../stores/selectors'

const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const LeaderboardTable = ({ range = '29' }) => {
  const [pnlLeaderboardData, setPnlLeaderboardData] = useState<any[]>([])
  const [perpPnlLeaderboardData, setPerpPnlLeaderboardData] = useState<any[]>(
    []
  )
  const [leaderboardType, setLeaderboardType] = useState<string>('total-pnl')
  const [loading, setLoading] = useState(false)
  const connection = useMangoStore(connectionSelector)

  const fetchPnlLeaderboard = async () => {
    setLoading(true)
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
    const leaderboardData = [] as any[]
    for (const item of parsedResponse) {
      const { isAvailable, url } = await getProfilePicture(
        connection,
        item.wallet_pk
      )
      leaderboardData.push({
        ...item,
        pfp: { isAvailable: isAvailable, url: url },
      })
    }
    setPnlLeaderboardData(leaderboardData)
    setLoading(false)
  }

  const fetchPerpPnlLeaderboard = async () => {
    setLoading(true)
    const response = await fetch(
      `https://mango-transaction-log.herokuapp.com/v3/stats/perp-pnl-leaderboard?start-date=${dayjs()
        .hour(0)
        .minute(0)
        .utc()
        .subtract(parseInt(range), 'day')
        .format('YYYY-MM-DDThh:00:00')}`
    )
    const parsedResponse = await response.json()
    setPerpPnlLeaderboardData(parsedResponse)

    setLoading(false)
  }

  useEffect(() => {
    if (leaderboardType === 'total-pnl') {
      fetchPnlLeaderboard()
    } else {
      fetchPerpPnlLeaderboard()
    }
  }, [range, leaderboardType])

  useEffect(() => {
    fetchPerpPnlLeaderboard()
  }, [])

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
        <LeaderboardTypeButton
          leaderboardType={leaderboardType}
          setLeaderboardType={setLeaderboardType}
          range={range}
          label="total-pnl"
          icon={<ChartPieIcon className="mr-3 hidden h-6 w-6 lg:block" />}
        />
        <LeaderboardTypeButton
          leaderboardType={leaderboardType}
          setLeaderboardType={setLeaderboardType}
          range={range}
          label="futures-only"
          icon={<TrendingUpIcon className="mr-3 hidden h-6 w-6 lg:block" />}
        />
      </div>
      <div className="col-span-12 lg:col-span-8">
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
                pfp={acc.pfp}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="h-20 w-full animate-pulse rounded-md bg-th-bkg-3" />
            <div className="h-20 w-full animate-pulse rounded-md bg-th-bkg-3" />
            <div className="h-20 w-full animate-pulse rounded-md bg-th-bkg-3" />
            <div className="h-20 w-full animate-pulse rounded-md bg-th-bkg-3" />
            <div className="h-20 w-full animate-pulse rounded-md bg-th-bkg-3" />
            <div className="h-20 w-full animate-pulse rounded-md bg-th-bkg-3" />
            <div className="h-20 w-full animate-pulse rounded-md bg-th-bkg-3" />
            <div className="h-20 w-full animate-pulse rounded-md bg-th-bkg-3" />
            <div className="h-20 w-full animate-pulse rounded-md bg-th-bkg-3" />
            <div className="h-20 w-full animate-pulse rounded-md bg-th-bkg-3" />
            <div className="h-20 w-full animate-pulse rounded-md bg-th-bkg-3" />
            <div className="h-20 w-full animate-pulse rounded-md bg-th-bkg-3" />
            <div className="h-20 w-full animate-pulse rounded-md bg-th-bkg-3" />
            <div className="h-20 w-full animate-pulse rounded-md bg-th-bkg-3" />
            <div className="h-20 w-full animate-pulse rounded-md bg-th-bkg-3" />
            <div className="h-20 w-full animate-pulse rounded-md bg-th-bkg-3" />
            <div className="h-20 w-full animate-pulse rounded-md bg-th-bkg-3" />
            <div className="h-20 w-full animate-pulse rounded-md bg-th-bkg-3" />
            <div className="h-20 w-full animate-pulse rounded-md bg-th-bkg-3" />
            <div className="h-20 w-full animate-pulse rounded-md bg-th-bkg-3" />
          </div>
        )}
      </div>
    </div>
  )
}

export default LeaderboardTable

const AccountCard = ({ rank, acc, pnl, pfp, rawPnl }) => {
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
    <a
      href={`https://trade.mango.markets/account?pubkey=${acc}`}
      target="_blank"
      rel="noopener noreferrer"
      className="default-transition flex items-center rounded-lg p-4 ring-1 ring-inset ring-th-bkg-4 hover:bg-th-bkg-3"
    >
      <p className="mb-0 mr-4 font-bold">{rank}</p>
      <div className="relative mr-3 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-th-bkg-4">
        {rank < 4 ? (
          <MedalIcon
            className="absolute -top-2 -left-2 h-5 w-auto drop-shadow-lg"
            colors={medalColors}
          />
        ) : null}
        {pfp?.isAvailable ? (
          <img
            alt=""
            src={pfp.url}
            className={`default-transition h-12 w-12 rounded-full hover:opacity-60
      `}
          />
        ) : (
          <ProfileIcon className={`h-7 w-7 text-th-fgd-3`} />
        )}
      </div>
      <div className="flex w-full flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-0 text-th-fgd-2">{`${acc.slice(0, 5)}...${acc.slice(
            -5
          )}`}</p>
        </div>
        <div>
          <div className="flex items-center">
            <span
              className={`text-base font-bold text-th-fgd-2 sm:text-lg ${
                rawPnl > 0 ? 'text-th-green' : 'text-th-red'
              }`}
            >
              {pnl}
            </span>
          </div>
        </div>
      </div>
      <ExternalLinkIcon className="ml-3 h-4 w-4 flex-shrink-0 text-th-fgd-3" />
    </a>
  )
}

const LeaderboardTypeButton = ({
  leaderboardType,
  setLeaderboardType,
  range,
  icon,
  label,
}) => {
  const { t } = useTranslation('common')
  return (
    <button
      className={`relative flex w-full items-center justify-center rounded-md p-4 text-center lg:h-20 lg:justify-start lg:text-left ${
        leaderboardType === label
          ? 'bg-th-bkg-3 text-th-fgd-1 after:absolute after:top-[100%] after:left-1/2 after:-translate-x-1/2 after:transform after:border-l-[12px] after:border-r-[12px] after:border-t-[12px] after:border-l-transparent after:border-t-th-bkg-3 after:border-r-transparent lg:after:left-[100%] lg:after:top-1/2  lg:after:-translate-x-0 lg:after:-translate-y-1/2 lg:after:border-r-0 lg:after:border-b-[12px] lg:after:border-t-transparent lg:after:border-b-transparent lg:after:border-l-th-bkg-3'
          : 'bg-th-bkg-2 text-th-fgd-3 md:hover:bg-th-bkg-3'
      }`}
      onClick={() => setLeaderboardType(label)}
    >
      {icon}
      <div>
        <div className="font-bold sm:text-lg">{t(label)}</div>
        <span className="text-th-fgd-4">
          {range === '9999'
            ? t('all-time')
            : range === '29'
            ? t('30-day')
            : t('range-day', {
                range: range,
              })}
        </span>
      </div>
    </button>
  )
}
