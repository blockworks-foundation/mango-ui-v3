import React, { useMemo, useState } from 'react'
import { nativeToUi } from '@blockworks-foundation/mango-client/lib/utils'
import Modal from './Modal'
import Input from './Input'
import AccountSelect from './AccountSelect'
import { ElementTitle } from './styles'
import useMangoStore from '../stores/useMangoStore'
import useMarketList from '../hooks/useMarketList'
import {
  floorToDecimal,
  getSymbolForTokenMintAddress,
  tokenPrecision,
} from '../utils/index'
import useConnection from '../hooks/useConnection'
import { deposit, initMarginAccountAndDeposit } from '../utils/mango'
import { PublicKey } from '@solana/web3.js'
import Loading from './Loading'
import Button from './Button'
import { notify } from '../utils/notifications'
import { XIcon } from '@heroicons/react/outline'

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

  // TODO: remove duplication in AccountSelect
  const getBalanceForAccount = (account) => {
    const mintAddress = account?.account.mint.toString()
    const balance = nativeToUi(
      account?.account?.amount,
      mintDecimals[getTokenIndex(mintAddress)]
    )
    const symbol = getSymbolForTokenMintAddress(mintAddress)

    return floorToDecimal(balance, tokenPrecision[symbol]).toString()
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
    console.log('handleDeposit', wallet, walletAccounts)

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
        .then((_response: Array<any>) => {
          actions.fetchWalletBalances()
          actions.fetchMangoGroup()
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
        programId,
        mangoGroup,
        marginAccount,
        wallet,
        selectedAccount.account.mint,
        selectedAccount.publicKey,
        Number(inputAmount)
      )
        .then((_response: string) => {
          actions.fetchWalletBalances()
          actions.fetchMangoGroup()
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
        {/* not sure what the below div os for? */}
        <div className={`text-th-fgd-3 flex-shrink invisible w-5`}>X</div>
        <ElementTitle noMarignBottom>Deposit</ElementTitle>
        <button
          onClick={onClose}
          className={`text-th-fgd-1 hover:text-th-primary`}
        >
          <XIcon className={`h-5 w-5`} />
        </button>
      </Modal.Header>
      <div className={`pb-6 px-8`}>
        <div className={`text-th-fgd-1 pb-2`}>Token</div>
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
          {/* {selectedAccount ? (
            <img
              alt=""
              width="20"
              height="20"
              src={`/assets/icons/${getSymbolForTokenMintAddress(
                selectedAccount?.account?.mint.toString()
              ).toLowerCase()}.svg`}
              className={`absolute ml-2`}
            />
          ) : null} */}
          <Input
            type="number"
            min="0"
            className={`border border-th-fgd-4 flex-grow`}
            placeholder="0.00"
            value={inputAmount}
            onChange={(e) => setInputAmount(e.target.value)}
          />
        </div>
        <div className={`mt-5 sm:mt-6 flex justify-center`}>
          <Button onClick={handleDeposit}>
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

export default React.memo(DepositModal)
