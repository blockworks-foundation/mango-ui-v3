import React, { useMemo, useState } from 'react'
import Modal from './Modal'
import Input from './Input'
import AccountSelect from './AccountSelect'
import { ElementTitle } from './styles'
import useMangoStore from '../stores/useMangoStore'
import useMarketList from '../hooks/useMarketList'
import { getSymbolForTokenMintAddress } from '../utils/index'
import useConnection from '../hooks/useConnection'
import { withdraw } from '../utils/mango'
import Loading from './Loading'
import Button from './Button'
import { notify } from '../utils/notifications'

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
        <ElementTitle noMarignBottom>Withdraw Funds</ElementTitle>
      </Modal.Header>
      <div className={`pb-6 px-8`}>
        <div className={`text-th-fgd-1 pb-2`}>Token Account</div>
        <AccountSelect
          hideAddress
          accounts={withdrawAccounts}
          selectedAccount={selectedAccount}
          onSelectAccount={setSelectedAccount}
          getBalance={getMaxForSelectedAccount}
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
          <Button
            onClick={handleWithdraw}
            disabled={withdrawDisabled}
            className="w-full"
          >
            <div className={`flex items-center justify-center`}>
              {submitting && <Loading />}
              {`Withdraw ${
                inputAmount ? inputAmount : ''
              } ${getSymbolForTokenMintAddress(
                selectedAccount?.account?.mint.toString()
              )}
              `}
            </div>
          </Button>
        </div>
      </div>
      {/* <div className={`pb-6 px-8`}>
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
      </div> */}
    </Modal>
  )
}

export default React.memo(WithdrawModal)
