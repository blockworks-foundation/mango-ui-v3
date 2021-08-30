import { useState } from 'react'
import Chart from '../Chart'

const icons = {
  BTC: '/assets/icons/btc.svg',
  ETH: '/assets/icons/eth.svg',
  SOL: '/assets/icons/sol.svg',
  SRM: '/assets/icons/srm.svg',
  USDT: '/assets/icons/usdt.svg',
  USDC: '/assets/icons/usdc.svg',
  MNGO: '/assets/icons/mngo.svg',
}

const dailyStartTime = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).getTime()
const weeklyStartTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime()

const getAverageStats = (stats, startFrom, type) => {
  const timeFilteredStats = stats.filter(
    (d) => new Date(d.time).getTime() > startFrom
  )
  const sum = timeFilteredStats.map((s) => s[type]).reduce((a, b) => a + b, 0)
  const avg = sum / timeFilteredStats.length || 0

  return (avg * 100).toFixed(4)
}

const AverageInterest = ({ periodLabel, statTypeLabel, interest }) => {
  return (
    <>
      <div className="text-2xl font-bold text-center text-th-fgd-4">
        {periodLabel}
      </div>
      <div className="text-center text-th-fgd-3 text-sm mt-1 font-extrabold">
        {statTypeLabel}
      </div>
      <div className="text-center text-3xl mt-3">{interest}%</div>
    </>
  )
}

export default function StatsAssets({ latestStats, stats }) {
  const [selectedAsset, setSelectedAsset] = useState<string>('BTC')

  const selectedStatsData = stats.filter((stat) => stat.name === selectedAsset)

  return (
    <>
      <div className="flex flex-col-reverse items-center sm:flex-row sm:justify-between sm:h-12 mb-4 w-full">
        <div className="flex items-center text-xl text-th-fgd-1">
          <img
            src={icons[selectedAsset]}
            alt={icons[selectedAsset]}
            width="24"
            height="24"
            className="mr-2.5"
          />
          {selectedAsset}
        </div>
        <div className="flex pb-4 sm:pb-0">
          {latestStats.map((stat) => (
            <div
              className={`px-2 py-1 ml-2 rounded-md cursor-pointer default-transition bg-th-bkg-3
              ${
                selectedAsset === stat.name
                  ? `ring-1 ring-inset ring-th-primary text-th-primary`
                  : `text-th-fgd-1 opacity-50 hover:opacity-100`
              }
            `}
              onClick={() => setSelectedAsset(stat.name)}
              key={stat.name as string}
            >
              {stat.name}
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-flow-col grid-cols-1 grid-rows-4 md:grid-cols-2 md:grid-rows-2 gap-4 pb-8">
        <div
          className="border border-th-bkg-3 relative md:mb-0 p-4 rounded-md"
          style={{ height: '300px' }}
        >
          <Chart
            title="Total Deposits"
            xAxis="time"
            yAxis="totalDeposits"
            data={selectedStatsData}
            labelFormat={(x) =>
              x.toLocaleString(undefined, { maximumFractionDigits: 2 })
            }
            type="area"
          />
        </div>
        <div
          className="border border-th-bkg-3 relative p-4 rounded-md"
          style={{ height: '300px' }}
        >
          <Chart
            title="Deposit Interest"
            xAxis="time"
            yAxis="depositRate"
            data={selectedStatsData}
            labelFormat={(x) => `${(x * 100).toFixed(5)}%`}
            type="bar"
          />
        </div>
        <div
          className="border border-th-bkg-3 relative md:mb-0 p-4 rounded-md"
          style={{ height: '300px' }}
        >
          <Chart
            title="Total Borrows"
            xAxis="time"
            yAxis="totalBorrows"
            data={selectedStatsData}
            labelFormat={(x) =>
              x.toLocaleString(undefined, { maximumFractionDigits: 2 })
            }
            type="area"
          />
        </div>
        <div
          className="border border-th-bkg-3 relative p-4 rounded-md"
          style={{ height: '300px' }}
        >
          <Chart
            title="Borrow Interest"
            xAxis="time"
            yAxis="borrowRate"
            data={selectedStatsData}
            labelFormat={(x) => `${(x * 100).toFixed(5)}%`}
            type="bar"
          />
        </div>
      </div>
      <div className="grid md:grid-flow-col gap-4">
        <div className="border border-th-bkg-3 relative p-4 rounded-md">
          <AverageInterest
            periodLabel="24h Avg"
            statTypeLabel="Deposit Interest"
            interest={getAverageStats(
              selectedStatsData,
              dailyStartTime,
              'depositRate'
            )}
          />
        </div>
        <div className="border border-th-bkg-3 relative p-4 rounded-md">
          <AverageInterest
            periodLabel="7d Avg"
            statTypeLabel="Deposit Interest"
            interest={getAverageStats(
              selectedStatsData,
              weeklyStartTime,
              'depositRate'
            )}
          />
        </div>
        <div className="border border-th-bkg-3 relative p-4 rounded-md">
          <AverageInterest
            periodLabel="24h Avg"
            statTypeLabel="Borrow Interest"
            interest={getAverageStats(
              selectedStatsData,
              dailyStartTime,
              'borrowRate'
            )}
          />
        </div>
        <div className="border border-th-bkg-3 relative p-4 rounded-md">
          <AverageInterest
            periodLabel="7d Avg"
            statTypeLabel="Borrow Interest"
            interest={getAverageStats(
              selectedStatsData,
              weeklyStartTime,
              'borrowRate'
            )}
          />
        </div>
      </div>
    </>
  )
}
