import { useCallback, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useTranslation } from 'next-i18next'
import { ExclamationIcon } from '@heroicons/react/outline'

import useMangoStore from '../stores/useMangoStore'
import Button, { LinkButton } from '../components/Button'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from './TradePageGrid'
import { ExpandableRow, Table, Td, Th, TrBody, TrHead } from './TableElements'
import { formatUsdValue } from '../utils'
import Loading from './Loading'
import MarketCloseModal from './MarketCloseModal'
import PerpSideBadge from './PerpSideBadge'
import PnlText from './PnlText'
import { settlePnl } from './MarketPosition'
import MobileTableHeader from './mobile/MobileTableHeader'

const PositionsTable = () => {
  const { t } = useTranslation('common')
  const { reloadMangoAccount } = useMangoStore((s) => s.actions)
  const [settling, setSettling] = useState(false)
  const [settleSinglePos, setSettleSinglePos] = useState(null)

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

  const handleSizeClick = (size, side, indexPrice) => {
    const step = selectedMarket.minOrderSize
    const priceOrDefault = price ? price : indexPrice
    const roundedSize = Math.round(size / step) * step
    const quoteSize = roundedSize * priceOrDefault
    setMangoStore((state) => {
      state.tradeForm.baseSize = roundedSize
      state.tradeForm.quoteSize = quoteSize
      state.tradeForm.side = side === 'buy' ? 'sell' : 'buy'
    })
  }

  const handleSettleAll = async () => {
    setSettling(true)
    for (const p of unsettledPositions) {
      await settlePnl(p.perpMarket, p.perpAccount, t, undefined)
    }

    reloadMangoAccount()
    setSettling(false)
  }

  const handleSettlePnl = async (perpMarket, perpAccount, index) => {
    setSettleSinglePos(index)
    await settlePnl(perpMarket, perpAccount, t, undefined)
    setSettleSinglePos(null)
  }

  return (
    <div className="flex flex-col pb-2">
      {unsettledPositions.length > 0 ? (
        <div className="border border-th-bkg-4 mb-6 p-4 sm:p-6 rounded-lg">
          <div className="flex items-center justify-between pb-4">
            <div className="flex items-center">
              <ExclamationIcon className="flex-shrink-0 h-5 mr-1.5 mt-0.5 text-th-primary w-5" />
              <h3>{t('unsettled-positions')}</h3>
            </div>

            <Button
              className="text-xs pt-0 pb-0 h-8 pl-3 pr-3 whitespace-nowrap"
              onClick={handleSettleAll}
            >
              {settling ? <Loading /> : 'Redeem All'}
            </Button>
          </div>
          <div className="gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 grid-flow-row">
            {unsettledPositions.map((p, index) => {
              return (
                <div
                  className="bg-th-bkg-3 col-span-1 flex items-center justify-between px-5 py-3 rounded-full"
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
                        <p className="mb-0 text-th-fgd-1 text-xs">
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
        <div className={`align-middle inline-block min-w-full`}>
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
                                  <a className="text-th-fgd-1 underline hover:no-underline hover:text-th-fgd-1">
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
                                  handleSizeClick(
                                    Math.abs(basePosition),
                                    basePosition > 0 ? 'buy' : 'sell',
                                    indexPrice
                                  )
                                }
                              >
                                {`${Math.abs(basePosition)} ${
                                  marketConfig.baseSymbol
                                }`}
                              </span>
                            ) : (
                              <span>
                                {`${Math.abs(basePosition)} ${
                                  marketConfig.baseSymbol
                                }`}
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
              <>
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
                    return (
                      <ExpandableRow
                        buttonTemplate={
                          <>
                            <div className="flex items-center justify-between text-fgd-1 w-full">
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
                                    {Math.abs(basePosition)}
                                  </div>
                                </div>
                              </div>
                              <PnlText pnl={unrealizedPnl} />
                            </div>
                          </>
                        }
                        key={`${index}`}
                        index={index}
                        panelTemplate={
                          <div className="grid grid-cols-2 grid-flow-row gap-4">
                            <div className="col-span-1 text-left">
                              <div className="pb-0.5 text-th-fgd-3 text-xs">
                                {t('average-entry')}
                              </div>
                              {avgEntryPrice
                                ? formatUsdValue(avgEntryPrice)
                                : '--'}
                            </div>
                            <div className="col-span-1 text-left">
                              <div className="pb-0.5 text-th-fgd-3 text-xs">
                                {t('notional-size')}
                              </div>
                              {formatUsdValue(notionalSize)}
                            </div>
                            <div className="col-span-1 text-left">
                              <div className="pb-0.5 text-th-fgd-3 text-xs">
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
              </>
            )
          ) : (
            <div
              className={`w-full text-center py-6 bg-th-bkg-1 text-th-fgd-3 rounded-md`}
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
