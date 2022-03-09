import { PerpMarket } from '@blockworks-foundation/mango-client'
import { useState, useMemo } from 'react'
import useMangoGroupConfig from '../../hooks/useMangoGroupConfig'
import useMangoStore from '../../stores/useMangoStore'
import Chart from '../Chart'
import BN from 'bn.js'
import { perpContractPrecision } from '../../utils'
import { useTranslation } from 'next-i18next'
import Select from '../Select'
import { marketsSelector } from '../../stores/selectors'

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
  const marketDirectory = useMangoStore(marketsSelector)
  const markets = Object.values(marketDirectory)

  const perpMarkets = useMemo(() => {
    return markets.filter((m) => m instanceof PerpMarket) as PerpMarket[]
  }, [markets])

  const selectedMarket = useMemo(() => {
    return perpMarkets.find((m) =>
      m.publicKey.equals(selectedMarketConfig.publicKey)
    )
  }, [selectedMarketConfig, perpMarkets])

  const perpsData = useMemo(() => {
    if (perpStats.length === 0) return []

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

    return perpsData
  }, [selectedAsset, perpStats, selectedMarket])

  if (!selectedMarket) return null

  const progress =
    1 -
    selectedMarket.liquidityMiningInfo.mngoLeft.toNumber() /
      selectedMarket.liquidityMiningInfo.mngoPerPeriod.toNumber()
  const start = selectedMarket.liquidityMiningInfo.periodStart.toNumber()
  const now = Date.now() / 1000
  const elapsed = now - start
  const est = start + elapsed / progress

  const lmi = selectedMarket.liquidityMiningInfo

  const maxDepthUi =
    (lmi.maxDepthBps.toNumber() * selectedMarket.baseLotSize.toNumber()) /
    Math.pow(10, selectedMarket.baseDecimals)

  return (
    <>
      <div className="mb-4 flex flex-row-reverse items-center justify-between md:flex-col md:items-stretch">
        <Select
          value={selectedAsset}
          onChange={(a) => setSelectedAsset(a)}
          className="ml-4 w-36 flex-shrink-0 md:hidden"
        >
          {marketConfigs.map((market) => (
            <Select.Option key={market.name} value={market.name}>
              {market.name}
            </Select.Option>
          ))}
        </Select>
        <div className="mb-4 hidden rounded-md bg-th-bkg-3 px-3 py-2 md:-mx-6 md:mb-6 md:-mt-6 md:flex md:rounded-none md:rounded-t-md md:px-4">
          {marketConfigs.map((market, index) => (
            <div
              className={`py-1 text-xs font-bold md:px-2 md:text-sm ${
                index > 0 ? 'ml-4 md:ml-2' : null
              } default-transition cursor-pointer rounded-md
                          ${
                            selectedAsset === market.name
                              ? `text-th-primary`
                              : `text-th-fgd-3 hover:text-th-fgd-1`
                          }
                        `}
              onClick={() => setSelectedAsset(market.name)}
              key={market.name as string}
            >
              {market.baseSymbol}
            </div>
          ))}
        </div>
        <div className="flex items-center text-xl text-th-fgd-1">
          <img
            width="24"
            height="24"
            src={`/assets/icons/${selectedAsset
              .split(/-|\//)[0]
              .toLowerCase()}.svg`}
            className="mr-2.5"
          />
          <h2>
            {selectedAsset.split(/-|\//)[0]} {t('perpetual-futures')}
          </h2>
        </div>
      </div>
      <div className="grid grid-flow-row grid-cols-1 grid-rows-2 gap-2 sm:gap-4 md:grid-cols-2 md:grid-rows-2">
        <div
          className="relative rounded-md border border-th-bkg-3 p-4"
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
          className="relative rounded-md border border-th-bkg-3 p-4"
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
                  perpContractPrecision[selectedMarketConfig.baseSymbol],
              }) +
                ' ' +
                selectedMarketConfig.baseSymbol
            }
            type="area"
          />
        </div>
        <div className="relative rounded-md border border-th-bkg-3 p-4">
          <h2>{t('liquidity-mining')}</h2>
          <div className="mt-4 flex justify-between">
            <div>{t('depth-rewarded')}</div>
            <div>
              {maxDepthUi.toLocaleString() +
                ' ' +
                selectedMarketConfig.baseSymbol}
            </div>
          </div>
          <div className="mt-4 flex justify-between">
            <div>{t('target-period-length')}</div>
            <div>
              {(
                selectedMarket.liquidityMiningInfo.targetPeriodLength.toNumber() /
                60
              ).toFixed()}{' '}
              {t('minutes')}
            </div>
          </div>
          <div className="mt-4 flex justify-between">
            <div>{t('mngo-per-period')}</div>
            <div>
              {(
                selectedMarket.liquidityMiningInfo.mngoPerPeriod.toNumber() /
                Math.pow(10, 6)
              ).toFixed(2)}
            </div>
          </div>
          <div className="mt-4 flex justify-between">
            <div>{t('mngo-left-period')}</div>
            <div>
              {(
                selectedMarket.liquidityMiningInfo.mngoLeft.toNumber() /
                Math.pow(10, 6)
              ).toFixed(2)}
            </div>
          </div>

          <div className="mt-4 flex justify-between">
            <div>{t('est-period-end')}</div>
            <div>{new Date(est * 1000).toUTCString()}</div>
          </div>
          <div className="mt-4 flex justify-between">
            <div>{t('period-progress')}</div>
            <div>{(progress * 100).toFixed(2)}%</div>
          </div>
        </div>
      </div>
    </>
  )
}
