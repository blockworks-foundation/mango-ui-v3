import { useCallback, useState } from 'react'
import Link from 'next/link'
import { Menu } from '@headlessui/react'
import { DotsHorizontalIcon } from '@heroicons/react/outline'
import FloatingElement from './FloatingElement'
import { ElementTitle } from './styles'
import useMangoStore from '../stores/useMangoStore'
import {
  abbreviateAddress,
  divideBnToNumber,
  i80f48ToPercent,
  tokenPrecision,
} from '../utils/index'
import DepositModal from './DepositModal'
import WithdrawModal from './WithdrawModal'
// import BorrowModal from './BorrowModal'
import Button from './Button'
import Tooltip from './Tooltip'
import AccountsModal from './AccountsModal'

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

  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [showAccountsModal, setShowAccountsModal] = useState(false)
  // const [showBorrowModal, setShowBorrowModal] = useState(false)

  const handleCloseDeposit = useCallback(() => {
    setShowDepositModal(false)
  }, [])

  const handleCloseWithdraw = useCallback(() => {
    setShowWithdrawModal(false)
  }, [])

  // const handleCloseBorrow = useCallback(() => {
  //   setShowBorrowModal(false)
  // }, [])

  const handleCloseAccounts = useCallback(() => {
    setShowAccountsModal(false)
  }, [])

  return (
    <>
      <FloatingElement>
        <div className="flex justify-between pb-5">
          <div className="w-8 h-8" />
          <div className="flex flex-col items-center">
            <ElementTitle noMarignBottom>Mango Account</ElementTitle>
            {selectedMangoAccount ? (
              <Link href={'/account'}>
                <a className="pt-1 text-th-fgd-3 text-xs underline hover:no-underline">
                  {selectedMangoAccount?.publicKey.toString()}
                </a>
              </Link>
            ) : connected ? (
              <div className="pt-1 text-th-fgd-3">
                Deposit funds to get started
              </div>
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
                {/* <Menu.Item>
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
                </Menu.Item> */}
              </Menu.Items>
            </div>
          </Menu>
        </div>
        <div className={`flex justify-center items-center`}>
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

      {/* {showBorrowModal && (
        <BorrowModal isOpen={showBorrowModal} onClose={handleCloseBorrow} />
      )} */}
      {showAccountsModal ? (
        <AccountsModal
          onClose={handleCloseAccounts}
          isOpen={showAccountsModal}
        />
      ) : null}
    </>
  )
}
