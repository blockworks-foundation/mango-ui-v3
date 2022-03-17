import React, { useMemo } from 'react'
import useMangoStore from '../stores/useMangoStore'
import UiLock from './UiLock'
import ManualRefresh from './ManualRefresh'
import useOraclePrice from '../hooks/useOraclePrice'
import DayHighLow from './DayHighLow'
import {
  getPrecisionDigits,
  perpContractPrecision,
  usdFormatter,
} from '../utils'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from './TradePageGrid'
import { useTranslation } from 'next-i18next'
import SwitchMarketDropdown from './SwitchMarketDropdown'
import Tooltip from './Tooltip'

const MarketDetails = () => {
  const { t } = useTranslation('common')
  const oraclePrice = useOraclePrice()
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const selectedMarket = useMangoStore((s) => s.selectedMarket.current)
  const baseSymbol = marketConfig.baseSymbol
  const selectedMarketName = marketConfig.name
  const isPerpMarket = marketConfig.kind === 'perp'

  const connected = useMangoStore((s) => s.wallet.connected)
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false

  const marketsInfo = useMangoStore((s) => s.marketsInfo)

  const market = useMemo(
    () => marketsInfo.find((market) => market.name === selectedMarketName),
    [marketsInfo, selectedMarketName]
  )

  return (
    <div
      className={`relative flex flex-col md:px-3 md:pb-2 md:pt-3 lg:flex-row lg:items-center lg:justify-between`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center">
        <div className="hidden md:block md:pb-4 md:pr-6 lg:pb-0">
          <div className="flex items-center">
            <SwitchMarketDropdown />
          </div>
        </div>
        <div className="grid grid-flow-row grid-cols-1 gap-3 md:grid-cols-3 lg:grid-flow-col lg:grid-cols-none lg:grid-rows-1 lg:gap-6">
          <div className="flex items-center justify-between md:block">
            <div className="tiny-text pb-0.5 text-th-fgd-3">
              {t('oracle-price')}
            </div>
            <div className="text-th-fgd-1 md:text-xs">
              {oraclePrice && selectedMarket
                ? oraclePrice.toNumber().toLocaleString(undefined, {
                    minimumFractionDigits: getPrecisionDigits(
                      selectedMarket.tickSize
                    ),
                    maximumFractionDigits: getPrecisionDigits(
                      selectedMarket.tickSize
                    ),
                  })
                : '--'}
            </div>
          </div>
          {market ? (
            <>
              <div className="flex items-center justify-between md:block">
                <div className="tiny-text pb-0.5 text-th-fgd-3">
                  {t('rolling-change')}
                </div>
                <div
                  className={`md:text-xs ${
                    market.change24h > 0
                      ? `text-th-green`
                      : market.change24h < 0
                      ? `text-th-red`
                      : `text-th-fgd-1`
                  }`}
                >
                  {(market.change24h * 100).toFixed(2) + '%'}
                </div>
              </div>
              {isPerpMarket ? (
                <>
                  <div className="flex items-center justify-between md:block">
                    <div className="tiny-text pb-0.5 text-th-fgd-3">
                      {t('daily-volume')}
                    </div>
                    <div className="text-th-fgd-1 md:text-xs">
                      {usdFormatter(market?.volumeUsd24h, 0)}
                    </div>
                  </div>
                  <Tooltip
                    content="Funding is paid continuously. The 1hr rate displayed is a rolling average of the past 60 mins."
                    placement={'bottom'}
                  >
                    <div className="flex items-center justify-between hover:cursor-help md:block">
                      <div className="tiny-text flex items-center pb-0.5 text-th-fgd-3">
                        {t('average-funding')}
                      </div>
                      <div className="text-th-fgd-1 md:text-xs">
                        {`${market?.funding1h.toLocaleString(undefined, {
                          maximumSignificantDigits: 3,
                        })}% (${(market?.funding1h * 24 * 365).toFixed(
                          2
                        )}% APR)`}
                      </div>
                    </div>
                  </Tooltip>
                  <div className="flex items-center justify-between md:block">
                    <div className="tiny-text pb-0.5 text-th-fgd-3">
                      {t('open-interest')}
                    </div>
                    <div className="text-th-fgd-1 md:text-xs">
                      {`${market?.openInterest.toLocaleString(undefined, {
                        maximumFractionDigits:
                          perpContractPrecision[baseSymbol],
                      })} ${baseSymbol}`}
                    </div>
                  </div>
                </>
              ) : null}
              <div>
                <div className="tiny-text pb-0.5 text-left text-th-fgd-3 xl:text-center">
                  {t('daily-range')}
                </div>
                <DayHighLow
                  high={market?.high24h}
                  low={market?.low24h}
                  latest={oraclePrice?.toNumber()}
                />
              </div>
            </>
          ) : (
            <>
              <MarketDataLoader />
              <MarketDataLoader />
              {isPerpMarket ? (
                <>
                  <MarketDataLoader />
                  <MarketDataLoader />
                  <MarketDataLoader />
                </>
              ) : null}
            </>
          )}
        </div>
      </div>
      <div className="absolute right-0 bottom-0 flex items-center justify-end space-x-2 sm:bottom-auto lg:right-3">
        {!isMobile ? (
          <div id="layout-tip">
            <UiLock />
          </div>
        ) : null}
        <div id="data-refresh-tip">
          {!isMobile && connected ? <ManualRefresh /> : null}
        </div>
      </div>
    </div>
  )
}

export default MarketDetails

export const MarketDataLoader = ({ width }: { width?: string }) => (
  <div
    className={`mt-0.5 h-8 ${
      width ? width : 'w-24'
    } animate-pulse rounded bg-th-bkg-3`}
  />
)
