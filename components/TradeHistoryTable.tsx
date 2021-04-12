import { useOpenOrders } from '../hooks/useOpenOrders'

const TradeHistoryTable = () => {
  const openOrders = useOpenOrders()

  return (
    <div className={`flex flex-col py-6`}>
      <div className={`-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8`}>
        <div className={`align-middle inline-block min-w-full sm:px-6 lg:px-8`}>
          {openOrders ? (
            <div
              className={`shadow overflow-hidden border-b border-mango-dark-light sm:rounded-md`}
            >
              <table className={`min-w-full divide-y divide-mango-dark-light`}>
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-base font-medium text-gray-300 tracking-wider`}
                    >
                      Coin
                    </th>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-base font-medium text-gray-300 tracking-wider`}
                    >
                      Wallet Balance
                    </th>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-base font-medium text-gray-300 tracking-wider`}
                    >
                      Deposits
                    </th>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-base font-medium text-gray-300 tracking-wider`}
                    >
                      Borrows
                    </th>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-base font-medium text-gray-300 tracking-wider`}
                    >
                      In Orders
                    </th>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-base font-medium text-gray-300 tracking-wider`}
                    >
                      Unsettled
                    </th>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-base font-medium text-gray-300 tracking-wider`}
                    >
                      Net
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {openOrders.map((order, index) => (
                    <tr
                      key={`${order.orderId}${order.side}`}
                      className={`
                        ${
                          index % 2 === 0
                            ? `bg-mango-dark-light`
                            : `bg-mango-dark-lighter`
                        }
                      `}
                    >
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-light`}
                      >
                        {order.marketName}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-light`}
                      >
                        <div
                          className={`rounded inline-block bg-mango-green px-2 py-1 text-mango-dark font-bold`}
                        >
                          {order.side.toUpperCase()}
                        </div>
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-light`}
                      >
                        {order.size}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-light`}
                      >
                        {order.price}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-light`}
                      >
                        {order.price}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-light`}
                      >
                        {order.price}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-light`}
                      >
                        {order.price}
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
