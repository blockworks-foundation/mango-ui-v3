import { useState } from 'react'
import { TrashIcon } from '@heroicons/react/solid'
import { useOpenOrders } from '../hooks/useOpenOrders'
import { cancelOrderAndSettle } from '../utils/mango'
import Button from './Button'
import Loading from './Loading'
import { PublicKey } from '@solana/web3.js'
import useConnection from '../hooks/useConnection'
import useMangoStore from '../stores/useMangoStore'
import { notify } from '../utils/notifications'

const OpenOrdersTable = () => {
  const openOrders = useOpenOrders()
  const [cancelId, setCancelId] = useState(null)
  const { connection, programId } = useConnection()

  const handleCancelOrder = async (order) => {
    const wallet = useMangoStore.getState().wallet.current
    const selectedMangoGroup = useMangoStore.getState().selectedMangoGroup
      .current
    const selectedMarginAccount = useMangoStore.getState().selectedMarginAccount
      .current
    setCancelId(order?.orderId)
    try {
      if (!selectedMangoGroup || !selectedMarginAccount) return
      await cancelOrderAndSettle(
        connection,
        new PublicKey(programId),
        selectedMangoGroup,
        selectedMarginAccount,
        wallet,
        order.market,
        order
      )
      notify({
        message: 'Order cancelled',
        type: 'success',
      })
    } catch (e) {
      notify({
        message: 'Error cancelling order',
        description: e.message,
        type: 'error',
      })
      return
    } finally {
      setCancelId(null)
    }
  }

  return (
    <div className={`flex flex-col py-6`}>
      <div className={`-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8`}>
        <div className={`align-middle inline-block min-w-full sm:px-6 lg:px-8`}>
          {openOrders && openOrders.length > 0 ? (
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
                    <th scope="col" className={`relative px-6 py-3`}>
                      <span className={`sr-only`}>Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {openOrders.map((order, index) => (
                    <tr
                      key={`${order.orderId}${order.side}`}
                      className={`
                        ${index % 2 === 0 ? `bg-th-bkg-1` : `bg-th-bkg-3`}
                      `}
                    >
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-th-fgd-2 font-light`}
                      >
                        {order.marketName}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-th-fgd-2 font-light`}
                      >
                        <div
                          className={`rounded inline-block bg-mango-green px-2 py-1 text-mango-dark font-bold`}
                        >
                          {order.side.toUpperCase()}
                        </div>
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-th-fgd-2 font-light`}
                      >
                        {order.size}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-th-fgd-2 font-light`}
                      >
                        {order.price}
                      </td>
                      <td
                        className={`px-6 py-4 opacity-75 whitespace-nowrap text-right text-sm font-medium`}
                      >
                        <Button
                          onClick={() => handleCancelOrder(order)}
                          className={`flex items-center ml-auto rounded text-th-red border border-th-red hover:text-th-red hover:border-th-red py-1`}
                        >
                          {cancelId + '' === order?.orderId + '' ? (
                            <Loading />
                          ) : (
                            <TrashIcon className={`h-5 w-5 mr-1`} />
                          )}
                          <span>Cancel Order</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              className={`w-full text-center py-6 text-base bg-th-bkg-1 font-light text-th-fgd-2 rounded-md`}
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
