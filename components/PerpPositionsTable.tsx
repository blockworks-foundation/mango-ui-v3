import { useCallback, useState } from 'react'
import { useRouter } from 'next/router'
import useMangoStore from '../stores/useMangoStore'
import { ExclamationIcon } from '@heroicons/react/outline'
import Button from '../components/Button'

import {
  getMarketIndexBySymbol,
  ZERO_BN,
} from '@blockworks-foundation/mango-client'

import { useViewport } from '../hooks/useViewport'
import { breakpoints } from './TradePageGrid'
import { Table, Td, Th, TrBody, TrHead } from './TableElements'
import { usdFormatter } from '../utils'
import Loading from './Loading'

import usePerpPositions from '../hooks/usePerpPositions'
import MarketCloseModal from './MarketCloseModal'
import { ExpandableRow } from './TableElements'
import PerpSideBadge from './PerpSideBadge'
import PnlText from './PnlText'
import { settlePnl } from './MarketPosition'

const PositionsTable = () => {
  const { reloadMangoAccount } = useMangoStore((s) => s.actions)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const groupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const [settling, setSettling] = useState(false)

  const selectedMarket = useMangoStore((s) => s.selectedMarket.current)
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const price = useMangoStore((s) => s.tradeForm.price)
  const [showMarketCloseModal, setShowMarketCloseModal] = useState(false)
  const setMangoStore = useMangoStore((s) => s.set)
  const { openPositions, unsettledPositions } = usePerpPositions()
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.md : false
  const { asPath } = useRouter()

  const handleCloseWarning = useCallback(() => {
    setShowMarketCloseModal(false)
  }, [])

  const handleSizeClick = (size, side) => {
    const step = selectedMarket.minOrderSize
    const marketIndex = getMarketIndexBySymbol(
      groupConfig,
      marketConfig.baseSymbol
    )
    const priceOrDefault = price
      ? price
      : mangoGroup.getPrice(marketIndex, mangoCache).toNumber()
    const roundedSize = Math.round(size / step) * step
    const quoteSize = roundedSize * priceOrDefault
    setMangoStore((state) => {
      state.tradeForm.baseSize = roundedSize
      state.tradeForm.quoteSize = quoteSize.toFixed(2)
      state.tradeForm.side = side === 'buy' ? 'sell' : 'buy'
    })
  }

  const handleSettleAll = async () => {
    setSettling(true)
    await Promise.all(
      unsettledPositions.map((p) => settlePnl(p.perpMarket, p.perpAccount))
    )
    await reloadMangoAccount()
    setSettling(false)
  }

  return (
    <div className="flex flex-col pb-2 pt-4">
      {unsettledPositions.length > 0 ? (
        <div className="border border-th-bkg-4 rounded-lg mb-6 p-4 sm:p-6">
          <div className="flex items-center justify-between pb-4">
            <div className="flex items-center sm:text-lg">
              <ExclamationIcon className="flex-shrink-0 h-5 mr-1.5 mt-0.5 text-th-primary w-5" />
              Unsettled Positions
            </div>
            <Button
              className="text-xs pt-0 pb-0 h-8 pl-3 pr-3 whitespace-nowrap"
              onClick={handleSettleAll}
            >
              {settling ? <Loading /> : 'Settle All'}
            </Button>
          </div>
          {unsettledPositions.map((p) => {
            return (
              <div
                className="border-b border-th-bkg-4 flex items-center justify-between py-4 last:border-b-0 last:pb-0"
                key={p.marketConfig.baseSymbol}
              >
                <div className="flex items-center">
                  <img
                    alt=""
                    width="20"
                    height="20"
                    src={`/assets/icons/${p.marketConfig.baseSymbol.toLowerCase()}.svg`}
                    className={`mr-2.5`}
                  />
                  <div>{p.marketConfig.name}</div>
                </div>
                <PnlText pnl={p.unsettledPnl} />
              </div>
            )
          })}
        </div>
      ) : null}
      <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="align-middle inline-block min-w-full sm:px-6 lg:px-8">
          {openPositions.length ? (
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
                    <Th>Unsettled</Th>
                  </TrHead>
                </thead>
                <tbody>
                  {openPositions.map(
                    (
                      {
                        marketIndex,
                        marketConfig,
                        perpMarket,
                        perpAccount,
                        basePosition,
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
                            <PerpSideBadge perpAccount={perpAccount} />
                          </Td>
                          <Td>
                            {perpAccount && basePosition > 0 ? (
                              marketConfig.kind === 'perp' &&
                              asPath.includes(marketConfig.baseSymbol) ? (
                                <span
                                  className="cursor-pointer underline hover:no-underline"
                                  onClick={() =>
                                    handleSizeClick(
                                      basePosition,
                                      perpAccount.basePosition.gt(ZERO_BN)
                                        ? 'buy'
                                        : 'sell'
                                    )
                                  }
                                >
                                  {`${basePosition} ${marketConfig.baseSymbol}`}
                                </span>
                              ) : (
                                `${basePosition} ${marketConfig.baseSymbol}`
                              )
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
              openPositions.map(
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
