import { useCallback, useState } from 'react'
import { Table, Thead, Tbody, Tr, Th, Td } from 'react-super-responsive-table'
import {
  getTokenBySymbol,
  ZERO_I80F48,
} from '@blockworks-foundation/mango-client'
import useMangoStore from '../../stores/useMangoStore'
import { useBalances } from '../../hooks/useBalances'
import { tokenPrecision } from '../../utils/index'
import WithdrawModal from '../WithdrawModal'
import Button from '../Button'
import DepositModal from '../DepositModal'

export default function AccountBorrows() {
  const balances = useBalances()
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const mangoConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const loadingMangoAccount = useMangoStore(
    (s) => s.selectedMangoAccount.initialLoad
  )
  const connected = useMangoStore((s) => s.wallet.connected)

  const [borrowSymbol, setBorrowSymbol] = useState('')
  const [depositToSettle, setDepositToSettle] = useState(null)
  const [showBorrowModal, setShowBorrowModal] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)

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

  // console.log(depositToSettle)
  console.log('balances', balances)

  return (
    <>
      <div className="sm:flex sm:items-center sm:justify-between pb-4">
        <div className="pb-2 sm:pb-0 text-th-fgd-1 text-lg">Your Borrows</div>
        <div className="border border-th-red flex items-center justify-between p-2 rounded">
          <div className="pr-4 text-xs text-th-fgd-3">Total Borrow Value:</div>
          <span>
            ${mangoAccount.getLiabsVal(mangoGroup, mangoCache).toFixed(2)}
          </span>
        </div>
      </div>
      {mangoGroup ? (
        balances.find((b) => b.borrows.gt(ZERO_I80F48)) ? (
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
                .filter((assets) => assets.borrows.gt(ZERO_I80F48))
                .map((asset, i) => {
                  const token = getTokenBySymbol(mangoConfig, asset.symbol)
                  console.log('token', mangoConfig, asset.symbol)

                  const tokenIndex = mangoGroup.getTokenIndex(token.mintKey)
                  return (
                    <Tr
                      key={tokenIndex}
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
                            src={`/assets/icons/${asset.symbol.toLowerCase()}.svg`}
                            className={`mr-2.5`}
                          />
                          <div>{asset.symbol}</div>
                        </div>
                      </Td>
                      <Td
                        className={`px-6 py-3 whitespace-nowrap text-sm text-th-fgd-1`}
                      >
                        {asset.borrows.toFixed(tokenPrecision[asset.symbol])}
                      </Td>
                      <Td
                        className={`px-6 py-3 whitespace-nowrap text-sm text-th-fgd-1`}
                      >
                        $
                        {asset.borrows
                          .mul(mangoGroup.getPrice(tokenIndex, mangoCache))
                          .toFixed(tokenPrecision[asset.symbol])}
                      </Td>
                      <Td
                        className={`px-6 py-3 whitespace-nowrap text-sm text-th-fgd-1`}
                      >
                        <span className={`text-th-red`}>
                          {(
                            mangoGroup.getBorrowRate(tokenIndex).toNumber() *
                            100
                          ).toFixed(2)}
                          %
                        </span>
                      </Td>
                      <Td
                        className={`px-6 py-3 whitespace-nowrap text-sm text-th-fgd-1`}
                      >
                        <div className={`flex justify-end`}>
                          <Button
                            onClick={() => handleShowBorrow(asset.symbol)}
                            className="ml-3 text-xs pt-0 pb-0 h-8 pl-3 pr-3"
                            disabled={!connected || loadingMangoAccount}
                          >
                            Borrow
                          </Button>
                        </div>
                      </Td>
                    </Tr>
                  )
                })}
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
          {mangoConfig.tokens.map((token, i) => {
            const tokenIndex = mangoGroup.getTokenIndex(token.mintKey)
            return (
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
                      src={`/assets/icons/${token.symbol.toLowerCase()}.svg`}
                      className={`mr-2.5`}
                    />
                    <div>{token.symbol}</div>
                  </div>
                </Td>
                <Td
                  className={`px-6 py-3 whitespace-nowrap text-sm text-th-fgd-1`}
                >
                  ${mangoGroup.getPrice(tokenIndex, mangoCache).toFixed(2)}
                </Td>
                <Td
                  className={`px-6 py-3 whitespace-nowrap text-sm text-th-fgd-1`}
                >
                  <span className={`text-th-red`}>
                    {mangoGroup.getBorrowRate(tokenIndex).toFixed(2)}%
                  </span>
                </Td>
                <Td
                  className={`px-6 py-3 whitespace-nowrap text-sm text-th-fgd-1`}
                >
                  $
                  {mangoGroup
                    .getUiTotalDeposit(tokenIndex)
                    .sub(mangoGroup.getUiTotalBorrow(tokenIndex))
                    .toFixed(2)}
                </Td>
                <Td
                  className={`px-6 py-3 whitespace-nowrap text-sm text-th-fgd-1`}
                >
                  <div className={`flex justify-end`}>
                    <Button
                      onClick={() => handleShowBorrow(token.symbol)}
                      className="text-xs pt-0 pb-0 h-8 pl-3 pr-3"
                      disabled={!connected || loadingMangoAccount}
                    >
                      Borrow
                    </Button>
                  </div>
                </Td>
              </Tr>
            )
          })}
        </Tbody>
      </Table>
      {showBorrowModal && (
        <WithdrawModal
          isOpen={showBorrowModal}
          onClose={handleCloseWithdraw}
          tokenSymbol={borrowSymbol}
          title="Borrow and Withdraw"
          borrow
        />
      )}
      {showDepositModal && (
        <DepositModal
          isOpen={showDepositModal}
          onClose={handleCloseDeposit}
          settleDeficit={depositToSettle.deficit.toString()}
          tokenSymbol={depositToSettle.symbol}
        />
      )}
    </>
  )
}
