import React, { useMemo, useState } from 'react'
import Modal from './Modal'
import AccountSelect from './AccountSelect'
import useMangoStore from '../stores/useMangoStore'
import useMarketList from '../hooks/useMarketList'
import { getSymbolForTokenMintAddress } from '../utils/index'
import useConnection from '../hooks/useConnection'
import { withdraw } from '../utils/mango'
import Loading from './Loading'
import Button from './Button'
import { notify } from '../utils/notifications'
import { XIcon } from '@heroicons/react/outline'

const WithdrawModal = ({ isOpen, onClose }) => {
  const [inputAmount, setInputAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { getTokenIndex, symbols } = useMarketList()
  const { connection, programId } = useConnection()
  const walletAccounts = useMangoStore((s) => s.wallet.balances)
  const actions = useMangoStore((s) => s.actions)
  const withdrawAccounts = useMemo(
    () =>
      walletAccounts.filter((acc) =>
        Object.values(symbols).includes(acc.account.mint.toString())
      ),
    [symbols, walletAccounts]
  )
  const [selectedAccount, setSelectedAccount] = useState(withdrawAccounts[0])
  const mintAddress = useMemo(() => selectedAccount?.account.mint.toString(), [
    selectedAccount,
  ])
  const tokenIndex = useMemo(() => getTokenIndex(mintAddress), [
    mintAddress,
    getTokenIndex,
  ])

  const withdrawDisabled = Number(inputAmount) <= 0

  const getMaxForSelectedAccount = () => {
    const marginAccount = useMangoStore.getState().selectedMarginAccount.current
    const mangoGroup = useMangoStore.getState().selectedMangoGroup.current
    return marginAccount.getUiDeposit(mangoGroup, tokenIndex)
  }

  const setMaxForSelectedAccount = () => {
    setInputAmount(getMaxForSelectedAccount().toString())
  }

  const handleWithdraw = () => {
    setSubmitting(true)
    const marginAccount = useMangoStore.getState().selectedMarginAccount.current
    const mangoGroup = useMangoStore.getState().selectedMangoGroup.current
    const wallet = useMangoStore.getState().wallet.current
    if (marginAccount && mangoGroup) {
      withdraw(
        connection,
        programId,
        mangoGroup,
        marginAccount,
        wallet,
        selectedAccount.account.mint,
        selectedAccount.publicKey,
        Number(inputAmount)
      )
        .then((_transSig: string) => {
          setSubmitting(false)
          actions.fetchMangoGroup()
          actions.fetchMarginAccounts()
          onClose()
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

  if (!selectedAccount) return null

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
              hideBalance
              accounts={withdrawAccounts}
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
        <div className={`mt-3 sm:mt-5`}>
          <div className="text-right text-th-fgd-2">
            Balance: {getMaxForSelectedAccount()}
          </div>
          <div className={`mt-1 bg-th-bkg-3 rounded-md flex items-center`}>
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
