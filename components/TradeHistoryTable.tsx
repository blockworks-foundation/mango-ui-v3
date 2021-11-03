import { ArrowSmDownIcon } from '@heroicons/react/solid'
import BN from 'bn.js'
import useTradeHistory from '../hooks/useTradeHistory'
import Link from 'next/link'
import { useRouter } from 'next/router'
import SideBadge from './SideBadge'
import { LinkButton } from './Button'
import { useSortableData } from '../hooks/useSortableData'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from './TradePageGrid'
import { Table, Td, Th, TrBody, TrHead } from './TableElements'
import { ExpandableRow } from './TableElements'
import { formatUsdValue } from '../utils'
import { useTranslation } from 'next-i18next'

const TradeHistoryTable = ({ numTrades }: { numTrades?: number }) => {
  const { t } = useTranslation('common')
  const { asPath } = useRouter()
  const tradeHistory = useTradeHistory({ excludePerpLiquidations: true })
  const { items, requestSort, sortConfig } = useSortableData(tradeHistory)
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.md : false

  const renderTradeDateTime = (timestamp: BN | string) => {
    let date
    // don't compare to BN because of npm maddness
    // prototypes can be different due to multiple versions being imported
    if (typeof timestamp === 'string') {
      date = new Date(timestamp)
    } else {
      date = new Date(timestamp.toNumber() * 1000)
    }

    return (
      <>
        <div>{date.toLocaleDateString()}</div>
        <div className="text-xs text-th-fgd-3">{date.toLocaleTimeString()}</div>
      </>
    )
  }

  const renderMarketName = (trade: any) => {
    let marketType, baseSymbol
    if (trade.marketName.includes('PERP')) {
      marketType = 'perp'
      baseSymbol = trade.marketName.slice(0, trade.marketName.indexOf('-'))
    } else if (trade.marketName.includes('USDC')) {
      marketType = 'spot'
      baseSymbol = trade.marketName.slice(0, trade.marketName.indexOf('/'))
    } else {
      return <span>{trade.marketName}</span>
    }
    const location = `/${marketType}/${baseSymbol}`
    if (asPath.includes(location)) {
      return <span>{trade.marketName}</span>
    } else {
      return (
        <Link href={location}>
          <a className="text-th-fgd-1 underline hover:no-underline hover:text-th-fgd-1">
            {trade.marketName}
          </a>
        </Link>
      )
    }
  }

  const filteredTrades = numTrades ? items.slice(0, numTrades) : items

  return (
    <div className={`flex flex-col py-2 sm:pb-4 sm:pt-4`}>
      <div className={`-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8`}>
        <div className={`align-middle inline-block min-w-full sm:px-6 lg:px-8`}>
          {tradeHistory && tradeHistory.length ? (
            !isMobile ? (
              <Table>
                <thead>
                  <TrHead>
                    <Th>
                      <LinkButton
                        className="flex items-center no-underline font-normal"
                        onClick={() => requestSort('market')}
                      >
                        {t('market')}
                        <ArrowSmDownIcon
                          className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                            sortConfig?.key === 'market'
                              ? sortConfig.direction === 'ascending'
                                ? 'transform rotate-180'
                                : 'transform rotate-360'
                              : null
                          }`}
                        />
                      </LinkButton>
                    </Th>
                    <Th>
                      <LinkButton
                        className="flex items-center no-underline font-normal"
                        onClick={() => requestSort('side')}
                      >
                        {t('side')}
                        <ArrowSmDownIcon
                          className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                            sortConfig?.key === 'side'
                              ? sortConfig.direction === 'ascending'
                                ? 'transform rotate-180'
                                : 'transform rotate-360'
                              : null
                          }`}
                        />
                      </LinkButton>
                    </Th>
                    <Th>
                      <LinkButton
                        className="flex items-center no-underline font-normal"
                        onClick={() => requestSort('size')}
                      >
                        {t('size')}
                        <ArrowSmDownIcon
                          className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                            sortConfig?.key === 'size'
                              ? sortConfig.direction === 'ascending'
                                ? 'transform rotate-180'
                                : 'transform rotate-360'
                              : null
                          }`}
                        />
                      </LinkButton>
                    </Th>
                    <Th>
                      <LinkButton
                        className="flex items-center no-underline font-normal"
                        onClick={() => requestSort('price')}
                      >
                        {t('price')}
                        <ArrowSmDownIcon
                          className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                            sortConfig?.key === 'price'
                              ? sortConfig.direction === 'ascending'
                                ? 'transform rotate-180'
                                : 'transform rotate-360'
                              : null
                          }`}
                        />
                      </LinkButton>
                    </Th>
                    <Th>
                      <LinkButton
                        className="flex items-center no-underline font-normal"
                        onClick={() => requestSort('value')}
                      >
                        {t('value')}
                        <ArrowSmDownIcon
                          className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                            sortConfig?.key === 'value'
                              ? sortConfig.direction === 'ascending'
                                ? 'transform rotate-180'
                                : 'transform rotate-360'
                              : null
                          }`}
                        />
                      </LinkButton>
                    </Th>
                    <Th>
                      <LinkButton
                        className="flex items-center no-underline font-normal"
                        onClick={() => requestSort('liquidity')}
                      >
                        {t('liquidity')}
                        <ArrowSmDownIcon
                          className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                            sortConfig?.key === 'liquidity'
                              ? sortConfig.direction === 'ascending'
                                ? 'transform rotate-180'
                                : 'transform rotate-360'
                              : null
                          }`}
                        />
                      </LinkButton>
                    </Th>
                    <Th>
                      <LinkButton
                        className="flex items-center no-underline font-normal"
                        onClick={() => requestSort('feeCost')}
                      >
                        {t('fee')}
                        <ArrowSmDownIcon
                          className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                            sortConfig?.key === 'feeCost'
                              ? sortConfig.direction === 'ascending'
                                ? 'transform rotate-180'
                                : 'transform rotate-360'
                              : null
                          }`}
                        />
                      </LinkButton>
                    </Th>
                    <Th>
                      <LinkButton
                        className="flex items-center no-underline font-normal"
                        onClick={() => requestSort('loadTimestamp')}
                      >
                        {t('approximate-time')}
                        <ArrowSmDownIcon
                          className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                            sortConfig?.key === 'loadTimestamp'
                              ? sortConfig.direction === 'ascending'
                                ? 'transform rotate-180'
                                : 'transform rotate-360'
                              : null
                          }`}
                        />
                      </LinkButton>
                    </Th>
                  </TrHead>
                </thead>
                <tbody>
                  {filteredTrades.map((trade: any, index) => {
                    return (
                      <TrBody
                        index={index}
                        key={`${trade.seqNum}${trade.marketName}`}
                      >
                        <Td>
                          <div className="flex items-center">
                            <img
                              alt=""
                              width="20"
                              height="20"
                              src={`/assets/icons/${trade.marketName
                                .split(/-|\//)[0]
                                .toLowerCase()}.svg`}
                              className={`mr-2.5`}
                            />
                            {renderMarketName(trade)}
                          </div>
                        </Td>
                        <Td>
                          <SideBadge side={trade.side} />
                        </Td>
                        <Td>{trade.size}</Td>
                        <Td>
                          ${new Intl.NumberFormat('en-US').format(trade.price)}
                        </Td>
                        <Td>{formatUsdValue(trade.value)}</Td>
                        <Td>{trade.liquidity}</Td>
                        <Td>{formatUsdValue(trade.feeCost)}</Td>
                        <Td>
                          {trade.loadTimestamp || trade.timestamp
                            ? renderTradeDateTime(
                                trade.loadTimestamp || trade.timestamp
                              )
                            : t('recent')}
                        </Td>
                      </TrBody>
                    )
                  })}
                </tbody>
              </Table>
            ) : (
              items.map((trade: any, index) => (
                <ExpandableRow
                  buttonTemplate={
                    <>
                      <div className="flex items-center justify-between text-fgd-1 w-full">
                        <div className="flex items-center">
                          <img
                            alt=""
                            width="20"
                            height="20"
                            src={`/assets/icons/${trade.marketName
                              .split(/-|\//)[0]
                              .toLowerCase()}.svg`}
                            className={`mr-2.5`}
                          />
                          <div>
                            <div className="mb-0.5 text-left">
                              {trade.marketName}
                            </div>
                            <div className="text-th-fgd-3 text-xs">
                              <span
                                className={`mr-1
                                ${
                                  trade.side === 'buy' || trade.side === 'long'
                                    ? 'text-th-green'
                                    : 'text-th-red'
                                }
                              `}
                              >
                                {trade.side.toUpperCase()}
                              </span>
                              {`${trade.size} at ${formatUsdValue(
                                trade.price
                              )}`}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  }
                  key={`${index}`}
                  index={index}
                  panelTemplate={
                    <div className="grid grid-cols-2 grid-flow-row gap-4">
                      <div className="text-left">
                        <div className="pb-0.5 text-th-fgd-3 text-xs">
                          {t('value')}
                        </div>
                        {formatUsdValue(trade.value)}
                      </div>
                      <div className="text-left">
                        <div className="pb-0.5 text-th-fgd-3 text-xs">
                          {t('liquidity')}
                        </div>
                        {trade.liquidity}
                      </div>
                      <div className="text-left">
                        <div className="pb-0.5 text-th-fgd-3 text-xs">
                          {t('fee')}
                        </div>
                        {formatUsdValue(trade.feeCost)}
                      </div>
                      <div className="text-left">
                        <div className="pb-0.5 text-th-fgd-3 text-xs">
                          {t('approximate-time')}
                        </div>
                        {trade.loadTimestamp || trade.timestamp
                          ? renderTradeDateTime(
                              trade.loadTimestamp || trade.timestamp
                            )
                          : t('recent')}
                      </div>
                    </div>
                  }
                />
              ))
            )
          ) : (
            <div className="w-full text-center py-6 bg-th-bkg-1 text-th-fgd-3 rounded-md">
              {t('no-history')}
              {asPath === '/account' ? (
                <Link href={'/'}>
                  <a className="inline-flex ml-2 py-0">{t('make-trade')}</a>
                </Link>
              ) : null}
            </div>
          )}
        </div>
        <div className="flex items-center">
          {numTrades && items.length > numTrades ? (
            <div className="mx-auto mt-4">
              <Link href="/account">{t('view-all-trades')}</Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default TradeHistoryTable
