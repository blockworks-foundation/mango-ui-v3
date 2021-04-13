import React, { useMemo, useState } from 'react'
import { nativeToUi } from '@blockworks-foundation/mango-client/lib/utils'
import Modal from './Modal'
import AccountSelect from './AccountSelect'
import useMangoStore from '../stores/useMangoStore'
import useMarketList from '../hooks/useMarketList'
import { getSymbolForTokenMintAddress, tokenPrecision } from '../utils/index'
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

    return balance.toFixed(tokenPrecision[symbol])
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
        .then((response: Array<any>) => {
          actions.fetchWalletBalances()
          setSubmitting(false)
          notify({
            message: `Deposited ${inputAmount} into your account`,
            description: `Hash of transaction is ${response[1]}`,
          })
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
        .then((response: string) => {
          actions.fetchWalletBalances()
          setSubmitting(false)
          notify({
            message: `Deposited ${inputAmount} into your account`,
            description: `Hash of transaction is ${response}`,
          })
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
              src={`/assets/icons/${getSymbolForTokenMintAddress(
                selectedAccount?.account?.mint.toString()
              ).toLowerCase()}.svg`}
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
