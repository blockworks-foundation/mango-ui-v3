import { useCallback, useState } from 'react'
import { Table, Thead, Tbody, Tr, Th, Td } from 'react-super-responsive-table'
import useConnection from '../../hooks/useConnection'
import useMangoStore from '../../stores/useMangoStore'
import useMarketList from '../../hooks/useMarketList'
import { useBalances } from '../../hooks/useBalances'
import { notify } from '../../utils/notifications'
import { sleep } from '../../utils'
import { PublicKey } from '@solana/web3.js'
import { tokenPrecision } from '../../utils/index'
import { settleBorrow } from '../../utils/mango'
import BorrowModal from '../BorrowModal'
import Button from '../Button'
import DepositModal from '../DepositModal'

export default function AccountBorrows() {
  const balances = useBalances()
  const { programId, connection } = useConnection()
  const actions = useMangoStore((s) => s.actions)
  const selectedMangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const selectedMarginAccount = useMangoStore(
    (s) => s.selectedMarginAccount.current
  )
  const loadingMarginAccount = useMangoStore(
    (s) => s.selectedMarginAccount.initialLoad
  )
  const connected = useMangoStore((s) => s.wallet.connected)
  const { symbols } = useMarketList()

  const prices = useMangoStore((s) => s.selectedMangoGroup.prices)

  const [borrowSymbol, setBorrowSymbol] = useState('')
  const [depositToSettle, setDepositToSettle] = useState(null)
  const [showBorrowModal, setShowBorrowModal] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)

  async function handleSettleBorrow(token, borrowQuantity, depositBalance) {
    const marginAccount = useMangoStore.getState().selectedMarginAccount.current
    const mangoGroup = useMangoStore.getState().selectedMangoGroup.current
    const wallet = useMangoStore.getState().wallet.current

    if (borrowQuantity > depositBalance) {
      const deficit = borrowQuantity - depositBalance
      handleShowDeposit(token, deficit)
      return
    }

    try {
      await settleBorrow(
        connection,
        new PublicKey(programId),
        mangoGroup,
        marginAccount,
        wallet,
        new PublicKey(symbols[token]),
        Number(borrowQuantity)
      )
      await sleep(250)
      actions.fetchMarginAccounts()
    } catch (e) {
      console.warn('Error settling all:', e)
      if (e.message === 'No unsettled borrows') {
        notify({
          message: 'There are no unsettled borrows',
          type: 'error',
        })
      } else {
        notify({
          message: 'Error settling borrows',
          description: e.message,
          txid: e.txid,
          type: 'error',
        })
      }
    }
  }

  const handleCloseWithdraw = useCallback(() => {
    setShowBorrowModal(false)
  }, [])

  const handleCloseDeposit = useCallback(() => {
    setShowDepositModal(false)
    setDepositToSettle(null)
  }, [])

  const handleShowBorrow = (symbol) => {
    setBorrowSymbol(symbol)
    setShowBorrowModal(true)
  }

  const handleShowDeposit = (symbol, deficit) => {
    setDepositToSettle({ symbol, deficit })
    setShowDepositModal(true)
  }

  console.log(depositToSettle)

  return (
    <>
      <div className="sm:flex sm:items-center sm:justify-between pb-4">
        <div className="pb-2 sm:pb-0 text-th-fgd-1 text-lg">Your Borrows</div>
        <div className="border border-th-red flex items-center justify-between p-2 rounded">
          <div className="pr-4 text-xs text-th-fgd-3">Total Borrow Value:</div>
          <span>
            $
            {balances
              .reduce((acc, d, i) => acc + d.borrows * prices[i], 0)
              .toFixed(2)}
          </span>
        </div>
      </div>
      {selectedMangoGroup ? (
        balances.find((b) => b.borrows > 0) ? (
          <Table className="min-w-full divide-y divide-th-bkg-2">
            <Thead>
              <Tr className="text-th-fgd-3 text-xs">
                <Th scope="col" className={`px-6 py-3 text-left font-normal`}>
                  Asset
                </Th>
                <Th scope="col" className={`px-6 py-3 text-left font-normal`}>
                  Balance
                </Th>
                <Th scope="col" className={`px-6 py-3 text-left font-normal`}>
                  Value
                </Th>
                <Th scope="col" className="px-6 py-3 text-left font-normal">
                  Interest APR
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {balances
                .filter((assets) => assets.borrows > 0)
                .map((asset, i) => (
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
                          src={`/assets/icons/${asset.coin.toLowerCase()}.svg`}
                          className={`mr-2.5`}
                        />
                        <div>{asset.coin}</div>
                      </div>
                    </Td>
                    <Td
                      className={`px-6 py-3 whitespace-nowrap text-sm text-th-fgd-1`}
                    >
                      {asset.borrows.toFixed(tokenPrecision[asset.coin])}
                    </Td>
                    <Td
                      className={`px-6 py-3 whitespace-nowrap text-sm text-th-fgd-1`}
                    >
                      $
                      {(
                        asset.borrows *
                        prices[
                          Object.keys(symbols).findIndex(
                            (key) => key === asset.coin
                          )
                        ]
                      ).toFixed(tokenPrecision[asset.coin])}
                    </Td>
                    <Td
                      className={`px-6 py-3 whitespace-nowrap text-sm text-th-fgd-1`}
                    >
                      <span className={`text-th-red`}>
                        {(
                          selectedMangoGroup.getBorrowRate(
                            Object.keys(symbols).findIndex(
                              (key) => key === asset.coin
                            )
                          ).toNumber() * 100
                        ).toFixed(2)}
                        %
                      </span>
                    </Td>
                    <Td
                      className={`px-6 py-3 whitespace-nowrap text-sm text-th-fgd-1`}
                    >
                      <div className={`flex justify-end`}>
                        <Button
                          onClick={() =>
                            handleSettleBorrow(
                              asset.coin,
                              asset.borrows,
                              asset.marginDeposits
                            )
                          }
                          className="text-xs pt-0 pb-0 h-8 pl-3 pr-3"
                          disabled={
                            !connected ||
                            !selectedMarginAccount ||
                            loadingMarginAccount
                          }
                        >
                          Settle
                        </Button>
                        <Button
                          onClick={() => handleShowBorrow(asset.coin)}
                          className="ml-3 text-xs pt-0 pb-0 h-8 pl-3 pr-3"
                          disabled={!connected || loadingMarginAccount}
                        >
                          Borrow
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                ))}
            </Tbody>
          </Table>
        ) : (
          <div
            className={`w-full text-center py-6 bg-th-bkg-1 text-th-fgd-3 rounded-md`}
          >
            No borrows found.
          </div>
        )
      ) : null}
      <div className="pb-2 pt-8 text-th-fgd-1 text-lg">Available Assets</div>
      <Table className="min-w-full divide-y divide-th-bkg-2">
        <Thead>
          <Tr className="text-th-fgd-3 text-xs">
            <Th scope="col" className={`px-6 py-3 text-left font-normal`}>
              Asset
            </Th>
            <Th scope="col" className={`px-6 py-3 text-left font-normal`}>
              Price
            </Th>
            <Th scope="col" className="px-6 py-3 text-left font-normal">
              Interest APR
            </Th>
            <Th scope="col" className="px-6 py-3 text-left font-normal">
              Available Liquidity
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {Object.entries(symbols).map(([asset], i) => (
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
                    src={`/assets/icons/${asset.toLowerCase()}.svg`}
                    className={`mr-2.5`}
                  />
                  <div>{asset}</div>
                </div>
              </Td>
              <Td
                className={`px-6 py-3 whitespace-nowrap text-sm text-th-fgd-1`}
              >
                ${prices[i]}
              </Td>
              <Td
                className={`px-6 py-3 whitespace-nowrap text-sm text-th-fgd-1`}
              >
                <span className={`text-th-red`}>
                  {(selectedMangoGroup.getBorrowRate(i) * 100).toFixed(2)}%
                </span>
              </Td>
              <Td
                className={`px-6 py-3 whitespace-nowrap text-sm text-th-fgd-1`}
              >
                {(
                  selectedMangoGroup.getUiTotalDeposit(i) -
                  selectedMangoGroup.getUiTotalBorrow(i)
                ).toLocaleString()}
              </Td>
              <Td
                className={`px-6 py-3 whitespace-nowrap text-sm text-th-fgd-1`}
              >
                <div className={`flex justify-end`}>
                  <Button
                    onClick={() => handleShowBorrow(asset)}
                    className="text-xs pt-0 pb-0 h-8 pl-3 pr-3"
                    disabled={!connected || loadingMarginAccount}
                  >
                    Borrow
                  </Button>
                </div>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      {showBorrowModal && (
        <BorrowModal
          isOpen={showBorrowModal}
          onClose={handleCloseWithdraw}
          tokenSymbol={borrowSymbol}
        />
      )}
      {showDepositModal && (
        <DepositModal
          isOpen={showDepositModal}
          onClose={handleCloseDeposit}
          settleDeficit={depositToSettle.deficit}
          tokenSymbol={depositToSettle.symbol}
        />
      )}
    </>
  )
}
