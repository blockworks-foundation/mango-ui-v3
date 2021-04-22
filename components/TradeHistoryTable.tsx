import useTradeHistory from '../hooks/useTradeHistory'
import { Table, Thead, Tbody, Tr, Th, Td } from 'react-super-responsive-table'
import SideBadge from './SideBadge'
// import useMangoStore from '../stores/useMangoStore'
// import Loading from './Loading'

const TradeHistoryTable = () => {
  const tradeHistory = useTradeHistory()
  // const connected = useMangoStore((s) => s.wallet.connected)
  const renderTradeDateTime = (timestamp) => {
    const date = new Date(timestamp)
    return (
      <>
        <div>{date.toLocaleDateString()}</div>
        <div className="text-xs text-th-fgd-3">{date.toLocaleTimeString()}</div>
      </>
    )
  }

  return (
    <div className={`flex flex-col py-6`}>
      <div className={`-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8`}>
        <div className={`align-middle inline-block min-w-full sm:px-6 lg:px-8`}>
          {tradeHistory && tradeHistory.length ? (
            <div
              className={`shadow overflow-hidden border-b border-th-bkg-2 sm:rounded-md`}
            >
              <Table className={`min-w-full divide-y divide-th-bkg-2`}>
                <Thead>
                  <Tr>
                    <Th
                      scope="col"
                      className={`px-6 py-3 text-left font-normal`}
                    >
                      Market
                    </Th>
                    <Th
                      scope="col"
                      className={`px-6 py-3 text-left font-normal`}
                    >
                      Side
                    </Th>
                    <Th
                      scope="col"
                      className={`px-6 py-3 text-left font-normal`}
                    >
                      Size
                    </Th>
                    <Th
                      scope="col"
                      className={`px-6 py-3 text-left font-normal`}
                    >
                      Price
                    </Th>
                    <Th
                      scope="col"
                      className={`px-6 py-3 text-left font-normal`}
                    >
                      Liquidity
                    </Th>
                    <Th
                      scope="col"
                      className={`px-6 py-3 text-left font-normal`}
                    >
                      Fees
                    </Th>
                    <Th
                      scope="col"
                      className={`px-6 py-3 text-left font-normal`}
                    >
                      Approx Date/Time
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {tradeHistory.map((trade, index) => (
                    <Tr
                      key={`${trade.orderId}${trade.side}${trade.uuid}`}
                      className={`border-b border-th-bkg-3
                        ${index % 2 === 0 ? `bg-th-bkg-3` : `bg-th-bkg-2`}
                      `}
                    >
                      <Td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-th-fgd-1`}
                      >
                        {trade.marketName}
                      </Td>
                      <Td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-th-fgd-1`}
                      >
                        <SideBadge side={trade.side} />
                      </Td>
                      <Td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-th-fgd-1`}
                      >
                        {trade.size}
                      </Td>
                      <Td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-th-fgd-1`}
                      >
                        {trade.price}
                      </Td>
                      <Td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-th-fgd-1`}
                      >
                        {trade.liquidity}
                      </Td>
                      <Td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-th-fgd-1`}
                      >
                        {trade.feeCost}
                      </Td>
                      <Td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-th-fgd-1`}
                      >
                        {trade.loadTimestamp
                          ? renderTradeDateTime(trade.loadTimestamp)
                          : 'Recent'}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </div>
          ) : (
            <div
              className={`w-full text-center py-6 bg-th-bkg-1 text-th-fgd-3 rounded-md`}
            >
              No trade history
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TradeHistoryTable
