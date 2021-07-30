import { useCallback, useState } from 'react'
import Link from 'next/link'
import { Menu } from '@headlessui/react'
import { DotsHorizontalIcon } from '@heroicons/react/outline'
import FloatingElement from './FloatingElement'
import { ElementTitle } from './styles'
import useMangoStore from '../stores/useMangoStore'
import DepositModal from './DepositModal'
import WithdrawModal from './WithdrawModal'
import Button, { IconButton } from './Button'
import AccountsModal from './AccountsModal'

export default function MarginBalances() {
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const loadingMangoAccount = useMangoStore(
    (s) => s.selectedMangoAccount.initialLoad
  )
  const connected = useMangoStore((s) => s.wallet.connected)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [showAccountsModal, setShowAccountsModal] = useState(false)

  return (
    <>
      <FloatingElement>
        <div className="flex justify-center">
          <ElementTitle noMarignBottom>
            {mangoAccount?.name || 'Mango Account'}
          </ElementTitle>
          <div className="absolute right-0 pr-4">
            <Menu>
              <Menu.Button disabled={!connected}>
                <div className="bg-th-bkg-4 flex items-center justify-center rounded-full w-8 h-8 text-th-fgd-1 focus:outline-none hover:text-th-primary">
                  <DotsHorizontalIcon className="w-5 h-5" />
                </div>
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
              </Menu.Items>
            </Menu>
          </div>
        </div>
        <div className="flex justify-center mt-2">
          {mangoAccount ? (
            <Link href={'/account'}>
              <a className="pt-1 text-th-fgd-3 text-xs underline hover:no-underline">
                {mangoAccount?.publicKey.toString()}
              </a>
            </Link>
          ) : connected ? (
            <div className="pt-1 text-th-fgd-3">
              Deposit funds to get started
            </div>
          ) : null}
        </div>
        <div className="flex justify-center items-center mt-2">
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
            disabled={!connected || !mangoAccount || loadingMangoAccount}
          >
            <span>Withdraw</span>
          </Button>
        </div>
      </FloatingElement>
      {showDepositModal && (
        <DepositModal
          isOpen={showDepositModal}
          onClose={() => setShowDepositModal(false)}
        />
      )}
      {showWithdrawModal && (
        <WithdrawModal
          isOpen={showWithdrawModal}
          onClose={() => setShowWithdrawModal(false)}
        />
      )}
      {showAccountsModal ? (
        <AccountsModal
          onClose={() => setShowAccountsModal(false)}
          isOpen={showAccountsModal}
        />
      ) : null}
    </>
  )
}
