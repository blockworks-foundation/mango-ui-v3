import { useState } from 'react'
import { TrashIcon } from '@heroicons/react/outline'
import { useOpenOrders } from '../hooks/useOpenOrders'
import { cancelOrderAndSettle } from '../utils/mango'
import Button from './Button'
import Loading from './Loading'
import { PublicKey } from '@solana/web3.js'
import useConnection from '../hooks/useConnection'
import useMangoStore from '../stores/useMangoStore'
import { notify } from '../utils/notifications'
import { Table, Thead, Tbody, Tr, Th, Td } from 'react-super-responsive-table'
import SideBadge from './SideBadge'

const OpenOrdersTable = () => {
  const openOrders = useOpenOrders()
  const [cancelId, setCancelId] = useState(null)
  const { connection, programId } = useConnection()
  const actions = useMangoStore((s) => s.actions)

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
      actions.fetchMarginAccounts()
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
              <Table className={`min-w-full divide-y divide-th-bkg-2`}>
                <Thead>
                  <Tr className="text-th-fgd-3">
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
                    <Th scope="col" className={`relative px-6 py-3`}>
                      <span className={`sr-only`}>Edit</span>
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {openOrders.map((order, index) => (
                    <Tr
                      key={`${order.orderId}${order.side}`}
                      className={`border-b border-th-bkg-3
                        ${index % 2 === 0 ? `bg-th-bkg-3` : `bg-th-bkg-2`}
                      `}
                    >
                      <Td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-th-fgd-1`}
                      >
                        {order.marketName}
                      </Td>
                      <Td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-th-fgd-1`}
                      >
                        <SideBadge side={order.side} />
                      </Td>
                      <Td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-th-fgd-1`}
                      >
                        {order.size}
                      </Td>
                      <Td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-th-fgd-1`}
                      >
                        {order.price}
                      </Td>
                      <Td className={`px-6 py-4 whitespace-nowrap text-left`}>
                        <Button
                          onClick={() => handleCancelOrder(order)}
                          className={`flex items-center md:ml-auto px-2 py-1 text-xs`}
                        >
                          {cancelId + '' === order?.orderId + '' ? (
                            <Loading className="-ml-1 mr-3" />
                          ) : (
                            <TrashIcon className={`h-4 w-4 mr-1`} />
                          )}
                          <span>Cancel</span>
                        </Button>
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
              No open orders
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OpenOrdersTable
