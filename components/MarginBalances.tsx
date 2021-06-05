import { useCallback, useState } from 'react'
import Link from 'next/link'
import { Menu } from '@headlessui/react'
import { DotsHorizontalIcon } from '@heroicons/react/outline'
import FloatingElement from './FloatingElement'
import { ElementTitle } from './styles'
import useMangoStore from '../stores/useMangoStore'
import useMarketList from '../hooks/useMarketList'
import {
  abbreviateAddress,
  floorToDecimal,
  tokenPrecision,
} from '../utils/index'
import DepositModal from './DepositModal'
import WithdrawModal from './WithdrawModal'
import BorrowModal from './BorrowModal'
import Button from './Button'
import Tooltip from './Tooltip'
import AccountsModal from './AccountsModal'

export default function MarginBalances() {
  const selectedMangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const selectedMarginAccount = useMangoStore(
    (s) => s.selectedMarginAccount.current
  )
  const loadingMarginAccount = useMangoStore(
    (s) => s.selectedMarginAccount.initialLoad
  )
  const connected = useMangoStore((s) => s.wallet.connected)
  const { symbols } = useMarketList()

  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [showBorrowModal, setShowBorrowModal] = useState(false)
  const [showAccountsModal, setShowAccountsModal] = useState(false)

  const handleCloseDeposit = useCallback(() => {
    setShowDepositModal(false)
  }, [])

  const handleCloseWithdraw = useCallback(() => {
    setShowWithdrawModal(false)
  }, [])

  const handleCloseBorrow = useCallback(() => {
    setShowBorrowModal(false)
  }, [])

  const handleCloseAccounts = useCallback(() => {
    setShowAccountsModal(false)
  }, [])

  return (
    <>
      <FloatingElement>
        <div className="flex justify-between pb-5">
          <div className="w-8 h-8" />
          <div className="flex flex-col items-center">
            <ElementTitle noMarignBottom>Margin Account</ElementTitle>
            {selectedMarginAccount ? (
              <Link href={'/account'}>
                <a className="pt-1 text-th-fgd-3 text-xs underline hover:no-underline">
                  {abbreviateAddress(selectedMarginAccount?.publicKey)}
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
              <Menu.Items className="bg-th-bkg-1 mt-2 p-1 absolute right-0 shadow-lg outline-none rounded-md w-48 z-20">
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
                    disabled={!selectedMarginAccount}
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
                    disabled={!selectedMarginAccount}
                    onClick={() => setShowWithdrawModal(true)}
                  >
                    <div className="pl-2 text-left">Withdraw</div>
                  </button>
                </Menu.Item>
              </Menu.Items>
            </div>
          </Menu>
        </div>
        {selectedMangoGroup ? (
          <table className={`min-w-full`}>
            <thead>
              <tr className={`text-center text-th-fgd-4 mb-2 text-xs`}>
                <th scope="col" className={`flex-auto font-normal text-left`}>
                  Assets
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
              {Object.entries(symbols).map(([name], i) => (
                <tr key={name} className={`text-th-fgd-1`}>
                  <td className={`flex items-center py-2`}>
                    <img
                      alt=""
                      width="20"
                      height="20"
                      src={`/assets/icons/${name.toLowerCase()}.svg`}
                      className={`mr-2.5`}
                    />
                    <span>{name}</span>
                  </td>
                  <td className={`text-right px-2`}>
                    {selectedMarginAccount
                      ? floorToDecimal(
                          selectedMarginAccount.getUiDeposit(
                            selectedMangoGroup,
                            i
                          ),
                          tokenPrecision[name]
                        ).toFixed(tokenPrecision[name])
                      : (0).toFixed(tokenPrecision[name])}
                  </td>
                  <td className={`text-right px-2`}>
                    {selectedMarginAccount
                      ? selectedMarginAccount
                          .getUiBorrow(selectedMangoGroup, i)
                          .toFixed(tokenPrecision[name])
                      : (0).toFixed(tokenPrecision[name])}
                  </td>
                  <td className={`text-right`}>
                    <span className={`text-th-green`}>
                      {(selectedMangoGroup.getDepositRate(i) * 100).toFixed(2)}%
                    </span>
                    <span className={`text-th-fgd-4`}>{'  /  '}</span>
                    <span className={`text-th-red`}>
                      {(selectedMangoGroup.getBorrowRate(i) * 100).toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
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
      {showBorrowModal && (
        <BorrowModal isOpen={showBorrowModal} onClose={handleCloseBorrow} />
      )}
      {showAccountsModal ? (
        <AccountsModal
          onClose={handleCloseAccounts}
          isOpen={showAccountsModal}
        />
      ) : null}
    </>
  )
}
