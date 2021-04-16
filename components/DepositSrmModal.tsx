import React, { useMemo, useState } from 'react'
import { nativeToUi } from '@blockworks-foundation/mango-client/lib/utils'
import Modal from './Modal'
import AccountSelect from './AccountSelect'
import useMangoStore from '../stores/useMangoStore'
import useConnection from '../hooks/useConnection'
import { depositSrm } from '../utils/mango'
import { PublicKey } from '@solana/web3.js'
import Loading from './Loading'
import Button from './Button'
import { notify } from '../utils/notifications'
import { SRM_DECIMALS } from '@project-serum/serum/lib/token-instructions'
import { XIcon } from '@heroicons/react/outline'

const DepositSrmModal = ({ isOpen, onClose }) => {
  const [inputAmount, setInputAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { connection, programId } = useConnection()
  const walletAccounts = useMangoStore((s) => s.wallet.balances)
  const actions = useMangoStore((s) => s.actions)
  const srmMintAddress = useMangoStore((s) => s.connection.srmMint)
  const mangoSrmAccountsForOwner = useMangoStore(
    (s) => s.wallet.srmAccountsForOwner
  )
  const depositAccounts = useMemo(
    () =>
      walletAccounts.filter(
        (acc) => srmMintAddress === acc.account.mint.toString()
      ),
    [walletAccounts, srmMintAddress]
  )
  const [selectedAccount, setSelectedAccount] = useState(depositAccounts[0])

  // TODO: remove duplication in AccountSelect
  const getBalanceForAccount = (account) => {
    const balance = nativeToUi(account?.account?.amount, SRM_DECIMALS)

    return balance.toFixed(SRM_DECIMALS)
  }

  const setMaxForSelectedAccount = () => {
    const max = getBalanceForAccount(selectedAccount)
    setInputAmount(max)
  }

  const handleDeposit = () => {
    setSubmitting(true)
    const marginAccount = useMangoStore.getState().selectedMarginAccount.current
    const mangoGroup = useMangoStore.getState().selectedMangoGroup.current
    const wallet = useMangoStore.getState().wallet.current
    if (marginAccount && mangoGroup) {
      depositSrm(
        connection,
        new PublicKey(programId),
        mangoGroup,
        wallet,
        selectedAccount.publicKey,
        Number(inputAmount),
        mangoSrmAccountsForOwner?.length
          ? mangoSrmAccountsForOwner[0].publicKey
          : undefined
      )
        .then((_mangoSrmAcct: PublicKey) => {
          setSubmitting(false)
          actions.fetchMangoSrmAccounts()
          actions.fetchWalletBalances()
          actions.fetchMangoGroup()
          onClose()
        })
        .catch((err) => {
          setSubmitting(false)
          console.error(err)
          notify({
            message: 'Could not perform SRM deposit operation',
            description: '',
            type: 'error',
          })
          onClose()
        })
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header>
        <div className={`text-th-fgd-3 flex-shrink invisible`}>X</div>
        <div
          className={`text-th-fgd-3 flex-grow text-center flex items-center justify-center`}
        >
          <div className={`flex-initial`}>Select: </div>
          <div className={`ml-4 flex-grow`}>
            <AccountSelect
              accounts={depositAccounts}
              selectedAccount={selectedAccount}
              onSelectAccount={setSelectedAccount}
            />
          </div>
        </div>
        <button
          onClick={onClose}
          className={`text-th-fgd-3 mr-2 ml-4 hover:text-th-primary`}
        >
          <XIcon className={`h-6 w-6`} />
        </button>
      </Modal.Header>
      <div className={`pb-6 px-8`}>
        <div className={`mt-3 text-center sm:mt-5`}>
          <div className={`mt-6 bg-th-bkg-3 rounded-md flex items-center`}>
            <img
              alt=""
              width="20"
              height="20"
              src={`/assets/icons/SRM.svg`}
              className={`ml-3`}
            />
            <input
              type="number"
              min="0"
              className={`outline-none bg-th-bkg-3 w-full py-4 mx-3 text-2xl text-th-fgd-2 flex-grow`}
              placeholder="0.00"
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
            ></input>
            <Button
              onClick={setMaxForSelectedAccount}
              className={`m-2 rounded py-1`}
            >
              Max
            </Button>
          </div>
        </div>
        <div className={`mt-5 sm:mt-6 flex justify-center`}>
          <Button onClick={handleDeposit} disabled={Number(inputAmount) <= 0}>
            <div className={`flex items-center`}>
              {submitting && <Loading />}
              Deposit
            </div>
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default React.memo(DepositSrmModal)
