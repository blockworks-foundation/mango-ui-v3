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
import { ElementTitle } from './styles'
import Input from './Input'
import { notify } from '../utils/notifications'
import { SRM_DECIMALS } from '@project-serum/serum/lib/token-instructions'
import { floorToDecimal } from '../utils'

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

    return floorToDecimal(balance, SRM_DECIMALS).toString()
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
        <div className={`text-th-fgd-3 flex-shrink invisible w-5`}>X</div>
        <ElementTitle noMarignBottom>Contribute SRM</ElementTitle>
      </Modal.Header>
      <div className={`pb-6 px-8`}>
        <AccountSelect
          accounts={depositAccounts}
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
          <Button onClick={handleDeposit} className="w-full">
            <div className={`flex items-center justify-center`}>
              {submitting && <Loading />}
              {`Deposit ${inputAmount ? inputAmount : ''} SRM
              `}
            </div>
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default React.memo(DepositSrmModal)
