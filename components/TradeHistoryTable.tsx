import { ArrowSmDownIcon } from '@heroicons/react/solid'
import BN from 'bn.js'
import useTradeHistory from '../hooks/useTradeHistory'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Table, Thead, Tbody, Tr, Th, Td } from 'react-super-responsive-table'
import SideBadge from './SideBadge'
import { LinkButton } from './Button'
import { useSortableData } from '../hooks/useSortableData'
import useMangoStore from '../stores/useMangoStore'

function getTradeTimestamp(trade) {
  return trade?.timestamp ? trade.timestamp.toNumber() : trade.loadTimestamp
}

const TradeHistoryTable = () => {
  const { asPath } = useRouter()
  const tradeHistory = useTradeHistory()
  const { items, requestSort, sortConfig } = useSortableData(tradeHistory)
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)

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

  return (
    <div className="flex flex-col py-4">
      <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="align-middle inline-block min-w-full sm:px-6 lg:px-8">
          {tradeHistory && tradeHistory.length ? (
            <div className="shadow overflow-hidden border-b border-th-bkg-2">
              <Table className="min-w-full divide-y divide-th-bkg-2">
                <Thead>
                  <Tr className="text-th-fgd-3 text-xs">
                    <Th
                      scope="col"
                      className={`px-6 py-2 text-left font-normal`}
                    >
                      <LinkButton
                        className="flex items-center no-underline"
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
                    <Th scope="col" className="px-6 py-2 text-left font-normal">
                      <LinkButton
                        className="flex items-center no-underline"
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
                    <Th scope="col" className="px-6 py-2 text-left font-normal">
                      <LinkButton
                        className="flex items-center no-underline"
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
                    <Th scope="col" className="px-6 py-2 text-left font-normal">
                      <LinkButton
                        className="flex items-center no-underline"
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
                    <Th scope="col" className="px-6 py-2 text-left font-normal">
                      <LinkButton
                        className="flex items-center no-underline"
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
                    <Th scope="col" className="px-6 py-2 text-left font-normal">
                      <LinkButton
                        className="flex items-center no-underline"
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
                    <Th scope="col" className="px-6 py-2 text-left font-normal">
                      <LinkButton
                        className="flex items-center no-underline"
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
                    <Th scope="col" className="px-6 py-2 text-left font-normal">
                      <LinkButton
                        className="flex items-center no-underline"
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
                  </Tr>
                </Thead>
                <Tbody>
                  {items.map((trade, index) => (
                    <Tr
                      key={`${getTradeTimestamp(trade)}`}
                      className={`border-b border-th-bkg-3
                        ${index % 2 === 0 ? `bg-th-bkg-3` : `bg-th-bkg-2`}
                      `}
                    >
                      <Td className="px-6 py-2 whitespace-nowrap text-sm text-th-fgd-1">
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
                      <Td className="px-6 py-2 whitespace-nowrap text-sm text-th-fgd-1">
                        <SideBadge side={trade.side} />
                      </Td>
                      <Td className="px-6 py-2 whitespace-nowrap text-sm text-th-fgd-1">
                        {trade.size}
                      </Td>
                      <Td className="px-6 py-2 whitespace-nowrap text-sm text-th-fgd-1">
                        {trade.price}
                      </Td>
                      <Td className="px-6 py-2 whitespace-nowrap text-sm text-th-fgd-1">
                        ${trade.value.toFixed(2)}
                      </Td>
                      <Td className="px-6 py-2 whitespace-nowrap text-sm text-th-fgd-1">
                        {trade.liquidity}
                      </Td>
                      <Td className="px-6 py-2 whitespace-nowrap text-sm text-th-fgd-1">
                        ${trade.feeCost}
                      </Td>
                      <Td className="px-6 py-2 whitespace-nowrap text-sm text-th-fgd-1">
                        {trade.loadTimestamp || trade.timestamp
                          ? renderTradeDateTime(
                              trade.loadTimestamp || trade.timestamp
                            )
                          : 'Recent'}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </div>
          ) : (
            <div className="w-full text-center py-6 bg-th-bkg-1 text-th-fgd-3 rounded-md">
              No {marketConfig.name} trade history.
              {asPath === '/account' ? (
                <Link href={'/'}>
                  <a className="inline-flex ml-2 py-0">Make a trade</a>
                </Link>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TradeHistoryTable
