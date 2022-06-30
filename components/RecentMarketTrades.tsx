import { useCallback, useEffect, useState } from 'react'
import { ChartTradeType } from '../@types/types'
import useInterval from '../hooks/useInterval'
import ChartApi from '../utils/chartDataConnector'
import { ElementTitle } from './styles'
import { getDecimalCount, isEqual, usdFormatter } from '../utils/index'
import useMangoStore, { CLUSTER } from '../stores/useMangoStore'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from './TradePageGrid'
import { ExpandableRow } from './TableElements'
import { useTranslation } from 'next-i18next'

export default function RecentMarketTrades() {
  const { t } = useTranslation('common')
  const mangoConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const market = useMangoStore((s) => s.selectedMarket.current)
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false
  const [trades, setTrades] = useState<any[]>([])

  const fetchTradesForChart = useCallback(async () => {
    if (!marketConfig) return

    const newTrades = await ChartApi.getRecentTrades(
      marketConfig.publicKey.toString()
    )
    if (!newTrades) return null
    if (newTrades.length && trades.length === 0) {
      setTrades(newTrades)
    } else if (
      newTrades?.length &&
      !isEqual(newTrades[0], trades[0], Object.keys(newTrades[0]))
    ) {
      setTrades(newTrades)
    }
  }, [marketConfig, trades])

  useEffect(() => {
    if (CLUSTER === 'mainnet') {
      fetchTradesForChart()
    }
  }, [fetchTradesForChart])

  useInterval(async () => {
    if (CLUSTER === 'mainnet') {
      fetchTradesForChart()
    }
  }, 2000)

  return !isMobile ? (
    <>
      <ElementTitle>{t('recent-trades')}</ElementTitle>
      <div className={`mb-2 grid grid-cols-3 text-xs text-th-fgd-4`}>
        <div>{`${t('price')} (${mangoConfig.quoteSymbol})`} </div>
        <div className={`text-right`}>
          {t('size')} ({marketConfig.baseSymbol})
        </div>
        <div className={`text-right`}>{t('time')}</div>
      </div>
      {!!trades.length && (
        <div className="text-xs">
          {trades.map((trade: ChartTradeType, i: number) => (
            <div key={i} className={`grid grid-cols-3 leading-6`}>
              <div
                className={`${
                  trade.side === 'buy' ? `text-th-green` : `text-th-red`
                }`}
              >
                {market?.tickSize && !isNaN(trade.price)
                  ? usdFormatter(
                      trade.price,
                      getDecimalCount(market.tickSize),
                      false
                    )
                  : ''}
              </div>
              <div className={`text-right text-th-fgd-3`}>
                {market?.minOrderSize && !isNaN(trade.size)
                  ? Number(trade.size).toLocaleString(undefined, {
                      maximumFractionDigits: getDecimalCount(
                        market.minOrderSize
                      ),
                    })
                  : ''}
              </div>
              <div className={`text-right text-th-fgd-3`}>
                {trade.time && new Date(trade.time).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  ) : (
    <div className="my-3 border-b border-th-bkg-3">
      <ExpandableRow
        buttonTemplate={
          <div className="flex w-full justify-between text-left">
            <div className="text-fgd-1 mb-0.5">{t('recent-trades')}</div>
          </div>
        }
        panelTemplate={
          !!trades.length && (
            <div className="col-span-2">
              {trades.map((trade: ChartTradeType, i: number) => (
                <div key={i} className={`grid grid-cols-3 text-xs leading-5`}>
                  <div
                    className={`${
                      trade.side === 'buy' ? `text-th-green` : `text-th-red`
                    }`}
                  >
                    {market?.tickSize && !isNaN(trade.price)
                      ? Number(trade.price).toFixed(
                          getDecimalCount(market.tickSize)
                        )
                      : ''}
                  </div>
                  <div className={`text-right`}>
                    {market?.minOrderSize && !isNaN(trade.size)
                      ? Number(trade.size).toFixed(
                          getDecimalCount(market.minOrderSize)
                        )
                      : ''}
                  </div>
                  <div className={`text-right text-th-fgd-4`}>
                    {trade.time && new Date(trade.time).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )
        }
      />
    </div>
  )
}
