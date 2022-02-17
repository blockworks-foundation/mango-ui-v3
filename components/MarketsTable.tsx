import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { formatUsdValue, usdFormatter } from '../utils'
import { Table, Td, Th, TrBody, TrHead } from './TableElements'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from './TradePageGrid'
import { useTranslation } from 'next-i18next'
import useMangoStore from '../stores/useMangoStore'
import ChartApi from '../utils/chartDataConnector'
import useMangoGroupConfig from '../hooks/useMangoGroupConfig'
import { calculateFundingRate, parseOpenInterest } from './MarketDetails'
import {
  getMarketByBaseSymbolAndKind,
  PerpMarket,
} from '@blockworks-foundation/mango-client'
import { MarketDataLoader } from './MarketDetails'
import MobileTableHeader from './mobile/MobileTableHeader'
import { ExpandableRow } from './TableElements'
import useInterval from '../hooks/useInterval'
import { SECONDS } from './MarketDetails'

const MarketsTable = ({ isPerpMarket }) => {
  const { t } = useTranslation('common')
  const groupConfig = useMangoGroupConfig()
  const markets = [...groupConfig.perpMarkets, ...groupConfig.spotMarkets]
  const tableMarkets = isPerpMarket
    ? markets
        .filter((m) => m.name.includes('PERP'))
        .sort((a, b) => a.name.localeCompare(b.name))
    : markets
        .filter((m) => !m.name.includes('PERP'))
        .sort((a, b) => a.name.localeCompare(b.name))
  const marketConfigs = useMangoStore((s) => s.selectedMangoGroup.markets)
  const [ohlcvData, setOhlcvData] = useState([])
  const [perpStats, setPerpStats] = useState([])
  // const [oraclePrices, setOraclePrices] = useState([])
  const marketInfo = useMangoStore((s) => s.marketInfo)
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.md : false

  const fetchOhlcv = useCallback(async () => {
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
    const ohlcvData = []
    await Promise.all(
      markets.map(async (market) => {
        const response = await ChartApi.getOhlcv(market.name, '1D', from, to)
        ohlcvData.push({ name: market.name, ohlcv: response })
      })
    )
    setOhlcvData(ohlcvData)
  }, [markets])

  const fetchPerpStats = async () => {
    const perpStats = []
    await Promise.all(
      tableMarkets.map(async (market) => {
        const perpStatsResponse = await fetch(
          `https://mango-stats-v3.herokuapp.com/perp/funding_rate?mangoGroup=${groupConfig.name}&market=${market.name}`
        )
        const parsedPerpStat = await perpStatsResponse.json()
        // setPerpStats(parsedPerpStats)

        const perpVolume = await fetch(
          `https://event-history-api.herokuapp.com/stats/perps/${market.publicKey.toString()}`
        )
        const parsedPerpVolume = await perpVolume.json()
        // setPerpVolumes(parsedPerpVolume?.data?.volume)
        perpStats.push({
          name: market.name,
          stats: parsedPerpStat,
          volume: parsedPerpVolume.success ? parsedPerpVolume.data.volume : '',
        })
      })
    )
    setPerpStats(perpStats)
  }

  useInterval(() => {
    if (isPerpMarket) {
      fetchPerpStats()
    }
  }, 120 * SECONDS)

  // const fetchOraclePrices = () => {
  //   if (mangoGroup && mangoCache) {
  //     const oraclePrices = []
  //     let marketIndex = 0
  //     for (const market of tableMarkets) {
  //       if (!isPerpMarket) {
  //         marketIndex = mangoGroup.getSpotMarketIndex(market.publicKey)
  //       } else {
  //         marketIndex = mangoGroup.getPerpMarketIndex(market.publicKey)
  //       }
  //       const price = mangoGroup.getPrice(marketIndex, mangoCache)
  //       oraclePrices.push({ name: market.name, oraclePrice: price })
  //     }
  //     setOraclePrices(oraclePrices)
  //   }
  // }

  useMemo(() => {
    fetchOhlcv()
    // fetchOraclePrices()
    if (isPerpMarket) {
      fetchPerpStats()
    }
  }, [])

  return tableMarkets.length > 0 ? (
    !isMobile ? (
      <Table>
        <thead>
          <TrHead>
            <Th>{t('market')}</Th>
            <Th>{t('price')}</Th>
            <Th>{t('rolling-change')}</Th>
            <Th>{t('daily-low')}</Th>
            <Th>{t('daily-high')}</Th>
            {isPerpMarket ? (
              <>
                <Th>{t('daily-volume')}</Th>
                <Th>{t('average-funding')}</Th>
                <Th>{t('open-interest')}</Th>
              </>
            ) : null}
          </TrHead>
        </thead>
        <tbody>
          {tableMarkets.map((market) => {
            const mktInfo = marketInfo.find((m) => m.name === market.name)
            const ohlcv = ohlcvData.find((m) => m.name === market.name)?.ohlcv
            const perpStat = perpStats.find(
              (m) => m.name === market.name
            )?.stats
            const perpVolume = perpStats.find(
              (m) => m.name === market.name
            )?.volume
            // const oraclePrice = oraclePrices.find(
            //   (m) => m.name === market.name
            // )?.oraclePrice

            let funding1h
            let perpMarket: PerpMarket
            let funding1hStr
            let fundingAprStr
            let openInterest

            if (isPerpMarket) {
              const marketConfig = getMarketByBaseSymbolAndKind(
                groupConfig,
                market.baseSymbol,
                'perp'
              )
              perpMarket = marketConfigs[
                marketConfig.publicKey.toString()
              ] as PerpMarket
            }

            if (isPerpMarket && perpStats.length > 0) {
              funding1h = calculateFundingRate(perpStat, perpMarket)
              funding1hStr = funding1h ? funding1h.toFixed(4) : '-'
              fundingAprStr = funding1h
                ? (funding1h * 24 * 365).toFixed(2)
                : '-'
              openInterest = parseOpenInterest(perpMarket)
            }

            return (
              <TrBody key={market.name}>
                <Td>
                  <div className="flex items-center">
                    <img
                      alt=""
                      width="20"
                      height="20"
                      src={`/assets/icons/${market.baseSymbol.toLowerCase()}.svg`}
                      className={`mr-2.5`}
                    />
                    <Link href={`/?name=${market.name}`} shallow={true}>
                      <a className="default-transition text-th-fgd-2">
                        {market.name}
                      </a>
                    </Link>
                  </div>
                </Td>
                <Td>
                  {mktInfo ? (
                    mktInfo.price ? (
                      formatUsdValue(mktInfo.price)
                    ) : (
                      'Unavailable'
                    )
                  ) : (
                    <MarketDataLoader />
                  )}
                </Td>
                <Td>
                  <span
                    className={
                      mktInfo?.change24h >= 0 ? 'text-th-green' : 'text-th-red'
                    }
                  >
                    {mktInfo ? (
                      mktInfo.change24h ? (
                        `${(mktInfo?.change24h * 100).toFixed(2)}%`
                      ) : (
                        'Unavailable'
                      )
                    ) : (
                      <MarketDataLoader />
                    )}
                  </span>
                </Td>
                <Td>
                  {ohlcv ? (
                    ohlcv.l[0] ? (
                      formatUsdValue(ohlcv?.l[0])
                    ) : (
                      'Unavailable'
                    )
                  ) : (
                    <MarketDataLoader />
                  )}
                </Td>
                <Td>
                  {ohlcv ? (
                    ohlcv.h[0] ? (
                      formatUsdValue(ohlcv?.h[0])
                    ) : (
                      'Unavailable'
                    )
                  ) : (
                    <MarketDataLoader />
                  )}
                </Td>
                {isPerpMarket ? (
                  <>
                    <Td>
                      {perpStats.length > 0 ? (
                        perpVolume ? (
                          usdFormatter(perpVolume, 0)
                        ) : (
                          'Unavailable'
                        )
                      ) : (
                        <MarketDataLoader />
                      )}
                    </Td>
                    <Td>
                      {perpStats.length > 0 ? (
                        funding1h ? (
                          `${funding1hStr}% (${fundingAprStr}% APR)`
                        ) : (
                          'Unavailable'
                        )
                      ) : (
                        <MarketDataLoader />
                      )}
                    </Td>
                    <Td>
                      {perpStats.length > 0 ? (
                        openInterest ? (
                          `${openInterest.toLocaleString()} ${
                            market.baseSymbol
                          }`
                        ) : (
                          'Unavailable'
                        )
                      ) : (
                        <MarketDataLoader />
                      )}
                    </Td>
                  </>
                ) : null}
              </TrBody>
            )
          })}
        </tbody>
      </Table>
    ) : (
      <>
        <MobileTableHeader
          colOneHeader={t('asset')}
          colTwoHeader={`${t('price')}/${t('rolling-change')}`}
        />
        {tableMarkets.map((market, index) => {
          const mktInfo = marketInfo.find((m) => m.name === market.name)
          const ohlcv = ohlcvData.find((m) => m.name === market.name)?.ohlcv
          const perpStat = perpStats.find((m) => m.name === market.name)?.stats
          const perpVolume = perpStats.find(
            (m) => m.name === market.name
          )?.volume
          // const oraclePrice = oraclePrices.find(
          //   (m) => m.name === market.name
          // )?.oraclePrice

          let funding1h
          let perpMarket: PerpMarket
          let funding1hStr
          let fundingAprStr
          let openInterest

          if (isPerpMarket) {
            const marketConfig = getMarketByBaseSymbolAndKind(
              groupConfig,
              market.baseSymbol,
              'perp'
            )
            perpMarket = marketConfigs[
              marketConfig.publicKey.toString()
            ] as PerpMarket
          }

          if (isPerpMarket && perpStats.length > 0) {
            funding1h = calculateFundingRate(perpStat, perpMarket)
            funding1hStr = funding1h ? funding1h.toFixed(4) : '-'
            fundingAprStr = funding1h ? (funding1h * 24 * 365).toFixed(2) : '-'
            openInterest = parseOpenInterest(perpMarket)
          }
          return (
            <ExpandableRow
              buttonTemplate={
                <div className="flex items-center justify-between text-th-fgd-1 w-full">
                  <div className="flex items-center text-th-fgd-1">
                    <img
                      alt=""
                      width="20"
                      height="20"
                      src={`/assets/icons/${market.baseSymbol.toLowerCase()}.svg`}
                      className={`mr-2.5`}
                    />

                    {market.baseSymbol}
                  </div>
                  <div className="flex space-x-2.5 text-th-fgd-1 text-right">
                    <div>{formatUsdValue(mktInfo?.price)}</div>
                    <div className="text-th-fgd-4">|</div>
                    <div
                      className={
                        mktInfo?.change24h >= 0
                          ? 'text-th-green'
                          : 'text-th-red'
                      }
                    >
                      {mktInfo ? (
                        mktInfo.change24h ? (
                          `${(mktInfo?.change24h * 100).toFixed(2)}%`
                        ) : (
                          'Unavailable'
                        )
                      ) : (
                        <MarketDataLoader />
                      )}
                    </div>
                  </div>
                </div>
              }
              key={`${market.name}${index}`}
              index={index}
              panelTemplate={
                <>
                  <div className="grid grid-cols-2 grid-flow-row gap-4 pb-4">
                    <div className="text-left">
                      <div className="pb-0.5 text-th-fgd-3 text-xs">
                        {t('daily-low')}
                      </div>
                      {ohlcv ? (
                        ohlcv.l[0] ? (
                          formatUsdValue(ohlcv?.l[0])
                        ) : (
                          'Unavailable'
                        )
                      ) : (
                        <MarketDataLoader />
                      )}
                    </div>
                    <div className="text-left">
                      <div className="pb-0.5 text-th-fgd-3 text-xs">
                        {t('daily-high')}
                      </div>
                      {ohlcv ? (
                        ohlcv.h[0] ? (
                          formatUsdValue(ohlcv?.h[0])
                        ) : (
                          'Unavailable'
                        )
                      ) : (
                        <MarketDataLoader />
                      )}
                    </div>
                    {isPerpMarket ? (
                      <>
                        <div className="text-left">
                          <div className="pb-0.5 text-th-fgd-3 text-xs">
                            {t('daily-volume')}
                          </div>
                          {perpStats.length > 0 ? (
                            perpVolume ? (
                              usdFormatter(perpVolume, 0)
                            ) : (
                              'Unavailable'
                            )
                          ) : (
                            <MarketDataLoader />
                          )}
                        </div>
                        <div className="text-left">
                          <div className="pb-0.5 text-th-fgd-3 text-xs">
                            {t('average-funding')}
                          </div>
                          {perpStats.length > 0 ? (
                            funding1h ? (
                              `${funding1hStr}% (${fundingAprStr}% APR)`
                            ) : (
                              'Unavailable'
                            )
                          ) : (
                            <MarketDataLoader />
                          )}
                        </div>
                        <div className="text-left">
                          <div className="pb-0.5 text-th-fgd-3 text-xs">
                            {t('open-interest')}
                          </div>
                          {perpStats.length > 0 ? (
                            openInterest ? (
                              `${openInterest.toLocaleString()} ${
                                market.baseSymbol
                              }`
                            ) : (
                              'Unavailable'
                            )
                          ) : (
                            <MarketDataLoader />
                          )}
                        </div>
                      </>
                    ) : null}
                  </div>
                </>
              }
            />
          )
        })}
      </>
    )
  ) : null
}

export default MarketsTable
