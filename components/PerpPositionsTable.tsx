import { useCallback, useState } from 'react'
import useMangoStore from '../stores/useMangoStore'
import {
  getMarketByPublicKey,
  PerpMarket,
  ZERO_BN,
} from '@blockworks-foundation/mango-client'
import SideBadge from './SideBadge'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from './TradePageGrid'
import { Table, Td, Th, TrBody, TrHead } from './TableElements'
import { formatUsdValue, usdFormatter } from '../utils'
import useTradeHistory from '../hooks/useTradeHistory'
import usePerpPositions from '../hooks/usePerpPositions'
import MarketCloseModal from './MarketCloseModal'
import { ExpandableRow } from './TableElements'

export function getAvgEntryPrice(
  mangoAccount,
  perpAccount,
  perpMarket,
  perpTradeHistory
) {
  let avgEntryPrice = '--'
  if (perpTradeHistory.length) {
    try {
      avgEntryPrice = formatUsdValue(
        perpAccount.getAverageOpenPrice(
          mangoAccount,
          perpMarket,
          perpTradeHistory
        )
      )
    } catch {
      avgEntryPrice = '--'
    }
  }
  return avgEntryPrice
}

export function getBreakEvenPrice(
  mangoAccount,
  perpAccount,
  perpMarket,
  perpTradeHistory
) {
  let breakEvenPrice = '--'
  if (perpTradeHistory.length) {
    try {
      breakEvenPrice = formatUsdValue(
        perpAccount.getBreakEvenPrice(
          mangoAccount,
          perpMarket,
          perpTradeHistory
        )
      )
    } catch {
      breakEvenPrice = '--'
    }
  }
  return breakEvenPrice
}

const PositionsTable = () => {
  const groupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const allMarkets = useMangoStore((s) => s.selectedMangoGroup.markets)
  const [showMarketCloseModal, setShowMarketCloseModal] = useState(false)
  const tradeHistory = useTradeHistory()
  const setMangoStore = useMangoStore((s) => s.set)
  const perpPositions = usePerpPositions()
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.md : false

  const handleCloseWarning = useCallback(() => {
    setShowMarketCloseModal(false)
  }, [])

  const handleSizeClick = (size) => {
    setMangoStore((state) => {
      state.tradeForm.baseSize = size
    })
  }

  return (
    <div className="flex flex-col pb-2 pt-4">
      <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="align-middle inline-block min-w-full sm:px-6 lg:px-8">
          {perpPositions.length ? (
            !isMobile ? (
              <Table>
                <thead>
                  <TrHead>
                    <Th>Market</Th>
                    <Th>Side</Th>
                    <Th>Position Size</Th>
                    <Th>Notional Size</Th>
                    <Th>Avg entry Price</Th>
                    <Th>Break-even Price</Th>
                    <Th>PnL</Th>
                  </TrHead>
                </thead>
                <tbody>
                  {perpPositions.map(({ perpAccount, marketIndex }, index) => {
                    const perpMarketInfo = mangoGroup.perpMarkets[marketIndex]
                    const marketConfig = getMarketByPublicKey(
                      groupConfig,
                      perpMarketInfo.perpMarket
                    )
                    const perpMarket = allMarkets[
                      perpMarketInfo.perpMarket.toString()
                    ] as PerpMarket
                    const perpTradeHistory = tradeHistory.filter(
                      (t) => t.marketName === marketConfig.name
                    )
                    let breakEvenPrice
                    try {
                      breakEvenPrice = perpAccount.getBreakEvenPrice(
                        mangoAccount,
                        perpMarket,
                        perpTradeHistory
                      )
                    } catch (e) {
                      breakEvenPrice = null
                    }

                    const pnl =
                      breakEvenPrice !== null
                        ? perpMarket.baseLotsToNumber(
                            perpAccount.basePosition
                          ) *
                          (mangoGroup
                            .getPrice(marketIndex, mangoCache)
                            .toNumber() -
                            parseFloat(breakEvenPrice))
                        : null

                    return (
                      <TrBody index={index} key={`${marketIndex}`}>
                        <Td>
                          <div className="flex items-center">
                            <img
                              alt=""
                              width="20"
                              height="20"
                              src={`/assets/icons/${marketConfig.baseSymbol.toLowerCase()}.svg`}
                              className={`mr-2.5`}
                            />
                            <div>{marketConfig.name}</div>
                          </div>
                        </Td>
                        <Td>
                          {!perpAccount.basePosition.eq(ZERO_BN) ? (
                            <SideBadge
                              side={
                                perpAccount.basePosition.gt(ZERO_BN)
                                  ? 'long'
                                  : 'short'
                              }
                            />
                          ) : (
                            '-'
                          )}
                        </Td>
                        <Td>
                          {perpAccount &&
                          Math.abs(
                            perpMarket.baseLotsToNumber(
                              perpAccount.basePosition
                            )
                          ) > 0 ? (
                            <span
                              className="cursor-pointer underline hover:no-underline"
                              onClick={() =>
                                handleSizeClick(
                                  Math.abs(
                                    perpMarket.baseLotsToNumber(
                                      perpAccount.basePosition
                                    )
                                  )
                                )
                              }
                            >
                              {`${Math.abs(
                                perpMarket.baseLotsToNumber(
                                  perpAccount.basePosition
                                )
                              )} ${marketConfig.baseSymbol}`}
                            </span>
                          ) : (
                            `0 ${marketConfig.baseSymbol}`
                          )}
                        </Td>
                        <Td>
                          {usdFormatter(
                            Math.abs(
                              perpMarket.baseLotsToNumber(
                                perpAccount.basePosition
                              ) *
                                mangoGroup
                                  .getPrice(marketIndex, mangoCache)
                                  .toNumber()
                            )
                          )}
                        </Td>
                        <Td>
                          {getAvgEntryPrice(
                            mangoAccount,
                            perpAccount,
                            perpMarket,
                            perpTradeHistory
                          )}
                        </Td>
                        <Td>
                          {getBreakEvenPrice(
                            mangoAccount,
                            perpAccount,
                            perpMarket,
                            perpTradeHistory
                          )}
                        </Td>
                        <Td>
                          {pnl !== null ? (
                            pnl > 0 ? (
                              <span className="text-th-green">
                                {usdFormatter(pnl)}
                              </span>
                            ) : (
                              <span className="text-th-red">
                                {usdFormatter(pnl)}
                              </span>
                            )
                          ) : (
                            '--'
                          )}
                        </Td>
                        {showMarketCloseModal ? (
                          <MarketCloseModal
                            isOpen={showMarketCloseModal}
                            onClose={handleCloseWarning}
                            market={perpMarket}
                            marketIndex={marketIndex}
                          />
                        ) : null}
                      </TrBody>
                    )
                  })}
                </tbody>
              </Table>
            ) : (
              perpPositions.map(({ perpAccount, marketIndex }, index) => {
                const perpMarketInfo = mangoGroup.perpMarkets[marketIndex]
                const marketConfig = getMarketByPublicKey(
                  groupConfig,
                  perpMarketInfo.perpMarket
                )
                const perpMarket = allMarkets[
                  perpMarketInfo.perpMarket.toString()
                ] as PerpMarket
                const perpTradeHistory = tradeHistory.filter(
                  (t) => t.marketName === marketConfig.name
                )
                let breakEvenPrice
                try {
                  breakEvenPrice = perpAccount.getBreakEvenPrice(
                    mangoAccount,
                    perpMarket,
                    perpTradeHistory
                  )
                } catch (e) {
                  breakEvenPrice = null
                }

                const pnl =
                  breakEvenPrice !== null
                    ? perpMarket.baseLotsToNumber(perpAccount.basePosition) *
                      (mangoGroup.getPrice(marketIndex, mangoCache).toNumber() -
                        parseFloat(breakEvenPrice))
                    : null
                return (
                  <ExpandableRow
                    buttonTemplate={
                      <>
                        <div className="col-span-11 flex items-center justify-between text-fgd-1">
                          <div className="flex items-center">
                            <img
                              alt=""
                              width="20"
                              height="20"
                              src={`/assets/icons/${marketConfig.baseSymbol.toLowerCase()}.svg`}
                              className={`mr-2.5`}
                            />
                            <div>
                              <div className="mb-0.5 text-left">
                                {marketConfig.name}
                              </div>
                              <div className="text-th-fgd-3 text-xs">
                                <span
                                  className={`mr-1
                                ${
                                  perpAccount.basePosition.gt(ZERO_BN)
                                    ? 'text-th-green'
                                    : 'text-th-red'
                                }
                              `}
                                >
                                  {perpAccount.basePosition.gt(ZERO_BN)
                                    ? 'LONG'
                                    : 'SHORT'}
                                </span>
                                {`${
                                  Math.abs(
                                    perpMarket.baseLotsToNumber(
                                      perpAccount.basePosition
                                    )
                                  ) > 0
                                    ? Math.abs(
                                        perpMarket.baseLotsToNumber(
                                          perpAccount.basePosition
                                        )
                                      )
                                    : 0
                                }`}
                              </div>
                            </div>
                          </div>
                          {pnl !== null ? (
                            <span
                              className={`mr-1.5 ${
                                pnl > 0 ? 'text-th-green' : 'text-th-red'
                              }`}
                            >
                              {usdFormatter(pnl)}
                            </span>
                          ) : (
                            '--'
                          )}
                        </div>
                      </>
                    }
                    key={`${index}`}
                    index={index}
                    panelTemplate={
                      <>
                        <div className="col-span-1 text-left">
                          <div className="pb-0.5 text-th-fgd-3 text-xs">
                            Ave Entry Price
                          </div>
                          {getAvgEntryPrice(
                            mangoAccount,
                            perpAccount,
                            perpMarket,
                            perpTradeHistory
                          )}
                        </div>
                        <div className="col-span-1 text-left">
                          <div className="pb-0.5 text-th-fgd-3 text-xs">
                            Notional Size
                          </div>
                          {usdFormatter(
                            Math.abs(
                              perpMarket.baseLotsToNumber(
                                perpAccount.basePosition
                              ) *
                                mangoGroup
                                  .getPrice(marketIndex, mangoCache)
                                  .toNumber()
                            )
                          )}
                        </div>
                        <div className="col-span-1 text-left">
                          <div className="pb-0.5 text-th-fgd-3 text-xs">
                            Break-even Price
                          </div>
                          {getBreakEvenPrice(
                            mangoAccount,
                            perpAccount,
                            perpMarket,
                            perpTradeHistory
                          )}
                        </div>
                        <div className="col-span-1 text-left">
                          <div className="pb-0.5 text-th-fgd-3 text-xs">
                            PnL
                          </div>
                          {pnl !== null ? (
                            <span
                              className={
                                pnl > 0 ? 'text-th-green' : 'text-th-red'
                              }
                            >
                              {usdFormatter(pnl)}
                            </span>
                          ) : (
                            '--'
                          )}
                        </div>
                      </>
                    }
                  />
                )
              })
            )
          ) : (
            <div
              className={`w-full text-center py-6 bg-th-bkg-1 text-th-fgd-3 rounded-md`}
            >
              No perp positions
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PositionsTable
