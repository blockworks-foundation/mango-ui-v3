import React, { useMemo, useState } from 'react'
import {
  nativeToUi,
  sleep,
} from '@blockworks-foundation/mango-client/lib/utils'
import Modal from './Modal'
import Input from './Input'
import AccountSelect from './AccountSelect'
import { ElementTitle } from './styles'
import useMangoStore from '../stores/useMangoStore'
import useMarketList from '../hooks/useMarketList'
import { getSymbolForTokenMintAddress } from '../utils/index'
import useConnection from '../hooks/useConnection'
import { deposit, initMarginAccountAndDeposit } from '../utils/mango'
import { PublicKey } from '@solana/web3.js'
import Loading from './Loading'
import Button from './Button'
import { notify } from '../utils/notifications'

const DepositModal = ({ isOpen, onClose }) => {
  const [inputAmount, setInputAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { getTokenIndex, symbols } = useMarketList()
  const { connection, programId } = useConnection()
  const mintDecimals = useMangoStore((s) => s.selectedMangoGroup.mintDecimals)
  const walletAccounts = useMangoStore((s) => s.wallet.balances)
  const actions = useMangoStore((s) => s.actions)
  const depositAccounts = useMemo(
    () =>
      walletAccounts.filter((acc) =>
        Object.values(symbols).includes(acc.account.mint.toString())
      ),
    [symbols, walletAccounts]
  )
  const [selectedAccount, setSelectedAccount] = useState(depositAccounts[0])

  const handleAccountSelect = (account) => {
    setSelectedAccount(account)
    setInputAmount('')
  }

  // TODO: remove duplication in AccountSelect
  const getBalanceForAccount = (account) => {
    const mintAddress = account?.account.mint.toString()
    const balance = nativeToUi(
      account?.account?.amount,
      mintDecimals[getTokenIndex(mintAddress)]
    )

    return balance.toString()
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

    if (!marginAccount && mangoGroup) {
      initMarginAccountAndDeposit(
        connection,
        new PublicKey(programId),
        mangoGroup,
        wallet,
        selectedAccount.account.mint,
        selectedAccount.publicKey,
        Number(inputAmount)
      )
        .then(async (_response: Array<any>) => {
          await sleep(1000)
          actions.fetchWalletBalances()
          actions.fetchMarginAccounts()
          setSubmitting(false)
          onClose()
        })
        .catch((err) => {
          setSubmitting(false)
          console.error(err)
          notify({
            message:
              'Could not perform init margin account and deposit operation',
            type: 'error',
          })
          onClose()
        })
    } else {
      deposit(
        connection,
        new PublicKey(programId),
        mangoGroup,
        marginAccount,
        wallet,
        selectedAccount.account.mint,
        selectedAccount.publicKey,
        Number(inputAmount)
      )
        .then(async (_response: string) => {
          await sleep(1000)
          actions.fetchWalletBalances()
          actions.fetchMarginAccounts()
          setSubmitting(false)
          onClose()
        })
        .catch((err) => {
          setSubmitting(false)
          console.error(err)
          notify({
            message: 'Could not perform deposit operation',
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
        <ElementTitle noMarignBottom>Deposit Funds</ElementTitle>
      </Modal.Header>
      <div className={`pb-6 px-8`}>
        <AccountSelect
          symbols={symbols}
          accounts={depositAccounts}
          selectedAccount={selectedAccount}
          onSelectAccount={handleAccountSelect}
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
            suffix={getSymbolForTokenMintAddress(
              selectedAccount?.account?.mint.toString()
            )}
          />
        </div>
        <div className={`mt-5 flex justify-center`}>
          <Button onClick={handleDeposit} className="w-full">
            <div className={`flex items-center justify-center`}>
              {submitting && <Loading />}
              {`Deposit ${
                inputAmount ? inputAmount : ''
              } ${getSymbolForTokenMintAddress(
                selectedAccount?.account?.mint.toString()
              )}
              `}
            </div>
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default React.memo(DepositModal)
