import { useState } from 'react'
import { useOpenOrders } from '../../hooks/useOpenOrders'
import { cancelOrderAndSettle } from '../../utils/mango'
import Button from '../Button'
import Loading from '../Loading'
import { PublicKey } from '@solana/web3.js'
import useConnection from '../../hooks/useConnection'
import useMangoStore from '../../stores/useMangoStore'
import { notify } from '../../utils/notifications'
import { Table, Thead, Tbody, Tr, Th, Td } from 'react-super-responsive-table'
import SideBadge from '../SideBadge'
import OpenOrdersTable from '../OpenOrdersTable'

const AccountOrders = () => {
  const openOrders = useOpenOrders()
  const [cancelId, setCancelId] = useState(null)
  const { connection, programId } = useConnection()
  const actions = useMangoStore((s) => s.actions)

  const handleCancelOrder = async (order) => {
    const wallet = useMangoStore.getState().wallet.current
    const selectedMangoGroup =
      useMangoStore.getState().selectedMangoGroup.current
    const selectedMarginAccount =
      useMangoStore.getState().selectedMarginAccount.current
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
        txid: e.txid,
        type: 'error',
      })
      return
    } finally {
      setCancelId(null)
    }
  }

  return (
    <>
      <div className="pb-3.5 sm:pt-1 text-th-fgd-1 text-lg">Open Orders</div>
      <OpenOrdersTable />
    </>
  )
}

export default AccountOrders
