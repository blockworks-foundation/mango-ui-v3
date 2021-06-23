import { useCallback, useState } from 'react'
import Link from 'next/link'
import { Menu } from '@headlessui/react'
import { DotsHorizontalIcon } from '@heroicons/react/outline'
import FloatingElement from './FloatingElement'
import { ElementTitle } from './styles'
import useMangoStore from '../stores/useMangoStore'
// import useMarketList from '../hooks/useMarketList'
import {
  abbreviateAddress,
  i80f48ToPercent,
  // floorToDecimal,
  tokenPrecision,
} from '../utils/index'
import DepositModal from './DepositModal'
import WithdrawModal from './WithdrawModal'
// import BorrowModal from './BorrowModal'
import Button from './Button'
import Tooltip from './Tooltip'
import { QUOTE_INDEX } from '@blockworks-foundation/mango-client/lib/src/MangoGroup'
// import AccountsModal from './AccountsModal'

export default function MarginBalances() {
  const selectedMangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const selectedMangoGroupConfig = useMangoStore(
    (s) => s.selectedMangoGroup.config
  )
  const selectedMangoGroupCache = useMangoStore(
    (s) => s.selectedMangoGroup.cache
  )
  const selectedMangoAccount = useMangoStore(
    (s) => s.selectedMangoAccount.current
  )
  const loadingMangoAccount = useMangoStore(
    (s) => s.selectedMangoAccount.initialLoad
  )
  const connected = useMangoStore((s) => s.wallet.connected)
  // const { symbols } = useMarketList()

  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  // const [showBorrowModal, setShowBorrowModal] = useState(false)
  // const [showAccountsModal, setShowAccountsModal] = useState(false)

  const handleCloseDeposit = useCallback(() => {
    setShowDepositModal(false)
  }, [])

  const handleCloseWithdraw = useCallback(() => {
    setShowWithdrawModal(false)
  }, [])

  // const handleCloseBorrow = useCallback(() => {
  //   setShowBorrowModal(false)
  // }, [])

  // const handleCloseAccounts = useCallback(() => {
  //   setShowAccountsModal(false)
  // }, [])

  return (
    <>
      <FloatingElement>
        <div className="flex justify-between pb-5">
          <div className="w-8 h-8" />
          <div className="flex flex-col items-center">
            <ElementTitle noMarignBottom>Margin Account</ElementTitle>
            {selectedMangoAccount ? (
              <Link href={'/account'}>
                <a className="pt-1 text-th-fgd-3 text-xs underline hover:no-underline">
                  {abbreviateAddress(selectedMangoAccount?.publicKey)}
                </a>
              </Link>
            ) : null}
          </div>
          <Menu>
            <div className="relative h-full">
              <Menu.Button
                className="flex items-center justify-center rounded-full bg-th-bkg-3 w-8 h-8 hover:text-th-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!connected}
              >
                <DotsHorizontalIcon className="w-5 h-5" />
              </Menu.Button>
              {/* <Menu.Items className="bg-th-bkg-1 mt-2 p-1 absolute right-0 shadow-lg outline-none rounded-md w-48 z-20">
                <Menu.Item>
                  <button
                    className="flex flex-row font-normal items-center rounded-none w-full p-2 hover:bg-th-bkg-2 hover:cursor-pointer focus:outline-none"
                    onClick={() => setShowAccountsModal(true)}
                  >
                    <div className="pl-2 text-left">Change Account</div>
                  </button>
                </Menu.Item>
                <Menu.Item>
                  <button
                    className="flex flex-row font-normal items-center rounded-none w-full p-2 hover:bg-th-bkg-2 hover:cursor-pointer focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!selectedMangoAccount}
                    onClick={() => setShowBorrowModal(true)}
                  >
                    <div className="pl-2 text-left">Borrow</div>
                  </button>
                </Menu.Item>
                <Menu.Item>
                  <button
                    className="flex flex-row font-normal items-center rounded-none w-full p-2 hover:bg-th-bkg-2 hover:cursor-pointer focus:outline-none"
                    onClick={() => setShowDepositModal(true)}
                  >
                    <div className="pl-2 text-left">Deposit</div>
                  </button>
                </Menu.Item>
                <Menu.Item>
                  <button
                    className="flex flex-row font-normal items-center rounded-none w-full p-2 hover:bg-th-bkg-2 hover:cursor-pointer focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!selectedMangoAccount}
                    onClick={() => setShowWithdrawModal(true)}
                  >
                    <div className="pl-2 text-left">Withdraw</div>
                  </button>
                </Menu.Item>
              </Menu.Items> */}
            </div>
          </Menu>
        </div>
        {selectedMangoGroup ? (
          <table className={`min-w-full`}>
            <thead>
              <tr className={`text-center text-th-fgd-4 mb-2 text-xs`}>
                <th scope="col" className={`flex-auto font-normal text-left`}>
                  Asset
                </th>
                <th
                  scope="col"
                  className={`flex-auto font-normal text-right px-2`}
                >
                  Deposits
                </th>
                <th
                  scope="col"
                  className={`flex-auto font-normal text-right px-2`}
                >
                  Borrows
                </th>
                <th
                  scope="col"
                  className="flex-auto font-normal flex justify-end items-center"
                >
                  <Tooltip
                    className="text-xs py-1"
                    content="Deposit APR and Borrow APY"
                  >
                    <div>Deposits / Borrows</div>
                  </Tooltip>
                </th>
              </tr>
            </thead>
            <tbody>
              {selectedMangoGroupConfig.tokens.map(({ symbol, mintKey }) => {
                const tokenIndex = selectedMangoGroup.getTokenIndex(mintKey)
                return (
                  <tr key={symbol} className={`text-th-fgd-1`}>
                    <td className={`flex items-center py-2`}>
                      <img
                        alt=""
                        width="20"
                        height="20"
                        src={`/assets/icons/${symbol.toLowerCase()}.svg`}
                        className={`mr-2.5`}
                      />
                      <span>{symbol}</span>
                    </td>
                    <td className={`text-right px-2`}>
                      {selectedMangoAccount
                        ? selectedMangoAccount
                            .getUiDeposit(
                              selectedMangoGroupCache.rootBankCache[tokenIndex],
                              selectedMangoGroup,
                              tokenIndex
                            )
                            .toFixed(tokenPrecision[symbol])
                        : (0).toFixed(tokenPrecision[symbol])}
                    </td>
                    <td className={`text-right px-2`}>
                      {selectedMangoAccount
                        ? selectedMangoAccount
                            .getUiBorrow(
                              selectedMangoGroupCache.rootBankCache[tokenIndex],
                              selectedMangoGroup,
                              tokenIndex
                            )
                            .toFixed(tokenPrecision[symbol])
                        : (0).toFixed(tokenPrecision[symbol])}
                    </td>
                    <td className={`text-right`}>
                      <span className={`text-th-green`}>
                        {i80f48ToPercent(
                          selectedMangoGroup.getDepositRate(tokenIndex)
                        ).toFixed(2)}
                        %
                      </span>
                      <span className={`text-th-fgd-4`}>{'  /  '}</span>
                      <span className={`text-th-red`}>
                        {i80f48ToPercent(
                          selectedMangoGroup.getBorrowRate(tokenIndex)
                        ).toFixed(2)}
                        %
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : null}
        <div className={`flex justify-center items-center mt-4`}>
          <Button
            onClick={() => setShowDepositModal(true)}
            className="w-1/2"
            disabled={!connected || loadingMangoAccount}
          >
            <span>Deposit</span>
          </Button>
          <Button
            onClick={() => setShowWithdrawModal(true)}
            className="ml-4 w-1/2"
            disabled={
              !connected || !selectedMangoAccount || loadingMangoAccount
            }
          >
            <span>Withdraw</span>
          </Button>
        </div>
      </FloatingElement>
      {showDepositModal && (
        <DepositModal isOpen={showDepositModal} onClose={handleCloseDeposit} />
      )}
      {showWithdrawModal && (
        <WithdrawModal
          isOpen={showWithdrawModal}
          onClose={handleCloseWithdraw}
        />
      )}
      {/* 
      {showBorrowModal && (
        <BorrowModal isOpen={showBorrowModal} onClose={handleCloseBorrow} />
      )}
      {showAccountsModal ? (
        <AccountsModal
          onClose={handleCloseAccounts}
          isOpen={showAccountsModal}
        />
      ) : null} */}
    </>
  )
}
