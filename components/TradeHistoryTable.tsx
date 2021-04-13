import useTradeHistory from '../hooks/useTradeHistory'

const TradeHistoryTable = () => {
  const { tradeHistory } = useTradeHistory()
  console.log('trade history', tradeHistory)

  return (
    <div className={`flex flex-col py-6`}>
      <div className={`-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8`}>
        <div className={`align-middle inline-block min-w-full sm:px-6 lg:px-8`}>
          {tradeHistory && tradeHistory.length ? (
            <div
              className={`shadow overflow-hidden border-b border-th-bkg-2 sm:rounded-md`}
            >
              <table className={`min-w-full divide-y divide-th-bkg-2`}>
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-base font-medium text-th-fgd-2 tracking-wider`}
                    >
                      Market
                    </th>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-base font-medium text-th-fgd-2 tracking-wider`}
                    >
                      Side
                    </th>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-base font-medium text-th-fgd-2 tracking-wider`}
                    >
                      Size
                    </th>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-base font-medium text-th-fgd-2 tracking-wider`}
                    >
                      Price
                    </th>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-base font-medium text-th-fgd-2 tracking-wider`}
                    >
                      Liquidity
                    </th>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-base font-medium text-th-fgd-2 tracking-wider`}
                    >
                      Fees
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tradeHistory.map((trade, index) => (
                    <tr
                      key={`${trade.orderId}${trade.side}`}
                      className={`
                        ${index % 2 === 0 ? `bg-th-bkg-2` : `bg-th-bkg-3`}
                      `}
                    >
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-th-fgd-2 font-light`}
                      >
                        {trade.marketName}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-th-fgd-2 font-light`}
                      >
                        <div
                          className={`rounded inline-block ${
                            trade.side === 'buy'
                              ? 'bg-th-green text-th-bkg-1'
                              : 'bg-th-red text-white'
                          }
                           px-2 py-1  font-bold`}
                        >
                          {trade.side.toUpperCase()}
                        </div>
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-th-fgd-2 font-light`}
                      >
                        {trade.size}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-th-fgd-2 font-light`}
                      >
                        {trade.price}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-th-fgd-2 font-light`}
                      >
                        {trade.liquidity}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-th-fgd-2 font-light`}
                      >
                        {trade.feeCost}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              className={`w-full text-center py-6 text-base bg-th-bkg-1 font-light text-th-fgd-4 rounded-md`}
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
