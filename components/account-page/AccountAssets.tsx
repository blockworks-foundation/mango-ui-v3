import { useCallback, useState } from 'react'
import { Table, Thead, Tbody, Tr, Th, Td } from 'react-super-responsive-table'
import { InformationCircleIcon } from '@heroicons/react/outline'
import useMangoStore from '../../stores/useMangoStore'
// import { settleAllTrades } from '../../utils/mango'
import { useBalances } from '../../hooks/useBalances'
import { tokenPrecision } from '../../utils/index'
import DepositModal from '../DepositModal'
import WithdrawModal from '../WithdrawModal'
import Button from '../Button'
import Tooltip from '../Tooltip'

export default function AccountAssets() {
  const balances = useBalances()
  // const actions = useMangoStore((s) => s.actions)
  const selectedMangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const selectedMangoAccount = useMangoStore(
    (s) => s.selectedMangoAccount.current
  )
  const loadingMangoAccount = useMangoStore(
    (s) => s.selectedMangoAccount.initialLoad
  )
  const connected = useMangoStore((s) => s.wallet.connected)

  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawSymbol, setWithdrawSymbol] = useState('')
  const [depositSymbol, setDepositSymbol] = useState('')

  const handleCloseDeposit = useCallback(() => {
    setShowDepositModal(false)
  }, [])

  const handleCloseWithdraw = useCallback(() => {
    setShowWithdrawModal(false)
  }, [])

  const handleShowWithdraw = (symbol) => {
    setWithdrawSymbol(symbol)
    setShowWithdrawModal(true)
  }

  const handleShowDeposit = (symbol) => {
    setDepositSymbol(symbol)
    setShowDepositModal(true)
  }

  async function handleSettleAllTrades() {
    //   const markets = Object.values(
    //     useMangoStore.getState().selectedMangoGroup.markets
    //   )
    //   const mangoAccount = useMangoStore.getState().selectedMangoAccount.current
    //   const mangoGroup = useMangoStore.getState().selectedMangoGroup.current
    //   const wallet = useMangoStore.getState().wallet.current
    //   try {
    //     await settleAllTrades(
    //       connection,
    //       new PublicKey(programId),
    //       mangoGroup,
    //       mangoAccount,
    //       markets,
    //       wallet
    //     )
    //     await sleep(250)
    //     actions.fetchMangoAccounts()
    //   } catch (e) {
    //     console.warn('Error settling all:', e)
    //     if (e.message === 'No unsettled funds') {
    //       notify({
    //         message: 'There are no unsettled funds',
    //         type: 'error',
    //       })
    //     } else {
    //       notify({
    //         message: 'Error settling funds',
    //         description: e.message,
    //         txid: e.txid,
    //         type: 'error',
    //       })
    //     }
    //   }
  }

  return selectedMangoAccount ? (
    <>
      <div className="sm:flex sm:items-center sm:justify-between pb-2">
        <div className="pb-2 sm:pb-0 text-th-fgd-1 text-lg">Your Assets</div>
        {balances.length > 0 ? (
          <div className="border border-th-green flex items-center justify-between p-2 rounded">
            <div className="pr-4 text-xs text-th-fgd-3">Total Asset Value:</div>
            <span>$ -.--</span>
          </div>
        ) : null}
      </div>
      {balances.length > 0 &&
      balances.find(({ unsettled }) => unsettled > 0) ? (
        <div
          className={`flex items-center justify-between px-6 py-4 my-2 rounded-md bg-th-bkg-1`}
        >
          <div className="flex items-center text-fgd-1 font-semibold pr-4">
            You have unsettled funds
            <Tooltip content="Use the Settle All button to move unsettled funds to your deposits.">
              <div>
                <InformationCircleIcon
                  className={`h-5 w-5 ml-2 text-th-primary cursor-help`}
                />
              </div>
            </Tooltip>
          </div>
          <Button onClick={handleSettleAllTrades}>Settle All</Button>
        </div>
      ) : null}
      {selectedMangoGroup && balances.length > 0 ? (
        <div className={`flex flex-col py-4`}>
          <div className={`-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8`}>
            <div
              className={`align-middle inline-block min-w-full sm:px-6 lg:px-8`}
            >
              <Table className="min-w-full divide-y divide-th-bkg-2">
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
                      Available
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
                      Value
                    </Th>
                    <Th scope="col" className="px-6 py-3 text-left font-normal">
                      Interest APY
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {balances.map((bal, i) => (
                    <Tr
                      key={`${i}`}
                      className={`border-b border-th-bkg-3
                  ${i % 2 === 0 ? `bg-th-bkg-3` : `bg-th-bkg-2`}
                `}
                    >
                      <Td
                        className={`px-6 py-3 whitespace-nowrap text-sm text-th-fgd-1`}
                      >
                        <div className="flex items-center">
                          <img
                            alt=""
                            width="20"
                            height="20"
                            src={`/assets/icons/${bal.symbol.toLowerCase()}.svg`}
                            className={`mr-2.5`}
                          />
                          <div>{bal.symbol}</div>
                        </div>
                      </Td>
                      <Td
                        className={`px-6 py-3 whitespace-nowrap text-sm text-th-fgd-1`}
                      >
                        {bal.marginDeposits.toFixed(tokenPrecision[bal.symbol])}
                      </Td>
                      <Td
                        className={`px-6 py-3 whitespace-nowrap text-sm text-th-fgd-1`}
                      >
                        {bal.orders.toFixed(tokenPrecision[bal.symbol])}
                      </Td>
                      <Td
                        className={`px-6 py-3 whitespace-nowrap text-sm text-th-fgd-1`}
                      >
                        {bal.unsettled.toFixed(tokenPrecision[bal.symbol])}
                      </Td>
                      <Td
                        className={`px-6 py-3 whitespace-nowrap text-sm text-th-fgd-1`}
                      >
                        $ -.--
                        {/* {(
                          (bal.marginDeposits + bal.orders + bal.unsettled) *
                          prices[i]
                        ).toFixed(2)} */}
                      </Td>
                      <Td
                        className={`px-6 py-3 whitespace-nowrap text-sm text-th-fgd-1`}
                      >
                        <span className={`text-th-green`}>
                          {/* {(selectedMangoGroup.getDepositRate(i) * 100).toFixed(
                            2
                          )} */}
                          -.--%
                        </span>
                      </Td>
                      <Td
                        className={`px-6 py-3 whitespace-nowrap text-sm text-th-fgd-1`}
                      >
                        <div className={`flex justify-end`}>
                          <Button
                            onClick={() => handleShowDeposit(bal.symbol)}
                            className="text-xs pt-0 pb-0 h-8 pl-3 pr-3"
                            disabled={!connected || loadingMangoAccount}
                          >
                            <span>Deposit</span>
                          </Button>
                          <Button
                            onClick={() => handleShowWithdraw(bal.symbol)}
                            className="ml-3 text-xs pt-0 pb-0 h-8 pl-3 pr-3"
                            disabled={!connected || loadingMangoAccount}
                          >
                            <span>Withdraw</span>
                          </Button>
                        </div>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`w-full text-center py-6 bg-th-bkg-1 text-th-fgd-3 rounded-md`}
        >
          No assets found.
        </div>
      )}
      {showDepositModal && (
        <DepositModal
          isOpen={showDepositModal}
          onClose={handleCloseDeposit}
          tokenSymbol={depositSymbol}
        />
      )}
      {showWithdrawModal && (
        <WithdrawModal
          isOpen={showWithdrawModal}
          onClose={handleCloseWithdraw}
          tokenSymbol={withdrawSymbol}
        />
      )}
    </>
  ) : null
}
