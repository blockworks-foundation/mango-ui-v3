import { PerpMarket } from '@blockworks-foundation/mango-client'
import { useState } from 'react'
import useMangoGroupConfig from '../../hooks/useMangoGroupConfig'
import useMangoStore from '../../stores/useMangoStore'
import Chart from '../Chart'
import BN from 'bn.js'
import { tokenPrecision } from '../../utils'
import { useTranslation } from 'next-i18next'
import Select from '../Select'

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

  const progress =
    1 -
    selectedMarket.liquidityMiningInfo.mngoLeft.toNumber() /
      selectedMarket.liquidityMiningInfo.mngoPerPeriod.toNumber()
  const start = selectedMarket.liquidityMiningInfo.periodStart.toNumber()
  const now = Date.now() / 1000
  const elapsed = now - start
  const est = start + elapsed / progress

  const lmi = selectedMarket.liquidityMiningInfo

  const selectedBaseAsset = selectedAsset.split('-')[0]
  const maxDepthUi =
    (lmi.maxDepthBps.toNumber() * selectedMarket.baseLotSize.toNumber()) /
    Math.pow(10, selectedMarket.baseDecimals)

  return (
    <>
      <div className="flex items-center justify-between mb-4 w-full">
        <div className="flex items-center text-xl text-th-fgd-1">
          <img
            width="24"
            height="24"
            src={`/assets/icons/${selectedAsset
              .split(/-|\//)[0]
              .toLowerCase()}.svg`}
            className="mr-2.5"
          />
          {selectedAsset.split(/-|\//)[0]} {t('perpetual-futures')}
        </div>
        <Select
          value={selectedAsset}
          onChange={(a) => setSelectedAsset(a)}
          className="flex-shrink-0 ml-4 w-36 md:hidden"
        >
          <div className="space-y-2">
            {marketConfigs.map((market) => (
              <Select.Option
                key={market.name}
                value={market.name}
                className={`bg-th-bkg-1 relative rounded-md w-full px-3 py-3 cursor-pointer default-transition flex hover:bg-th-bkg-3 focus:outline-none`}
              >
                <div className="flex items-center justify-between w-full">
                  {market.name}
                </div>
              </Select.Option>
            ))}
          </div>
        </Select>
        <div className="hidden md:flex space-x-2">
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
              {market.name.slice(0, -5)}
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-flow-row grid-cols-1 grid-rows-2 md:grid-cols-2 md:grid-rows-2 gap-2 sm:gap-4">
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
        <div className="border border-th-bkg-4 relative p-4 rounded-md">
          <div className="text-lg">Liquidity Mining</div>
          <div className="flex justify-between mt-4">
            <div>Depth Rewarded</div>
            <div>{maxDepthUi.toString() + ' ' + selectedBaseAsset}</div>
          </div>
          <div className="flex justify-between mt-4">
            <div>Target Period Length</div>
            <div>
              {(
                selectedMarket.liquidityMiningInfo.targetPeriodLength.toNumber() /
                60
              ).toFixed()}{' '}
              mins
            </div>
          </div>
          <div className="flex justify-between mt-4">
            <div>MNGO Per Period</div>
            <div>
              {(
                selectedMarket.liquidityMiningInfo.mngoPerPeriod.toNumber() /
                Math.pow(10, 6)
              ).toFixed(2)}
            </div>
          </div>
          <div className="flex justify-between mt-4">
            <div>MNGO Left In Period</div>
            <div>
              {(
                selectedMarket.liquidityMiningInfo.mngoLeft.toNumber() /
                Math.pow(10, 6)
              ).toFixed(2)}
            </div>
          </div>

          <div className="flex justify-between mt-4">
            <div>Est Period End</div>
            <div>{new Date(est * 1000).toUTCString()}</div>
          </div>
          <div className="flex justify-between mt-4">
            <div>Period Progress</div>
            <div>{(progress * 100).toFixed(2)}%</div>
          </div>
        </div>
      </div>
    </>
  )
}
