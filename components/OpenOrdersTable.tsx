import xw from 'xwind'
import { TrashIcon } from '@heroicons/react/solid'
import { useOpenOrders } from '../hooks/useOpenOrders'

const OpenOrdersTable = () => {
  const openOrders = useOpenOrders()

  return (
    <div css={xw`flex flex-col py-6`}>
      <div css={xw`-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8`}>
        <div css={xw`align-middle inline-block min-w-full sm:px-6 lg:px-8`}>
          {openOrders && openOrders.length > 0 ? (
            <div
              css={xw`shadow overflow-hidden border-b border-mango-dark-light sm:rounded-md`}
            >
              <table css={xw`min-w-full divide-y divide-mango-dark-light`}>
                <thead>
                  <tr>
                    <th
                      scope="col"
                      css={xw`px-6 py-3 text-left text-base font-medium text-gray-300 tracking-wider`}
                    >
                      Market
                    </th>
                    <th
                      scope="col"
                      css={xw`px-6 py-3 text-left text-base font-medium text-gray-300 tracking-wider`}
                    >
                      Side
                    </th>
                    <th
                      scope="col"
                      css={xw`px-6 py-3 text-left text-base font-medium text-gray-300 tracking-wider`}
                    >
                      Size
                    </th>
                    <th
                      scope="col"
                      css={xw`px-6 py-3 text-left text-base font-medium text-gray-300 tracking-wider`}
                    >
                      Price
                    </th>
                    <th scope="col" css={xw`relative px-6 py-3`}>
                      <span css={xw`sr-only`}>Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {openOrders.map((order, index) => (
                    <tr
                      key={`${order.orderId}${order.side}`}
                      css={
                        index % 2 === 0
                          ? xw`bg-mango-dark-light`
                          : xw`bg-mango-dark-lighter`
                      }
                    >
                      <td
                        css={xw`px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-light`}
                      >
                        {order.marketName}
                      </td>
                      <td
                        css={xw`px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-light`}
                      >
                        <div
                          css={xw`rounded inline-block bg-mango-green px-2 py-1 text-mango-dark font-bold`}
                        >
                          {order.side.toUpperCase()}
                        </div>
                      </td>
                      <td
                        css={xw`px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-light`}
                      >
                        {order.size}
                      </td>
                      <td
                        css={xw`px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-light`}
                      >
                        {order.price}
                      </td>
                      <td
                        css={xw`px-6 py-4 opacity-75 whitespace-nowrap text-right text-sm font-medium`}
                      >
                        <button
                          onClick={() => alert('cancel order')}
                          css={xw`flex items-center ml-auto text-mango-red border border-mango-red hover:text-red-700 hover:border-red-700 py-1 px-4`}
                        >
                          <TrashIcon css={xw`h-5 w-5 mr-1`} />
                          <span>Cancel Order</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              css={xw`w-full text-center py-6 text-base bg-th-bkg-1 font-light text-th-fgd-4 rounded-md`}
            >
              No open orders
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OpenOrdersTable
