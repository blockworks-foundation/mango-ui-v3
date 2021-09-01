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
import { PerpMarket } from '@blockworks-foundation/mango-client'
import BN from 'bn.js'

const SECONDS = 1000

function calculateFundingRate(perpStats, perpMarket) {
  const oldestStat = perpStats[perpStats.length - 1]
  const latestStat = perpStats[0]

  if (!latestStat || !(perpMarket instanceof PerpMarket)) return 0.0

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

  const avgPrice =
    (parseFloat(latestStat.baseOraclePrice) +
      parseFloat(oldestStat.baseOraclePrice)) /
    2
  const basePriceInBaseLots = avgPrice * perpMarket.baseLotsToNumber(new BN(1))
  return (fundingInQuoteDecimals / basePriceInBaseLots) * 100
}

function parseOpenInterest(perpMarket: PerpMarket) {
  if (!(perpMarket instanceof PerpMarket)) return 0

  return perpMarket.baseLotsToNumber(perpMarket.openInterest) / 2
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
  const change = ohlcv ? ((ohlcv.c[0] - ohlcv.o[0]) / ohlcv.o[0]) * 100 : ''
  const volume = ohlcv ? ohlcv.v[0] : '--'

  const fetchPerpStats = useCallback(async () => {
    const urlParams = new URLSearchParams({ mangoGroup: groupConfig.name })
    urlParams.append('market', selectedMarketName)
    const perpStats = await fetch(
      `https://mango-stats-v3.herokuapp.com/perp/funding_rate?` + urlParams
    )
    const parsedPerpStats = await perpStats.json()
    setPerpStats(parsedPerpStats)
  }, [selectedMarketName])

  useInterval(() => {
    if (isPerpMarket) {
      fetchPerpStats()
    }
  }, 120 * SECONDS)

  useEffect(() => {
    if (isPerpMarket) {
      fetchPerpStats()
    }
  }, [isPerpMarket, fetchPerpStats])

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
      className={`flex flex-col relative lg:flex-row lg:items-center lg:justify-between pt-4 px-6 lg:pb-1 lg:pt-8 lg:px-6`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center">
        <div className="hidden sm:block sm:pb-4 lg:pb-0 sm:pr-6">
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
        <div className="grid grid-flow-row grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-flow-col lg:grid-rows-1 lg:gap-6">
          <div className="">
            <div className="text-th-fgd-3 tiny-text pb-0.5">Oracle price</div>
            <div className="font-semibold text-th-fgd-1 text-xs">
              {oraclePrice ? formatUsdValue(oraclePrice) : '--'}
            </div>
          </div>
          <div className="">
            <div className="text-th-fgd-3 tiny-text pb-0.5">Daily Change</div>
            {change || change === 0 ? (
              <div
                className={`font-semibold text-xs ${
                  change > 0
                    ? `text-th-green`
                    : change < 0
                    ? `text-th-red`
                    : `text-th-fgd-1`
                }`}
              >
                {change.toFixed(2) + '%'}
              </div>
            ) : (
              <MarketDataLoader />
            )}
          </div>
          <div className="">
            <div className="text-th-fgd-3 tiny-text pb-0.5">Daily Vol</div>
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
          {isPerpMarket && selectedMarket instanceof PerpMarket ? (
            <>
              <div className="">
                <div className="text-th-fgd-3 tiny-text pb-0.5">
                  Avg Funding Rate (1h)
                </div>
                <div className="font-semibold text-th-fgd-1 text-xs">
                  {selectedMarket ? (
                    `${calculateFundingRate(perpStats, selectedMarket)?.toFixed(
                      4
                    )}%`
                  ) : (
                    <MarketDataLoader />
                  )}
                </div>
              </div>
              <div className="">
                <div className="text-th-fgd-3 tiny-text pb-0.5">
                  Open Interest
                </div>
                <div className="font-semibold text-th-fgd-1 text-xs">
                  {selectedMarket ? (
                    `${parseOpenInterest(
                      selectedMarket as PerpMarket
                    )} ${baseSymbol}`
                  ) : (
                    <MarketDataLoader />
                  )}
                </div>
              </div>
            </>
          ) : null}
          <DayHighLow
            high={ohlcv?.h[0]}
            low={ohlcv?.l[0]}
            latest={oraclePrice?.toNumber()}
          />
        </div>
      </div>
      <div className="absolute right-4 bottom-0 sm:bottom-auto lg:right-6 flex items-center justify-end">
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
