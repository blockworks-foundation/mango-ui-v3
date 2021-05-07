import React, { useMemo, useState } from 'react'
import Modal from './Modal'
import MangoSrmAccountSelector from './MangoSrmAccountSelector'
import useMangoStore from '../stores/useMangoStore'
import useConnection from '../hooks/useConnection'
import { withdrawSrm } from '../utils/mango'
import Loading from './Loading'
import Button from './Button'
import { ElementTitle } from './styles'
import Input from './Input'
import { notify } from '../utils/notifications'
import { SRM_DECIMALS } from '@project-serum/serum/lib/token-instructions'
import { PublicKey } from '@solana/web3.js'
import { sleep } from '../utils'

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
        .then(async (_transSig: string) => {
          setSubmitting(false)
          onClose()
          await sleep(500)
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
        {/* not sure what the below div os for? */}
        <div className={`text-th-fgd-3 flex-shrink invisible w-5`}>X</div>
        <ElementTitle noMarignBottom>Withdraw SRM</ElementTitle>
      </Modal.Header>
      <>
        <div className={`text-th-fgd-1 pb-2`}>Token Account</div>
        <MangoSrmAccountSelector
          accounts={mangoSrmAccountsForOwner}
          selectedAccount={selectedAccount}
          onSelectAccount={setSelectedAccount}
        />
        <div className="flex justify-between pb-2 pt-4">
          <div className={`text-th-fgd-1`}>Amount</div>
          <div
            className="text-th-fgd-1 underline cursor-pointer default-transition hover:text-th-primary hover:no-underline"
            onClick={setMaxForSelectedAccount}
          >
            Max
          </div>
        </div>
        <div className="flex items-center">
          <Input
            type="number"
            min="0"
            className={`border border-th-fgd-4 flex-grow pr-11`}
            placeholder="0.00"
            value={inputAmount}
            onChange={(e) => setInputAmount(e.target.value)}
            suffix="SRM"
          />
        </div>
        <div className={`mt-5 flex justify-center`}>
          <Button
            onClick={handleWithdraw}
            disabled={withdrawDisabled}
            className="w-full"
          >
            <div className={`flex items-center justify-center`}>
              {submitting && <Loading className="-ml-1 mr-3" />}
              {`Withdraw ${inputAmount ? inputAmount : ''} SRM
              `}
            </div>
          </Button>
        </div>
      </>
    </Modal>
  )
}

export default React.memo(WithdrawModal)
