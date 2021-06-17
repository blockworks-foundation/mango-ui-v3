import { useBalances } from '../hooks/useBalances'
import useMangoStore from '../stores/useMangoStore'
import { settleAll } from '../utils/mango'
import useConnection from '../hooks/useConnection'
import Button from '../components/Button'
import { notify } from '../utils/notifications'
import { Table, Thead, Tbody, Tr, Th, Td } from 'react-super-responsive-table'
import { InformationCircleIcon } from '@heroicons/react/outline'
import Tooltip from './Tooltip'
import { sleep } from '../utils'
import { PublicKey } from '@solana/web3.js'

const BalancesTable = () => {
  const balances = useBalances()
  const { programId, connection } = useConnection()
  const actions = useMangoStore((s) => s.actions)

  async function handleSettleAll() {
    const markets = Object.values(
      useMangoStore.getState().selectedMangoGroup.markets
    )
    const marginAccount = useMangoStore.getState().selectedMarginAccount.current
    const mangoGroup = useMangoStore.getState().selectedMangoGroup.current
    const wallet = useMangoStore.getState().wallet.current

    try {
      await settleAll(
        connection,
        new PublicKey(programId),
        mangoGroup,
        marginAccount,
        markets,
        wallet
      )
      await sleep(250)
      actions.fetchMarginAccounts()
    } catch (e) {
      console.warn('Error settling all:', e)
      if (e.message === 'No unsettled funds') {
        notify({
          message: 'There are no unsettled funds',
          type: 'error',
        })
      } else {
        notify({
          message: 'Error settling funds',
          description: e.message,
          txid: e.txid,
          type: 'error',
        })
      }
    }
  }

  return (
    <div className={`flex flex-col py-4`}>
      <div className={`-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8`}>
        <div className={`align-middle inline-block min-w-full sm:px-6 lg:px-8`}>
          {balances.length > 0 &&
          (balances.find(({ unsettled }) => unsettled > 0) ||
            balances.find(
              ({ borrows, marginDeposits }) => borrows > 0 && marginDeposits > 0
            )) ? (
            <div
              className={`flex items-center justify-between px-4 py-2 mb-2 rounded-md bg-th-bkg-1`}
            >
              <div className="flex items-center text-fgd-1 font-semibold pr-4">
                You have unsettled funds
                <Tooltip content="Use the Settle All button to move unsettled funds to your deposits. If you have borrows, settling will use deposits for that asset to reduce your borrows.">
                  <div>
                    <InformationCircleIcon
                      className={`h-5 w-5 ml-2 text-th-primary cursor-help`}
                    />
                  </div>
                </Tooltip>
              </div>
              <Button onClick={handleSettleAll}>Settle All</Button>
            </div>
          ) : null}
          {balances.length ? (
            <div
              className={`overflow-hidden border-b border-th-bkg-2 sm:rounded-md`}
            >
              <Table className={`min-w-full divide-y divide-th-bkg-2`}>
                <Thead>
                  <Tr className="text-th-fgd-3">
                    <Th
                      scope="col"
                      className={`px-6 py-2 text-left font-normal`}
                    >
                      Coin
                    </Th>
                    <Th
                      scope="col"
                      className={`px-6 py-2 text-left font-normal`}
                    >
                      Deposits
                    </Th>
                    <Th
                      scope="col"
                      className={`px-6 py-2 text-left font-normal`}
                    >
                      Borrows
                    </Th>
                    <Th
                      scope="col"
                      className={`px-6 py-2 text-left font-normal`}
                    >
                      In Orders
                    </Th>
                    <Th
                      scope="col"
                      className={`px-6 py-2 text-left font-normal`}
                    >
                      Unsettled
                    </Th>
                    <Th
                      scope="col"
                      className={`px-6 py-2 text-left font-normal`}
                    >
                      Net
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {balances.map((balance, index) => (
                    <Tr
                      key={`${index}`}
                      className={`border-b border-th-bkg-3
                        ${index % 2 === 0 ? `bg-th-bkg-3` : `bg-th-bkg-2`}
                      `}
                    >
                      <Td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-th-fgd-1`}
                      >
                        {balance.coin}
                      </Td>
                      <Td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-th-fgd-1`}
                      >
                        {balance.marginDeposits}
                      </Td>
                      <Td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-th-fgd-1`}
                      >
                        {balance.borrows}
                      </Td>
                      <Td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-th-fgd-1`}
                      >
                        {balance.orders}
                      </Td>
                      <Td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-th-fgd-1`}
                      >
                        {balance.unsettled}
                      </Td>
                      <Td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-th-fgd-1`}
                      >
                        {balance.net}
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
              No balances
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BalancesTable
