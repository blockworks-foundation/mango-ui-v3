import { PerpMarket } from '@blockworks-foundation/mango-client'
import { useState } from 'react'
import useMangoGroupConfig from '../../hooks/useMangoGroupConfig'
import useMangoStore from '../../stores/useMangoStore'
import Chart from '../Chart'
import BN from 'bn.js'
import { tokenPrecision } from '../../utils'
import { useTranslation } from 'next-i18next'

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
  const basePriceInBaseLots =
    oraclePrice * perpMarket.baseLotsToNumber(new BN(1))
  return (fundingInQuoteDecimals / basePriceInBaseLots) * 100
}

export default function StatsPerps({ perpStats }) {
  const { t } = useTranslation('common')
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
  let selectedStatsData = perpStats.filter(
    (stat) => stat.name === selectedAsset
  )

  if (selectedAsset == 'SOL-PERP') {
    const startTimestamp = 1632160800000
    selectedStatsData = selectedStatsData.filter(
      (stat) => new Date(stat.hourly).getTime() >= startTimestamp
    )
  }

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
      openInterest: selectedMarket.baseLotsToNumber(x.openInterest) / 2,
      time: x.hourly,
    }
  })

  if (selectedAsset === 'BTC-PERP') {
    const index = perpsData.findIndex(
      (x) => x.time === '2021-09-15T05:00:00.000Z'
    )
    perpsData.splice(index, 1)
  }

  return (
    <>
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between mb-4 w-full">
        <AssetHeader asset={selectedAsset} />
        <div className="flex mb-4 sm:mb-0 space-x-2">
          {marketConfigs.map((market) => (
            <div
              className={`bg-th-bkg-3 cursor-pointer default-transition px-2 py-1 rounded-md text-center w-full whitespace-nowrap
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
      <div className="grid grid-flow-col grid-cols-1 grid-rows-2 md:grid-cols-2 md:grid-rows-1 gap-2 sm:gap-4">
        <div
          className="border border-th-bkg-4 relative p-4 rounded-md"
          style={{ height: '330px' }}
        >
          <Chart
            title={t('average-funding')}
            xAxis="time"
            yAxis="fundingRate"
            data={perpsData}
            labelFormat={(x) => `${x.toFixed(4)}%`}
            tickFormat={(x) =>
              x.toLocaleString(undefined, { maximumFractionDigits: 4 })
            }
            type="area"
          />
        </div>
        <div
          className="border border-th-bkg-4 relative p-4 rounded-md"
          style={{ height: '330px' }}
        >
          <Chart
            title={t('open-interest')}
            xAxis="time"
            yAxis="openInterest"
            data={perpsData}
            labelFormat={(x) =>
              x &&
              x.toLocaleString(undefined, {
                maximumFractionDigits:
                  tokenPrecision[selectedMarketConfig.baseSymbol],
              }) + selectedMarketConfig.baseSymbol
            }
            type="area"
          />
        </div>
      </div>
    </>
  )
}

const AssetHeader = ({ asset }) => {
  const { t } = useTranslation('common')

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
          Bitcoin {t('perpetual-futures')}
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
          Ethereum {t('perpetual-futures')}
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
          Solana {t('perpetual-futures')}
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
          Serum {t('perpetual-futures')}
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
          Bitcoin {t('perpetual-futures')}
        </div>
      )
  }
}
