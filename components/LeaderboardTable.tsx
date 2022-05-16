import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { Table, Td, Th, TrBody, TrHead } from './TableElements'
import { usdFormatter } from '../utils'
import { AwardIcon, MedalIcon, ProfileIcon, TrophyIcon } from './icons'
import { useTranslation } from 'next-i18next'
import { ChartPieIcon, TrendingUpIcon } from '@heroicons/react/outline'
import { getProfilePicture } from '@solflare-wallet/pfp'
import useMangoStore from '../stores/useMangoStore'
import { connectionSelector } from '../stores/selectors'

const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const LeaderboardTable = ({ range = '29' }) => {
  const { t } = useTranslation('common')
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
      <div className="col-span-12 flex space-x-3 lg:col-span-4 lg:flex-col lg:space-y-4 lg:space-x-0">
        <LeaderboardTypeButton
          leaderboardType={leaderboardType}
          setLeaderboardType={setLeaderboardType}
          range={range}
          label="total-pnl"
          icon={<ChartPieIcon className="mr-2 hidden h-6 w-6 lg:block" />}
        />
        <LeaderboardTypeButton
          leaderboardType={leaderboardType}
          setLeaderboardType={setLeaderboardType}
          range={range}
          label="futures-only"
          icon={<TrendingUpIcon className="mr-2 hidden h-6 w-6 lg:block" />}
        />
      </div>
      <div className="col-span-12 lg:col-span-8">
        {loading ? (
          <div className="mb-6 space-y-2">
            <div className="h-24 w-full animate-pulse rounded-lg bg-th-bkg-3" />
            <div className="h-24 w-full animate-pulse rounded-lg bg-th-bkg-3" />
            <div className="h-24 w-full animate-pulse rounded-lg bg-th-bkg-3" />
          </div>
        ) : leaderboardData.length > 0 ? (
          <div className="mb-6 space-y-2">
            <TopThreeCard
              rank={1}
              acc={leaderboardData[0].mango_account}
              pnl={
                leaderboardType === 'total-pnl'
                  ? usdFormatter(leaderboardData[0].pnl)
                  : usdFormatter(leaderboardData[0].perp_pnl)
              }
              pfp={leaderboardData[0].pfp}
            />
            <TopThreeCard
              rank={2}
              acc={leaderboardData[1].mango_account}
              pnl={
                leaderboardType === 'total-pnl'
                  ? usdFormatter(leaderboardData[1].pnl)
                  : usdFormatter(leaderboardData[1].perp_pnl)
              }
              pfp={leaderboardData[0].pfp}
            />
            <TopThreeCard
              rank={3}
              acc={leaderboardData[2].mango_account}
              pnl={
                leaderboardType === 'total-pnl'
                  ? usdFormatter(leaderboardData[2].pnl)
                  : usdFormatter(leaderboardData[2].perp_pnl)
              }
              pfp={leaderboardData[0].pfp}
            />
          </div>
        ) : null}
        <div className={`overflow-x-auto sm:-mx-6 lg:-mx-8`}>
          <div
            className={`inline-block min-w-full align-middle sm:px-6 lg:px-8`}
          >
            {!loading ? (
              <div className={`overflow-hidden`}>
                <Table>
                  <thead>
                    <TrHead>
                      <Th>{t('rank')}</Th>
                      <Th>{t('account')}</Th>
                      <Th>{t('pnl')}</Th>
                    </TrHead>
                  </thead>
                  <tbody>
                    {leaderboardData.slice(3).map((acc, index) => {
                      const rank = index + 4
                      return (
                        <TrBody key={acc.mango_account}>
                          <Td className="w-1/10">
                            <div className="flex items-center">
                              {rank}
                              {rank === 1 ? (
                                <TrophyIcon className="ml-1.5 h-5 w-5 text-th-primary" />
                              ) : null}
                              {rank === 2 || rank === 3 ? (
                                <AwardIcon className="ml-1.5 h-5 w-5 text-th-primary-dark" />
                              ) : null}
                            </div>
                          </Td>
                          <Td className="w-1/3">
                            <div className="flex items-center">
                              <div className="mr-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-th-bkg-4">
                                {acc.pfp?.isAvailable ? (
                                  <img
                                    alt=""
                                    src={acc.pfp.url}
                                    className={`default-transition h-8 w-8 rounded-full hover:opacity-60
      `}
                                  />
                                ) : (
                                  <ProfileIcon
                                    className={`h-5 w-5 text-th-fgd-3`}
                                  />
                                )}
                              </div>
                              {`${acc.mango_account.slice(
                                0,
                                5
                              )}...${acc.mango_account.slice(-5)}`}
                            </div>
                          </Td>
                          <Td className="w-1/3">
                            {leaderboardType === 'total-pnl'
                              ? usdFormatter(acc.pnl)
                              : usdFormatter(acc.perp_pnl)}
                          </Td>
                          <Td className="w-1/5">
                            <div className="flex justify-end">
                              <a
                                href={`https://trade.mango.markets/account?pubkey=${acc.mango_account}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="default-transition text-th-fgd-3 hover:text-th-fgd-4"
                              >
                                {t('view-account')}
                              </a>
                            </div>
                          </Td>
                        </TrBody>
                      )
                    })}
                  </tbody>
                </Table>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="h-8 w-full animate-pulse rounded-md bg-th-bkg-3" />
                <div className="h-16 w-full animate-pulse rounded-md bg-th-bkg-3" />
                <div className="h-16 w-full animate-pulse rounded-md bg-th-bkg-3" />
                <div className="h-16 w-full animate-pulse rounded-md bg-th-bkg-3" />
                <div className="h-16 w-full animate-pulse rounded-md bg-th-bkg-3" />
                <div className="h-16 w-full animate-pulse rounded-md bg-th-bkg-3" />
                <div className="h-16 w-full animate-pulse rounded-md bg-th-bkg-3" />
                <div className="h-16 w-full animate-pulse rounded-md bg-th-bkg-3" />
                <div className="h-16 w-full animate-pulse rounded-md bg-th-bkg-3" />
                <div className="h-16 w-full animate-pulse rounded-md bg-th-bkg-3" />
                <div className="h-16 w-full animate-pulse rounded-md bg-th-bkg-3" />
                <div className="h-16 w-full animate-pulse rounded-md bg-th-bkg-3" />
                <div className="h-16 w-full animate-pulse rounded-md bg-th-bkg-3" />
                <div className="h-16 w-full animate-pulse rounded-md bg-th-bkg-3" />
                <div className="h-16 w-full animate-pulse rounded-md bg-th-bkg-3" />
                <div className="h-16 w-full animate-pulse rounded-md bg-th-bkg-3" />
                <div className="h-16 w-full animate-pulse rounded-md bg-th-bkg-3" />
                <div className="h-16 w-full animate-pulse rounded-md bg-th-bkg-3" />
                <div className="h-16 w-full animate-pulse rounded-md bg-th-bkg-3" />
                <div className="h-16 w-full animate-pulse rounded-md bg-th-bkg-3" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LeaderboardTable

const TopThreeCard = ({ rank, acc, pnl, pfp }) => {
  const { t } = useTranslation('common')
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
    <div className="flex items-center rounded-lg border border-th-bkg-4 p-4">
      <p className="mb-0 mr-4">{rank}</p>
      <div className="relative mr-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-th-bkg-4">
        <MedalIcon
          className="absolute -top-2 -left-2 h-5 w-auto drop-shadow-lg"
          colors={medalColors}
        />
        {pfp?.isAvailable ? (
          <img
            alt=""
            src={pfp.url}
            className={`default-transition h-10 w-10 rounded-full hover:opacity-60
      `}
          />
        ) : (
          <ProfileIcon className={`h-6 w-6 text-th-fgd-3`} />
        )}
      </div>
      <div className="flex w-full flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-0">{`${acc.slice(0, 5)}...${acc.slice(-5)}`}</p>
          <span className="text-base font-bold text-th-fgd-1 sm:text-lg">
            {pnl}
          </span>
        </div>
        <div>
          <a
            href={`https://trade.mango.markets/account?pubkey=${acc}`}
            target="_blank"
            rel="noopener noreferrer"
            className="default-transition block text-th-fgd-3 hover:text-th-fgd-4"
          >
            {t('view-account')}
          </a>
        </div>
      </div>
    </div>
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
      className={`relative flex w-full items-center justify-center rounded-md p-4 text-center lg:justify-start lg:text-left ${
        leaderboardType === label
          ? 'bg-th-bkg-4 text-th-fgd-1 after:absolute after:top-[100%] after:left-1/2 after:-translate-x-1/2 after:transform after:border-l-[12px] after:border-r-[12px] after:border-t-[12px] after:border-l-transparent after:border-t-th-bkg-4 after:border-r-transparent lg:after:left-[100%] lg:after:top-1/2  lg:after:-translate-x-0 lg:after:-translate-y-1/2 lg:after:border-r-0 lg:after:border-b-[12px] lg:after:border-t-transparent lg:after:border-b-transparent lg:after:border-l-th-bkg-4'
          : 'bg-th-bkg-3 text-th-fgd-4 hover:bg-th-bkg-4'
      }`}
      onClick={() => setLeaderboardType(label)}
    >
      {icon}
      <div>
        <div className="font-bold sm:text-base">{t(label)}</div>
        <span className="text-th-fgd-4">
          {range === '9999'
            ? 'All-time'
            : range === '29'
            ? '30-day'
            : `${range}-day`}
        </span>
      </div>
    </button>
  )
}
