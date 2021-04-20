import { useBalances } from '../hooks/useBalances'
import useMangoStore from '../stores/useMangoStore'
import { settleAll } from '../utils/mango'
import useConnection from '../hooks/useConnection'
import Button from '../components/Button'
import { notify } from '../utils/notifications'

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
        programId,
        mangoGroup,
        marginAccount,
        markets,
        wallet
      )
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
          type: 'error',
        })
      }
    }
  }

  return (
    <div className={`flex flex-col py-6`}>
      <div className={`-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8`}>
        <div className={`align-middle inline-block min-w-full sm:px-6 lg:px-8`}>
          {balances.length ? (
            <div className={`text-right`}>
              <Button onClick={handleSettleAll}>Settle All</Button>
            </div>
          ) : null}
          {balances.length ? (
            <div
              className={`overflow-hidden border-b border-th-bkg-2 sm:rounded-md`}
            >
              <table className={`min-w-full divide-y divide-th-bkg-2`}>
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-base font-medium text-th-fgd-2 tracking-wider`}
                    >
                      Coin
                    </th>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-base font-medium text-th-fgd-2 tracking-wider`}
                    >
                      Deposits
                    </th>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-base font-medium text-th-fgd-2 tracking-wider`}
                    >
                      Borrows
                    </th>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-base font-medium text-th-fgd-2 tracking-wider`}
                    >
                      In Orders
                    </th>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-base font-medium text-th-fgd-2 tracking-wider`}
                    >
                      Unsettled
                    </th>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-base font-medium text-th-fgd-2 tracking-wider`}
                    >
                      Net
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {balances.map((balance, index) => (
                    <tr
                      key={`${index}`}
                      className={`
                        ${index % 2 === 0 ? `bg-th-bkg-1` : `bg-th-bkg-3`}
                      `}
                    >
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-th-fgd-2`}
                      >
                        {balance.coin}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-th-fgd-2`}
                      >
                        {balance.marginDeposits}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-th-fgd-2`}
                      >
                        {balance.borrows}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-th-fgd-2`}
                      >
                        {balance.orders}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-th-fgd-2`}
                      >
                        {balance.unsettled}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-th-fgd-2`}
                      >
                        {balance.net}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
