import { useState } from 'react'
import useMangoStats from '../../hooks/useMangoStats'
import Chart from '../Chart'

const icons = {
  BTC: '/assets/icons/btc.svg',
  ETH: '/assets/icons/eth.svg',
  SOL: '/assets/icons/sol.svg',
  SRM: '/assets/icons/srm.svg',
  USDT: '/assets/icons/usdt.svg',
  USDC: '/assets/icons/usdc.svg',
  WUSDT: '/assets/icons/usdt.svg',
}

export default function StatsPerps() {
  const [selectedAsset, setSelectedAsset] = useState<string>('BTC')
  const { latestStats, stats } = useMangoStats()

  const selectedStatsData = stats.filter((stat) => stat.name === selectedAsset)

  return (
    <>
      <div className="flex flex-col-reverse items-center sm:flex-row sm:justify-between sm:h-12 mb-4 w-full">
        <AssetHeader asset={selectedAsset} />
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
      <div className="grid grid-flow-col grid-cols-1 grid-rows-1 gap-4 pb-8">
        <div
          className="border border-th-bkg-3 relative p-4 rounded-md"
          style={{ height: '300px' }}
        >
          <Chart
            title="Funding Rate"
            xAxis="time"
            yAxis="fundingRate"
            data={selectedStatsData}
            labelFormat={(x) => `${(x * 100).toFixed(5)}%`}
            type="bar"
          />
        </div>
      </div>
    </>
  )
}

const AssetHeader = ({ asset }) => {
  switch (asset) {
    case 'BTC':
      return (
        <div className="flex items-center text-xl text-th-fgd-1">
          <img
            src={icons[asset]}
            alt={icons[asset]}
            width="24"
            height="24"
            className="mr-2.5"
          />
          Bitcoin
        </div>
      )
    case 'ETH':
      return (
        <div className="flex items-center text-xl text-th-fgd-1">
          <img
            src={icons[asset]}
            alt={icons[asset]}
            width="24"
            height="24"
            className="mr-2.5"
          />
          Ethereum
        </div>
      )
    case 'SOL':
      return (
        <div className="flex items-center text-xl text-th-fgd-1">
          <img
            src={icons[asset]}
            alt={icons[asset]}
            width="24"
            height="24"
            className="mr-2.5"
          />
          Solana
        </div>
      )
    case 'SRM':
      return (
        <div className="flex items-center text-xl text-th-fgd-1">
          <img
            src={icons[asset]}
            alt={icons[asset]}
            width="24"
            height="24"
            className="mr-2.5"
          />
          Serum
        </div>
      )
    case 'USDC':
      return (
        <div className="flex items-center text-xl text-th-fgd-1">
          <img
            src={icons[asset]}
            alt={icons[asset]}
            width="24"
            height="24"
            className="mr-2.5"
          />
          USD Coin
        </div>
      )
    default:
      return (
        <div className="flex items-center text-xl text-th-fgd-1">
          <img
            src={icons[asset]}
            alt={icons[asset]}
            width="24"
            height="24"
            className="mr-2.5"
          />
          Bitcoin
        </div>
      )
  }
}
