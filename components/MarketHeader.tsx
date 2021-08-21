import React, { useCallback, useMemo, useState } from 'react'
import useMangoStore from '../stores/useMangoStore'
import usePrevious from '../hooks/usePrevious'
import useInterval from '../hooks/useInterval'
import ChartApi from '../utils/chartDataConnector'
import UiLock from './UiLock'
import ManualRefresh from './ManualRefresh'
import useOraclePrice from '../hooks/useOraclePrice'
import DayHighLow from './DayHighLow'
import { useEffect } from 'react'
import { formatUsdValue } from '../utils'

function calculateFundingRate(perpStats, perpMarket, oraclePrice) {
  const oldestStat = perpStats[perpStats.length - 1]
  const latestStat = perpStats[0]

  if (!latestStat || !perpMarket) return null

  // Averaging long and short funding excludes socialized loss
  const startFunding =
    (parseFloat(oldestStat.longFunding) + parseFloat(oldestStat.shortFunding)) /
    2
  const endFunding =
    (parseFloat(latestStat.longFunding) + parseFloat(latestStat.shortFunding)) /
    2
  const fundingDifference = endFunding - startFunding

  const fundingInQuoteDecimals =
    fundingDifference / Math.pow(10, perpMarket.quoteDecimals)

  // TODO - use avgPrice and discard oraclePrice once stats are better
  // const avgPrice = (latestStat.baseOraclePrice + oldestStat.baseOraclePrice) / 2
  const basePriceInBaseLots = oraclePrice * perpMarket.baseLotsToNumber(1)
  return (fundingInQuoteDecimals / basePriceInBaseLots) * 100
}

function parseOpenInterest(perpStats, perpMarket) {
  if (!perpStats?.length || !perpMarket) return 0

  return perpMarket.baseLotsToNumber(perpStats[0].openInterest / 2)
}

const MarketHeader = () => {
  const oraclePrice = useOraclePrice()
  const groupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const selectedMarket = useMangoStore((s) => s.selectedMarket.current)
  const baseSymbol = marketConfig.baseSymbol
  const selectedMarketName = marketConfig.name
  const isPerpMarket = marketConfig.kind === 'perp'
  const previousMarketName: string = usePrevious(selectedMarketName)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const connected = useMangoStore((s) => s.wallet.connected)

  const [ohlcv, setOhlcv] = useState(null)
  const [loading, setLoading] = useState(false)
  const [perpStats, setPerpStats] = useState([])
  const [spotStats, setSpotStats] = useState(null)
  // const change = ohlcv ? ((ohlcv.c[0] - ohlcv.o[0]) / ohlcv.o[0]) * 100 : '--'
  const volume = ohlcv ? ohlcv.v[0] : '--'

  const fetchSpotStats = useCallback(async () => {
    const urlParams = new URLSearchParams({ mangoGroup: groupConfig.name })
    urlParams.append('market', selectedMarketName)
    const spotStats = await fetch(
      'https://mango-stats-v3.herokuapp.com/spot/change/24?' + urlParams
    )

    const parsedSpotStats = await spotStats.json()
    setSpotStats(parsedSpotStats)
  }, [selectedMarketName, groupConfig])

  const fetchPerpStats = useCallback(async () => {
    const perpStats = await fetch(
      `https://mango-stats-v3.herokuapp.com/perp/funding_rate?market=${selectedMarketName}`
    )
    const parsedPerpStats = await perpStats.json()
    setPerpStats(parsedPerpStats)
  }, [selectedMarketName])

  useEffect(() => {
    if (isPerpMarket) {
      fetchPerpStats()
    } else {
      fetchSpotStats()
    }
  }, [marketConfig])

  const fetchOhlcv = useCallback(async () => {
    if (!selectedMarketName) return

    // calculate from and to date (0:00UTC to 23:59:59UTC)
    const date = new Date()
    const utcFrom = new Date(
      Date.UTC(
        date.getFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        0,
        0,
        0
      )
    )
    const utcTo = new Date(
      Date.UTC(
        date.getFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        23,
        59,
        59
      )
    )

    const from = utcFrom.getTime() / 1000
    const to = utcTo.getTime() / 1000

    const ohlcv = await ChartApi.getOhlcv(selectedMarketName, '1D', from, to)
    if (ohlcv) {
      setOhlcv(ohlcv)
      setLoading(false)
    }
  }, [selectedMarketName])

  useInterval(async () => {
    fetchOhlcv()
  }, 5000)

  useMemo(() => {
    if (previousMarketName !== selectedMarketName) {
      setLoading(true)
    }
  }, [selectedMarketName])

  return (
    <div
      className={`flex items-end sm:items-center justify-between pt-4 px-6 md:pb-1 md:pt-8 md:px-6`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center">
        <div className="pb-3 sm:pb-0 pr-8">
          <div className="flex items-center">
            <img
              alt=""
              width="24"
              height="24"
              src={`/assets/icons/${baseSymbol.toLowerCase()}.svg`}
              className={`mr-2.5`}
            />

            <div className="font-semibold pr-0.5 text-xl">{baseSymbol}</div>
            <span className="text-th-fgd-4 text-xl">
              {isPerpMarket ? '-' : '/'}
            </span>
            <div className="font-semibold pl-0.5 text-xl">
              {isPerpMarket ? 'PERP' : groupConfig.quoteSymbol}
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <div className="pr-6">
            <div className="text-th-fgd-3 tiny-text pb-0.5">Oracle price</div>
            <div className="font-semibold text-th-fgd-1 text-xs">
              {oraclePrice ? formatUsdValue(oraclePrice) : '--'}
            </div>
          </div>
          <div className="pr-4">
            <div className="text-th-fgd-3 tiny-text pb-0.5">24h Change</div>
            {spotStats?.change ? (
              <div
                className={`font-semibold text-xs ${
                  spotStats.change > 0
                    ? `text-th-green`
                    : spotStats.change < 0
                    ? `text-th-red`
                    : `text-th-fgd-1`
                }`}
              >
                {spotStats.change.toFixed(2) + '%'}
              </div>
            ) : (
              <MarketDataLoader />
            )}
          </div>
          <div className="pr-6">
            <div className="text-th-fgd-3 tiny-text pb-0.5">24h Vol</div>
            <div className="font-semibold text-th-fgd-1 text-xs">
              {ohlcv && !loading && volume ? (
                volume !== '--' ? (
                  <>
                    {volume.toFixed(2)}
                    <span className="ml-1 text-th-fgd-3 tiny-text pb-0.5">
                      {baseSymbol}
                    </span>
                  </>
                ) : (
                  volume
                )
              ) : (
                <MarketDataLoader />
              )}
            </div>
          </div>
          <DayHighLow
            high={spotStats?.high}
            low={spotStats?.low}
            latest={spotStats?.latest}
          />
          {isPerpMarket ? (
            <>
              <div className="pr-6">
                <div className="text-th-fgd-3 tiny-text pb-0.5">
                  Avg Funding Rate (1h)
                </div>
                <div className="font-semibold text-th-fgd-1 text-xs">
                  {calculateFundingRate(
                    perpStats,
                    selectedMarket,
                    oraclePrice
                  ) ? (
                    `${calculateFundingRate(
                      perpStats,
                      selectedMarket,
                      oraclePrice
                    )?.toFixed(4)}%`
                  ) : (
                    <MarketDataLoader />
                  )}
                </div>
              </div>
              <div className="pr-6">
                <div className="text-th-fgd-3 tiny-text pb-0.5">
                  Open Interest
                </div>
                <div className="font-semibold text-th-fgd-1 text-xs">
                  {parseOpenInterest(perpStats, selectedMarket) ? (
                    `${parseOpenInterest(
                      perpStats,
                      selectedMarket
                    )} ${baseSymbol}`
                  ) : (
                    <MarketDataLoader />
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
      <div className="flex items-center">
        <UiLock />
        {connected && mangoAccount ? <ManualRefresh className="pl-2" /> : null}
      </div>
    </div>
  )
}

export default MarketHeader

export const MarketDataLoader = () => (
  <div className="animate-pulse bg-th-bkg-3 h-3.5 mt-0.5 w-10 rounded-sm" />
)
