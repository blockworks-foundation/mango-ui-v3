import { useBalances } from '../hooks/useBalances'
import useMangoStore, { mangoClient } from '../stores/useMangoStore'
import Button from '../components/Button'
import { notify } from '../utils/notifications'
import { Table, Thead, Tbody, Tr, Th, Td } from 'react-super-responsive-table'
import { InformationCircleIcon } from '@heroicons/react/outline'
import Tooltip from './Tooltip'
import { ceilToDecimal, floorToDecimal, sleep } from '../utils'
import { Market } from '@project-serum/serum'
import {
  getTokenBySymbol,
  ZERO_I80F48,
} from '@blockworks-foundation/mango-client'

const BalancesTable = () => {
  const balances = useBalances()
  const actions = useMangoStore((s) => s.actions)
  const mangoGroupConfig = useMangoStore((s) => s.selectedMangoGroup.config)

  async function handleSettleAll() {
    const mangoAccount = useMangoStore.getState().selectedMangoAccount.current
    const mangoGroup = useMangoStore.getState().selectedMangoGroup.current
    const markets = useMangoStore.getState().selectedMangoGroup.markets
    const wallet = useMangoStore.getState().wallet.current

    try {
      const spotMarkets = Object.values(markets).filter(
        (mkt) => mkt instanceof Market
      ) as Market[]
      // @ts-ignore
      await mangoClient.settleAll(mangoGroup, mangoAccount, spotMarkets, wallet)
      notify({ title: 'Successfully settled funds' })
      await sleep(250)
      actions.fetchMangoAccounts()
    } catch (e) {
      console.warn('Error settling all:', e)
      if (e.message === 'No unsettled funds') {
        notify({
          title: 'There are no unsettled funds',
          type: 'error',
        })
      } else {
        notify({
          title: 'Error settling funds',
          description: e.message,
          txid: e.txid,
          type: 'error',
        })
      }
    }
  }

  const filteredBalances = balances.filter(
    (bal) =>
      +bal.deposits > 0 ||
      +bal.borrows > 0 ||
      bal.orders > 0 ||
      bal.unsettled > 0
  )

  return (
    <div className={`flex flex-col py-4`}>
      <div className={`-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8`}>
        <div className={`align-middle inline-block min-w-full sm:px-6 lg:px-8`}>
          {balances.length > 0 &&
          (balances.find(({ unsettled }) => unsettled > 0) ||
            balances.find(
              ({ borrows, deposits }) =>
                borrows.gt(ZERO_I80F48) && deposits.gt(ZERO_I80F48)
            )) ? (
            <div
              className={`flex items-center justify-between px-6 py-3 mb-2 rounded-md bg-th-bkg-1`}
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
          {filteredBalances.length > 0 ? (
            <div
              className={`overflow-hidden border-b border-th-bkg-2 sm:rounded-md`}
            >
              <Table className={`min-w-full divide-y divide-th-bkg-2`}>
                <Thead>
                  <Tr className="text-th-fgd-3 text-xs">
                    <Th
                      scope="col"
                      className={`px-6 py-3 text-left font-normal`}
                    >
                      Asset
                    </Th>
                    <Th
                      scope="col"
                      className={`px-6 py-3 text-left font-normal`}
                    >
                      Deposits
                    </Th>
                    <Th
                      scope="col"
                      className={`px-6 py-3 text-left font-normal`}
                    >
                      Borrows
                    </Th>
                    <Th
                      scope="col"
                      className={`px-6 py-3 text-left font-normal`}
                    >
                      In Orders
                    </Th>
                    <Th
                      scope="col"
                      className={`px-6 py-3 text-left font-normal`}
                    >
                      Unsettled
                    </Th>
                    <Th
                      scope="col"
                      className={`px-6 py-3 text-left font-normal`}
                    >
                      Net
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredBalances.map((balance, index) => {
                    const tokenConfig = getTokenBySymbol(
                      mangoGroupConfig,
                      balance.symbol.toUpperCase()
                    )
                    return (
                      <Tr
                        key={`${index}`}
                        className={`border-b border-th-bkg-3
                        ${index % 2 === 0 ? `bg-th-bkg-3` : `bg-th-bkg-2`}
                      `}
                      >
                        <Td
                          className={`flex items-center px-6 py-3 whitespace-nowrap text-sm text-th-fgd-1`}
                        >
                          <img
                            alt=""
                            width="20"
                            height="20"
                            src={`/assets/icons/${balance.symbol.toLowerCase()}.svg`}
                            className={`mr-2.5`}
                          />

                          {balance.symbol}
                        </Td>
                        <Td
                          className={`px-6 py-3 whitespace-nowrap text-sm text-th-fgd-1`}
                        >
                          {floorToDecimal(
                            parseFloat(balance.deposits.floor().toFixed()),
                            tokenConfig.decimals
                          )}
                        </Td>
                        <Td
                          className={`px-6 py-3 whitespace-nowrap text-sm text-th-fgd-1`}
                        >
                          {ceilToDecimal(
                            parseFloat(balance.borrows.ceil().toFixed()),
                            tokenConfig.decimals
                          )}
                        </Td>
                        <Td
                          className={`px-6 py-3 whitespace-nowrap text-sm text-th-fgd-1`}
                        >
                          {balance.orders}
                        </Td>
                        <Td
                          className={`px-6 py-3 whitespace-nowrap text-sm text-th-fgd-1`}
                        >
                          {balance.unsettled}
                        </Td>
                        <Td
                          className={`px-6 py-3 whitespace-nowrap text-sm text-th-fgd-1`}
                        >
                          {floorToDecimal(
                            parseFloat(balance.net.toFixed()),
                            tokenConfig.decimals
                          )}
                        </Td>
                      </Tr>
                    )
                  })}
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
