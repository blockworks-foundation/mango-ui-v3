import { useCallback, useState } from 'react'
import useMangoStore from '../stores/useMangoStore'
import { ZERO_BN } from '@blockworks-foundation/mango-client'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from './TradePageGrid'
import { Table, Td, Th, TrBody, TrHead } from './TableElements'
import { usdFormatter } from '../utils'
import usePerpPositions from '../hooks/usePerpPositions'
import MarketCloseModal from './MarketCloseModal'
import { ExpandableRow } from './TableElements'
import PerpSideBadge from './PerpSideBadge'
import PnlText from './PnlText'
import { BN } from 'bn.js'

const PositionsTable = () => {
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const [showMarketCloseModal, setShowMarketCloseModal] = useState(false)
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
                    <Th>Unrealized PnL</Th>
                    <Th>Unsettled PnL</Th>
                  </TrHead>
                </thead>
                <tbody>
                  {perpPositions.map(
                    (
                      {
                        marketIndex,
                        marketConfig,
                        perpMarket,
                        perpAccount,
                        avgEntryPrice,
                        breakEvenPrice,
                        unrealizedPnl,
                        unsettledPnl,
                      },
                      index
                    ) => {
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
                            <PerpSideBadge
                              perpAccount={perpAccount}
                            ></PerpSideBadge>
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
                          <Td>{avgEntryPrice != 0 ? avgEntryPrice : '--'}</Td>
                          <Td>{breakEvenPrice != 0 ? breakEvenPrice : '--'}</Td>
                          <Td>
                            <PnlText pnl={unrealizedPnl} />
                          </Td>
                          <Td>
                            <PnlText pnl={unsettledPnl} />
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
                    }
                  )}
                </tbody>
              </Table>
            ) : (
              perpPositions
                .filter((p) => !p.perpAccount.basePosition.eq(new BN(0)))
                .map(
                  (
                    {
                      marketIndex,
                      marketConfig,
                      perpMarket,
                      perpAccount,
                      avgEntryPrice,
                      breakEvenPrice,
                      unrealizedPnl,
                    },
                    index
                  ) => {
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
                              <PnlText className="mr-1.5" pnl={unrealizedPnl} />
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
                              {avgEntryPrice != 0 ? avgEntryPrice : '--'}
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
                              {breakEvenPrice != 0 ? avgEntryPrice : '--'}
                            </div>
                            <div className="col-span-1 text-left">
                              <div className="pb-0.5 text-th-fgd-3 text-xs">
                                Unrealized PnL
                              </div>
                              <PnlText pnl={unrealizedPnl} />
                            </div>
                          </>
                        }
                      />
                    )
                  }
                )
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
