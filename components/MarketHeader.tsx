import React, { useCallback, useMemo, useState } from 'react'
import useMangoStore from '../stores/useMangoStore'
import usePrevious from '../hooks/usePrevious'
import useInterval from '../hooks/useInterval'
import ChartApi from '../utils/chartDataConnector'
import UiLock from './UiLock'
import ManualRefresh from './ManualRefresh'
import useOraclePrice from '../hooks/useOraclePrice'

const MarketHeader = () => {
  const oraclePrice = useOraclePrice()
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const baseSymbol = marketConfig.baseSymbol
  const selectedMarketName = marketConfig.name
  const previousMarketName: string = usePrevious(selectedMarketName)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const connected = useMangoStore((s) => s.wallet.connected)

  const [ohlcv, setOhlcv] = useState(null)
  const [loading, setLoading] = useState(false)
  const change = ohlcv ? ((ohlcv.c[0] - ohlcv.o[0]) / ohlcv.o[0]) * 100 : '--'
  const volume = ohlcv ? ohlcv.v[0] : '--'

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
      className={`flex items-end sm:items-center justify-between pt-4 px-6 md:px-6`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center">
        <div className="pb-3 sm:pb-0 w-44">
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
              {selectedMarketName.includes('PERP') ? '–' : '/'}
            </span>
            <div className="font-semibold pl-0.5 text-xl">
              {selectedMarketName.split(/\/|-/)[1]}
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <div className="pr-4 sm:pr-0 sm:w-24">
            <div className="text-th-fgd-4 text-xs">Oracle price</div>
            <div className="font-semibold mt-0.5">
              {oraclePrice ? oraclePrice.toFixed(2) : '--'}
            </div>
          </div>
          <div className="pr-4 sm:pr-0 sm:w-24">
            <div className="mb-0.5 text-th-fgd-4 text-xs">24hr Change</div>
            {ohlcv && !loading ? (
              <div
                className={`font-semibold ${
                  change > 0
                    ? `text-th-green`
                    : change < 0
                    ? `text-th-red`
                    : `text-th-fgd-1`
                }`}
              >
                {change > 0 && <span className={`text-th-green`}>+</span>}
                {change !== '--' ? `${change.toFixed(2)}%` : change}
              </div>
            ) : (
              <MarketDataLoader />
            )}
          </div>
          <div className="pr-4 sm:pr-0 sm:w-24">
            <div className="mb-0.5 text-th-fgd-4 text-xs">24hr Vol</div>
            <div className={`font-semibold`}>
              {ohlcv && !loading && volume ? (
                volume !== '--' ? (
                  <>
                    {volume.toFixed(2)}
                    <span className="ml-1 text-th-fgd-3 text-xs">
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
        </div>
      </div>
      <div className="flex">
        <UiLock />
        {connected && mangoAccount ? <ManualRefresh className="pl-2" /> : null}
      </div>
    </div>
  )
}

export default MarketHeader

const MarketDataLoader = () => (
  <div className="animate-pulse bg-th-bkg-3 h-5 w-10 rounded-sm" />
)
