import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { Table, Td, Th, TrBody, TrHead } from './TableElements'
import { usdFormatter } from '../utils'
import { AwardIcon, TrophyIcon } from './icons'
import { useTranslation } from 'next-i18next'
import { TrophyHeroIcon } from './icons'
import { ChartPieIcon, TrendingUpIcon } from '@heroicons/react/outline'

const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const LeaderboardTable = ({ range = '30' }) => {
  const { t } = useTranslation('common')
  const [pnlLeaderboardData, setPnlLeaderboardData] = useState<any[]>([])
  const [perpPnlLeaderboardData, setPerpPnlLeaderboardData] = useState<any[]>(
    []
  )
  const [leaderboardType, setLeaderboardType] = useState<string>('pnl')
  const [loading, setLoading] = useState(false)

  const fetchPnlLeaderboard = async () => {
    setLoading(true)
    const response = await fetch(
      `https://mango-transaction-log.herokuapp.com/v3/stats/pnl-leaderboard?start-date=${dayjs()
        .subtract(parseInt(range), 'day')
        .format('YYYY-MM-DD')}`
    )
    const parsedResponse = await response.json()
    setPnlLeaderboardData(parsedResponse)

    setLoading(false)
  }

  const fetchPerpPnlLeaderboard = async () => {
    setLoading(true)
    const response = await fetch(
      `https://mango-transaction-log.herokuapp.com/v3/stats/perp-pnl-leaderboard?start-date=${dayjs()
        .subtract(parseInt(range), 'day')
        .format('YYYY-MM-DD')}`
    )
    const parsedResponse = await response.json()
    setPerpPnlLeaderboardData(parsedResponse)

    setLoading(false)
  }

  useEffect(() => {
    if (leaderboardType === 'pnl') {
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
      leaderboardType === 'pnl' ? pnlLeaderboardData : perpPnlLeaderboardData,
    [leaderboardType, pnlLeaderboardData, perpPnlLeaderboardData]
  )

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-4 space-y-4">
        <button
          className={`relative flex w-full items-center rounded-md p-4 text-left ${
            leaderboardType === 'pnl'
              ? 'bg-th-bkg-4 text-th-fgd-1 after:absolute after:left-[100%] after:top-1/2 after:-translate-y-1/2 after:transform after:border-l-[12px] after:border-b-[12px] after:border-t-[12px] after:border-l-th-bkg-4 after:border-b-transparent after:border-t-transparent'
              : 'bg-th-bkg-3 text-th-fgd-4 hover:bg-th-bkg-4'
          }`}
          onClick={() => setLeaderboardType('pnl')}
        >
          <ChartPieIcon className="mr-2 h-6 w-6" />
          <div>
            <div className="text-base font-bold">Total PnL</div>
            <span className="mb-0 text-th-fgd-4">
              {range === '9999'
                ? 'All-time Leaderboard'
                : `${range} Day Leaderboard`}
            </span>
          </div>
        </button>
        <button
          className={`relative flex w-full items-center rounded-md p-4 text-left ${
            leaderboardType === 'perp-pnl'
              ? 'bg-th-bkg-4 text-th-fgd-1 after:absolute after:left-[100%] after:top-1/2 after:-translate-y-1/2 after:transform after:border-l-[12px] after:border-b-[12px] after:border-t-[12px] after:border-l-th-bkg-4 after:border-b-transparent after:border-t-transparent'
              : 'bg-th-bkg-3 text-th-fgd-4 hover:bg-th-bkg-4'
          }`}
          onClick={() => setLeaderboardType('perp-pnl')}
        >
          <TrendingUpIcon className="mr-2 h-6 w-6" />
          <div>
            <div className="text-base font-bold">Futures Only</div>
            <span className="text-th-fgd-4">
              {range === '9999'
                ? 'All-time Leaderboard'
                : `${range} Day Leaderboard`}
            </span>
          </div>
        </button>
      </div>

      <div className={`col-span-8`}>
        {loading ? (
          <div className="mb-4 h-28 w-full animate-pulse rounded-md bg-th-bkg-3" />
        ) : leaderboardData.length > 0 ? (
          <div className="mb-6 flex items-center space-x-4 rounded-md bg-gradient-to-b from-th-bkg-4 to-th-bkg-3 py-4 px-6">
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-th-bkg-2">
              <TrophyHeroIcon className="h-12 w-auto drop-shadow-xl" />
            </div>
            <div className="flex w-full items-center justify-between">
              <div>
                <p className="mb-0 text-2xl font-bold text-th-fgd-1">#1</p>
                <p className="mb-0 text-base">{`${leaderboardData[0].mango_account.slice(
                  0,
                  5
                )}...${leaderboardData[0].mango_account.slice(-5)}`}</p>
              </div>
              <div>
                <span className="text-2xl font-bold text-th-fgd-1">
                  {leaderboardType === 'pnl'
                    ? usdFormatter(leaderboardData[0].pnl)
                    : usdFormatter(leaderboardData[0].perp_pnl)}
                </span>
                <a
                  href={`https://trade.mango.markets/account?pubkey=${leaderboardData[0].mango_account}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="default-transition block text-right text-base text-th-fgd-3 hover:text-th-fgd-4"
                >
                  {t('view-account')}
                </a>
              </div>
            </div>
          </div>
        ) : null}
        <div className={`overflow-x-auto sm:-mx-6 lg:-mx-8`}>
          <div
            className={`inline-block min-w-full align-middle sm:px-6 lg:px-8`}
          >
            {!loading ? (
              <div
                className={`overflow-hidden border-b border-th-bkg-2 shadow`}
              >
                <Table>
                  <thead>
                    <TrHead>
                      <Th>{t('rank')}</Th>
                      <Th>{t('account')}</Th>
                      <Th>{t('pnl')}</Th>
                    </TrHead>
                  </thead>
                  <tbody>
                    {leaderboardData.slice(1).map((acc, index) => {
                      const rank = index + 2
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
                            {`${acc.mango_account.slice(
                              0,
                              5
                            )}...${acc.mango_account.slice(-5)}`}
                          </Td>
                          <Td className="w-1/3">
                            {leaderboardType === 'pnl'
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
