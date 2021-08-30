import { PerpMarket } from '@blockworks-foundation/mango-client'
import { useState } from 'react'
import useMangoGroupConfig from '../../hooks/useMangoGroupConfig'
import useMangoStore from '../../stores/useMangoStore'
import Chart from '../Chart'

const icons = {
  'BTC-PERP': '/assets/icons/btc.svg',
  'ETH-PERP': '/assets/icons/eth.svg',
  'SOL-PERP': '/assets/icons/sol.svg',
  'SRM-PERP': '/assets/icons/srm.svg',
  'USDT-PERP': '/assets/icons/usdt.svg',
  'MNGO-PERP': '/assets/icons/mngo.svg',
}

function calculateFundingRate(
  oldestLongFunding,
  oldestShortFunding,
  latestLongFunding,
  latestShortFunding,
  perpMarket,
  oraclePrice
) {
  if (!perpMarket || !oraclePrice) return 0.0

  // Averaging long and short funding excludes socialized loss
  const startFunding =
    (parseFloat(oldestLongFunding) + parseFloat(oldestShortFunding)) / 2
  const endFunding =
    (parseFloat(latestLongFunding) + parseFloat(latestShortFunding)) / 2
  const fundingDifference = endFunding - startFunding

  const fundingInQuoteDecimals =
    fundingDifference / Math.pow(10, perpMarket.quoteDecimals)

  // TODO - use avgPrice and discard oraclePrice once stats are better
  // const avgPrice = (latestStat.baseOraclePrice + oldestStat.baseOraclePrice) / 2
  const basePriceInBaseLots = oraclePrice * perpMarket.baseLotsToNumber(1)
  return (fundingInQuoteDecimals / basePriceInBaseLots) * 100
}

export default function StatsPerps({ perpStats }) {
  const [selectedAsset, setSelectedAsset] = useState<string>('BTC-PERP')
  const marketConfigs = useMangoGroupConfig().perpMarkets
  const selectedMarketConfig = marketConfigs.find(
    (m) => m.name === selectedAsset
  )
  const markets = Object.values(
    useMangoStore.getState().selectedMangoGroup.markets
  ).filter((m) => m instanceof PerpMarket) as PerpMarket[]
  const selectedMarket = markets.find((m) =>
    m.publicKey.equals(selectedMarketConfig.publicKey)
  )
  const selectedStatsData = perpStats.filter(
    (stat) => stat.name === selectedAsset
  )
  console.log(selectedStatsData)
  const perpsData = selectedStatsData.map((x) => {
    return {
      fundingRate: calculateFundingRate(
        x.oldestLongFunding,
        x.oldestShortFunding,
        x.latestLongFunding,
        x.latestShortFunding,
        selectedMarket,
        x.baseOraclePrice
      ),
      openInterest: x.openInterest,
      time: x.hourly,
    }
  })

  return (
    <>
      <div className="flex flex-col-reverse items-center sm:flex-row sm:justify-between sm:h-12 mb-4 w-full">
        <AssetHeader asset={selectedAsset} />
        <div className="flex pb-4 sm:pb-0">
          {marketConfigs.map((market) => (
            <div
              className={`px-2 py-1 ml-2 rounded-md cursor-pointer default-transition bg-th-bkg-3
              ${
                selectedAsset === market.name
                  ? `ring-1 ring-inset ring-th-primary text-th-primary`
                  : `text-th-fgd-1 opacity-50 hover:opacity-100`
              }
            `}
              onClick={() => setSelectedAsset(market.name)}
              key={market.name as string}
            >
              {market.name}
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
            data={perpsData}
            labelFormat={(x) => `${(x * 100).toFixed(5)}%`}
            type="area"
          />
        </div>
      </div>
      <div className="grid grid-flow-col grid-cols-1 grid-rows-1 gap-4 pb-8">
        <div
          className="border border-th-bkg-3 relative p-4 rounded-md"
          style={{ height: '300px' }}
        >
          <Chart
            title="Open Interest"
            xAxis="time"
            yAxis="openInterest"
            data={perpsData}
            labelFormat={(x) =>
              x &&
              '$' + x.toLocaleString(undefined, { maximumFractionDigits: 0 })
            }
            type="area"
          />
        </div>
      </div>
    </>
  )
}

const AssetHeader = ({ asset }) => {
  switch (asset) {
    case 'BTC-PERP':
      return (
        <div className="flex items-center text-xl text-th-fgd-1">
          <img
            src={icons[asset]}
            alt={icons[asset]}
            width="24"
            height="24"
            className="mr-2.5"
          />
          Bitcoin Perp
        </div>
      )
    case 'ETH-PERP':
      return (
        <div className="flex items-center text-xl text-th-fgd-1">
          <img
            src={icons[asset]}
            alt={icons[asset]}
            width="24"
            height="24"
            className="mr-2.5"
          />
          Ethereum Perp
        </div>
      )
    case 'SOL-PERP':
      return (
        <div className="flex items-center text-xl text-th-fgd-1">
          <img
            src={icons[asset]}
            alt={icons[asset]}
            width="24"
            height="24"
            className="mr-2.5"
          />
          Solana Perp
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
          Serum Perp
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
          Bitcoin Perp
        </div>
      )
  }
}
