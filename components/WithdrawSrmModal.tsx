import React, { useMemo, useState } from 'react'
import Modal from './Modal'
import MangoSrmAccountSelector from './MangoSrmAccountSelector'
import useMangoStore from '../stores/useMangoStore'
import useConnection from '../hooks/useConnection'
import { withdrawSrm } from '../utils/mango'
import Loading from './Loading'
import Button from './Button'
import { notify } from '../utils/notifications'
import { SRM_DECIMALS } from '@project-serum/serum/lib/token-instructions'
import { PublicKey } from '@solana/web3.js'
import { XIcon } from '@heroicons/react/outline'

const WithdrawModal = ({ isOpen, onClose }) => {
  const [inputAmount, setInputAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { connection, programId } = useConnection()
  const walletAccounts = useMangoStore((s) => s.wallet.balances)
  const actions = useMangoStore((s) => s.actions)
  const srmMintAddress = useMangoStore((s) => s.connection.srmMint)
  const contributedSrm = useMangoStore((s) => s.wallet.contributedSrm)
  const mangoSrmAccountsForOwner = useMangoStore(
    (s) => s.wallet.srmAccountsForOwner
  )
  const walletSrmAccount = useMemo(
    () =>
      walletAccounts.find(
        (acc) => srmMintAddress === acc.account.mint.toString()
      ),
    [walletAccounts, srmMintAddress]
  )
  const [selectedAccount, setSelectedAccount] = useState(
    mangoSrmAccountsForOwner[0]
  )

  const withdrawDisabled = Number(inputAmount) <= 0

  const setMaxForSelectedAccount = () => {
    setInputAmount(contributedSrm.toFixed(SRM_DECIMALS))
  }

  const handleWithdraw = () => {
    setSubmitting(true)
    const marginAccount = useMangoStore.getState().selectedMarginAccount.current
    const mangoGroup = useMangoStore.getState().selectedMangoGroup.current
    const wallet = useMangoStore.getState().wallet.current
    if (marginAccount && mangoGroup) {
      withdrawSrm(
        connection,
        new PublicKey(programId),
        mangoGroup,
        selectedAccount,
        wallet,
        walletSrmAccount.publicKey,
        Number(inputAmount)
      )
        .then((transSig: string) => {
          setSubmitting(false)
          notify({
            message: `Withdrew ${inputAmount} SRM into your account`,
            txid: `${transSig}`,
            type: 'info',
          })
          onClose()
          actions.fetchWalletBalances()
          actions.fetchMangoSrmAccounts()
          actions.fetchMangoGroup()
        })
        .catch((err) => {
          setSubmitting(false)
          console.warn('Error withdrawing:', err)
          notify({
            message: 'Could not perform withdraw operation',
            description: `${err}`,
            type: 'error',
          })
          onClose()
        })
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header>
        <div className={`text-th-fgd-4 flex-shrink invisible`}>X</div>
        <div
          className={`text-th-fgd-4 flex-grow text-center flex items-center justify-center`}
        >
          <div className={`flex-initial`}>Select: </div>
          <div className={`ml-4 flex-grow`}>
            <MangoSrmAccountSelector
              accounts={mangoSrmAccountsForOwner}
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
          <Button onClick={handleWithdraw} disabled={withdrawDisabled}>
            <div className={`flex items-center`}>
              {submitting && <Loading />}
              Withdraw
            </div>
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default React.memo(WithdrawModal)
