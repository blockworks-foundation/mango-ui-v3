import React, { useCallback, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useTranslation } from 'next-i18next'
import { ExclamationIcon } from '@heroicons/react/outline'

import useMangoStore from '../stores/useMangoStore'
import Button, { LinkButton } from '../components/Button'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from './TradePageGrid'
import { ExpandableRow, Table, Td, Th, TrBody, TrHead } from './TableElements'
import { formatUsdValue, getPrecisionDigits, roundPerpSize } from '../utils'
import Loading from './Loading'
import MarketCloseModal from './MarketCloseModal'
import PerpSideBadge from './PerpSideBadge'
import PnlText from './PnlText'
import { settlePnl } from './MarketPosition'
import MobileTableHeader from './mobile/MobileTableHeader'
import { useWallet } from '@solana/wallet-adapter-react'

const PositionsTable: React.FC = () => {
  const { t } = useTranslation('common')
  const { reloadMangoAccount } = useMangoStore((s) => s.actions)
  const [settling, setSettling] = useState(false)
  const [settleSinglePos, setSettleSinglePos] = useState(null)
  const { wallet } = useWallet()
  const selectedMarket = useMangoStore((s) => s.selectedMarket.current)
  const selectedMarketConfig = useMangoStore((s) => s.selectedMarket.config)
  const price = useMangoStore((s) => s.tradeForm.price)
  const [showMarketCloseModal, setShowMarketCloseModal] = useState(false)
  const setMangoStore = useMangoStore((s) => s.set)
  const openPositions = useMangoStore(
    (s) => s.selectedMangoAccount.openPerpPositions
  )
  const unsettledPositions =
    useMangoStore.getState().selectedMangoAccount.unsettledPerpPositions
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.md : false
  const { asPath } = useRouter()

  const handleCloseWarning = useCallback(() => {
    setShowMarketCloseModal(false)
  }, [])

  const handleSizeClick = (size, indexPrice) => {
    const sizePrecisionDigits = getPrecisionDigits(selectedMarket.minOrderSize)
    const priceOrDefault = price ? price : indexPrice
    const roundedSize = parseFloat(Math.abs(size).toFixed(sizePrecisionDigits))
    const quoteSize = parseFloat((roundedSize * priceOrDefault).toFixed(2))
    setMangoStore((state) => {
      state.tradeForm.baseSize = roundedSize
      state.tradeForm.quoteSize = quoteSize
      state.tradeForm.side = size > 0 ? 'sell' : 'buy'
    })
  }

  const handleSettleAll = async () => {
    setSettling(true)
    for (const p of unsettledPositions) {
      await settlePnl(p.perpMarket, p.perpAccount, t, undefined, wallet)
    }

    reloadMangoAccount()
    setSettling(false)
  }

  const handleSettlePnl = async (perpMarket, perpAccount, index) => {
    setSettleSinglePos(index)
    await settlePnl(perpMarket, perpAccount, t, undefined, wallet)
    setSettleSinglePos(null)
  }

  return (
    <div className="flex flex-col md:pb-2">
      {unsettledPositions.length > 0 ? (
        <div className="mb-6 rounded-lg border border-th-bkg-4 p-4 sm:p-6">
          <div className="flex items-center justify-between pb-4">
            <div className="flex items-center">
              <ExclamationIcon className="mr-1.5 mt-0.5 h-5 w-5 flex-shrink-0 text-th-primary" />
              <h3>{t('unsettled-positions')}</h3>
            </div>

            <Button
              className="h-8 whitespace-nowrap pt-0 pb-0 pl-3 pr-3 text-xs"
              onClick={handleSettleAll}
            >
              {settling ? <Loading /> : t('redeem-all')}
            </Button>
          </div>
          <div className="grid grid-flow-row grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {unsettledPositions.map((p, index) => {
              return (
                <div
                  className="col-span-1 flex items-center justify-between rounded-full bg-th-bkg-3 px-5 py-3"
                  key={p.marketConfig.baseSymbol}
                >
                  <div className="flex space-x-2">
                    <div className="flex items-center">
                      <img
                        alt=""
                        width="24"
                        height="24"
                        src={`/assets/icons/${p.marketConfig.baseSymbol.toLowerCase()}.svg`}
                        className={`mr-3`}
                      />
                      <div>
                        <p className="mb-0 text-xs text-th-fgd-1">
                          {p.marketConfig.name}
                        </p>
                        <PnlText className="font-bold" pnl={p.unsettledPnl} />
                      </div>
                    </div>
                  </div>
                  {settleSinglePos === index ? (
                    <Loading />
                  ) : (
                    <LinkButton
                      className="text-xs"
                      onClick={() =>
                        handleSettlePnl(p.perpMarket, p.perpAccount, index)
                      }
                    >
                      {t('redeem-pnl')}
                    </LinkButton>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
      <div className={`md:overflow-x-auto`}>
        <div className={`inline-block min-w-full align-middle`}>
          {openPositions.length ? (
            !isMobile ? (
              <Table>
                <thead>
                  <TrHead>
                    <Th>{t('market')}</Th>
                    <Th>{t('side')}</Th>
                    <Th>{t('position-size')}</Th>
                    <Th>{t('notional-size')}</Th>
                    <Th>{t('average-entry')}</Th>
                    <Th>{t('break-even')}</Th>
                    <Th>{t('unrealized-pnl')}</Th>
                  </TrHead>
                </thead>
                <tbody>
                  {openPositions.map(
                    ({
                      marketConfig,
                      perpMarket,
                      perpAccount,
                      basePosition,
                      notionalSize,
                      indexPrice,
                      avgEntryPrice,
                      breakEvenPrice,
                      unrealizedPnl,
                    }) => {
                      const basePositionUi = roundPerpSize(
                        basePosition,
                        marketConfig.baseSymbol
                      )
                      return (
                        <TrBody key={`${marketConfig.marketIndex}`}>
                          <Td>
                            <div className="flex items-center">
                              <img
                                alt=""
                                width="20"
                                height="20"
                                src={`/assets/icons/${marketConfig.baseSymbol.toLowerCase()}.svg`}
                                className={`mr-2.5`}
                              />
                              {decodeURIComponent(asPath).includes(
                                marketConfig.name
                              ) ? (
                                <span>{marketConfig.name}</span>
                              ) : (
                                <Link
                                  href={{
                                    pathname: '/',
                                    query: { name: marketConfig.name },
                                  }}
                                  shallow={true}
                                >
                                  <a className="text-th-fgd-1 underline hover:text-th-fgd-1 hover:no-underline">
                                    {marketConfig.name}
                                  </a>
                                </Link>
                              )}
                            </div>
                          </Td>
                          <Td>
                            <PerpSideBadge perpAccount={perpAccount} />
                          </Td>
                          <Td>
                            {basePosition &&
                            selectedMarketConfig.kind === 'perp' &&
                            asPath.includes(marketConfig.baseSymbol) ? (
                              <span
                                className="cursor-pointer underline hover:no-underline"
                                onClick={() =>
                                  handleSizeClick(basePosition, indexPrice)
                                }
                              >
                                {`${basePositionUi} ${marketConfig.baseSymbol}`}
                              </span>
                            ) : (
                              <span>
                                {`${basePositionUi} ${marketConfig.baseSymbol}`}
                              </span>
                            )}
                          </Td>
                          <Td>{formatUsdValue(Math.abs(notionalSize))}</Td>
                          <Td>
                            {avgEntryPrice
                              ? formatUsdValue(avgEntryPrice)
                              : '--'}
                          </Td>
                          <Td>
                            {breakEvenPrice
                              ? formatUsdValue(breakEvenPrice)
                              : '--'}
                          </Td>
                          <Td>
                            {breakEvenPrice ? (
                              <PnlText pnl={unrealizedPnl} />
                            ) : (
                              '--'
                            )}
                          </Td>
                          {showMarketCloseModal ? (
                            <MarketCloseModal
                              isOpen={showMarketCloseModal}
                              onClose={handleCloseWarning}
                              market={perpMarket}
                              marketIndex={marketConfig.marketIndex}
                            />
                          ) : null}
                        </TrBody>
                      )
                    }
                  )}
                </tbody>
              </Table>
            ) : (
              <div className="border-b border-th-bkg-4">
                <MobileTableHeader
                  colOneHeader={t('market')}
                  colTwoHeader={t('unrealized-pnl')}
                />
                {openPositions.map(
                  (
                    {
                      marketConfig,
                      basePosition,
                      notionalSize,
                      avgEntryPrice,
                      breakEvenPrice,
                      unrealizedPnl,
                    },
                    index
                  ) => {
                    const basePositionUi = roundPerpSize(
                      basePosition,
                      marketConfig.baseSymbol
                    )
                    return (
                      <ExpandableRow
                        buttonTemplate={
                          <>
                            <div className="text-fgd-1 flex w-full items-center justify-between">
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
                                  <div className="text-xs text-th-fgd-3">
                                    <span
                                      className={`mr-1 ${
                                        basePosition > 0
                                          ? 'text-th-green'
                                          : 'text-th-red'
                                      }`}
                                    >
                                      {basePosition > 0
                                        ? t('long').toUpperCase()
                                        : t('short').toUpperCase()}
                                    </span>
                                    {basePositionUi}
                                  </div>
                                </div>
                              </div>
                              <PnlText pnl={unrealizedPnl} />
                            </div>
                          </>
                        }
                        key={`${index}`}
                        panelTemplate={
                          <div className="grid grid-flow-row grid-cols-2 gap-4">
                            <div className="col-span-1 text-left">
                              <div className="pb-0.5 text-xs text-th-fgd-3">
                                {t('average-entry')}
                              </div>
                              {avgEntryPrice
                                ? formatUsdValue(avgEntryPrice)
                                : '--'}
                            </div>
                            <div className="col-span-1 text-left">
                              <div className="pb-0.5 text-xs text-th-fgd-3">
                                {t('notional-size')}
                              </div>
                              {formatUsdValue(notionalSize)}
                            </div>
                            <div className="col-span-1 text-left">
                              <div className="pb-0.5 text-xs text-th-fgd-3">
                                {t('break-even')}
                              </div>
                              {breakEvenPrice
                                ? formatUsdValue(breakEvenPrice)
                                : '--'}
                            </div>
                          </div>
                        }
                      />
                    )
                  }
                )}
              </div>
            )
          ) : (
            <div
              className={`w-full rounded-md bg-th-bkg-1 py-6 text-center text-th-fgd-3`}
            >
              {t('no-perp')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PositionsTable
