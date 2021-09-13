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
import MobileTableHeader from './mobile/MobileTableHeader'
import { formatUsdValue } from '../utils'

const TradeHistoryTable = ({ numTrades }) => {
  const { asPath } = useRouter()
  const tradeHistory = useTradeHistory({ excludePerpLiquidations: true })
  const { items, requestSort, sortConfig } = useSortableData(tradeHistory)
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.md : false

  const renderTradeDateTime = (timestamp: BN | string) => {
    let date
    if (timestamp instanceof BN) {
      date = new Date(timestamp.toNumber() * 1000)
    } else {
      date = new Date(timestamp)
    }

    return (
      <>
        <div>{date.toLocaleDateString()}</div>
        <div className="text-xs text-th-fgd-3">{date.toLocaleTimeString()}</div>
      </>
    )
  }

  const filteredTrades = numTrades ? items.slice(0, numTrades) : items

  return (
    <div className="flex flex-col pb-2 pt-4">
      <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="align-middle inline-block min-w-full sm:px-6 lg:px-8">
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
                        Market
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
                        Side
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
                        Size
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
                        Price
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
                        Value
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
                        Liquidity
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
                        Fee
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
                        Approx Time
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
                  {filteredTrades.map((trade: any, index) => (
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
                          <div>{trade.marketName}</div>
                        </div>
                      </Td>
                      <Td>
                        <SideBadge side={trade.side} />
                      </Td>
                      <Td>{trade.size}</Td>
                      <Td>{formatUsdValue(trade.price)}</Td>
                      <Td>{formatUsdValue(trade.value)}</Td>
                      <Td>{trade.liquidity}</Td>
                      <Td>{formatUsdValue(trade.feeCost)}</Td>
                      <Td>
                        {trade.loadTimestamp || trade.timestamp
                          ? renderTradeDateTime(
                              trade.loadTimestamp || trade.timestamp
                            )
                          : 'Recent'}
                      </Td>
                    </TrBody>
                  ))}
                </tbody>
              </Table>
            ) : (
              <>
                <MobileTableHeader
                  headerTemplate={<div className="col-span-11">Trade</div>}
                />
                {items.map((trade: any, index) => (
                  <ExpandableRow
                    buttonTemplate={
                      <>
                        <div className="col-span-11 flex items-center text-fgd-1">
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
                      <>
                        <div className="col-span-1 text-left">
                          <div className="pb-0.5 text-th-fgd-3 text-xs">
                            Value
                          </div>
                          {formatUsdValue(trade.value)}
                        </div>
                        <div className="col-span-1 text-left">
                          <div className="pb-0.5 text-th-fgd-3 text-xs">
                            Liquidity
                          </div>
                          {trade.liquidity}
                        </div>
                        <div className="col-span-1 text-left">
                          <div className="pb-0.5 text-th-fgd-3 text-xs">
                            Fee
                          </div>
                          {formatUsdValue(trade.feeCost)}
                        </div>
                        <div className="col-span-1 text-left">
                          <div className="pb-0.5 text-th-fgd-3 text-xs">
                            Approx Time
                          </div>
                          {trade.loadTimestamp || trade.timestamp
                            ? renderTradeDateTime(
                                trade.loadTimestamp || trade.timestamp
                              )
                            : 'Recent'}
                        </div>
                      </>
                    }
                  />
                ))}
              </>
            )
          ) : (
            <div className="w-full text-center py-6 bg-th-bkg-1 text-th-fgd-3 rounded-md">
              No trade history
              {asPath === '/account' ? (
                <Link href={'/'}>
                  <a className="inline-flex ml-2 py-0">Make a trade</a>
                </Link>
              ) : null}
            </div>
          )}
        </div>
        <div className="flex items-center">
          {numTrades && items.length > numTrades ? (
            <div className="mx-auto mt-4">
              <Link href="/account">View all trades in the Account page</Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default TradeHistoryTable
