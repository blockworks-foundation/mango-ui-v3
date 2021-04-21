import React, { useMemo, useState } from 'react'
import Modal from './Modal'
import Input from './Input'
import AccountSelect from './AccountSelect'
import { ElementTitle } from './styles'
import useMangoStore from '../stores/useMangoStore'
import useMarketList from '../hooks/useMarketList'
import {
  getSymbolForTokenMintAddress,
  formatBalanceDisplay,
} from '../utils/index'
import useConnection from '../hooks/useConnection'
import { borrowAndWithdraw, withdraw } from '../utils/mango'
import Loading from './Loading'
import Button from './Button'
import { notify } from '../utils/notifications'
import Switch from './Switch'

const WithdrawModal = ({ isOpen, onClose }) => {
  const [inputAmount, setInputAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [includeBorrow, setIncludeBorrow] = useState(false)
  const { getTokenIndex, symbols } = useMarketList()
  const { connection, programId } = useConnection()
  const walletAccounts = useMangoStore((s) => s.wallet.balances)
  const selectedMangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mintDecimals = useMangoStore((s) => s.selectedMangoGroup.mintDecimals)
  const selectedMarginAccount = useMangoStore(
    (s) => s.selectedMarginAccount.current
  )
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

  const handleSetSelectedAccount = (val) => {
    setInputAmount('')
    setSelectedAccount(val)
  }

  const withdrawDisabled = Number(inputAmount) <= 0

  const getMaxForSelectedAccount = () => {
    const marginAccount = useMangoStore.getState().selectedMarginAccount.current
    const mangoGroup = useMangoStore.getState().selectedMangoGroup.current
    return marginAccount.getUiDeposit(mangoGroup, tokenIndex)
  }

  const setMaxForSelectedAccount = () => {
    setInputAmount(getMaxForSelectedAccount().toString())
  }

  const setMaxBorrowForSelectedAccount = async () => {
    const prices = await selectedMangoGroup.getPrices(connection)
    const assetsValBeforeTokenBal = selectedMarginAccount.getAssetsVal(
      selectedMangoGroup,
      prices
    )
    const assetsVal = assetsValBeforeTokenBal - getMaxForSelectedAccount()
    const currentLiabs = selectedMarginAccount.getLiabsVal(
      selectedMangoGroup,
      prices
    )
    const liabsAvail = (assetsVal / 1.2 - currentLiabs) * 0.99 - 0.01

    const amountToWithdraw =
      liabsAvail / prices[tokenIndex] + getMaxForSelectedAccount()
    const decimals = mintDecimals[getTokenIndex(mintAddress)]
    if (amountToWithdraw > 0) {
      setInputAmount(
        formatBalanceDisplay(amountToWithdraw, decimals).toString()
      )
    } else {
      setInputAmount('0')
    }
  }

  const handleWithdraw = () => {
    setSubmitting(true)
    const marginAccount = useMangoStore.getState().selectedMarginAccount.current
    const mangoGroup = useMangoStore.getState().selectedMangoGroup.current
    const wallet = useMangoStore.getState().wallet.current
    if (!marginAccount || !mangoGroup) return

    if (Number(inputAmount) <= getMaxForSelectedAccount()) {
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
          actions.fetchWalletBalances()
          onClose()
        })
        .catch((err) => {
          setSubmitting(false)
          console.warn('Error withdrawing:', err)
          notify({
            message: 'Could not perform withdraw',
            description: `${err}`,
            type: 'error',
          })
          onClose()
        })
    } else {
      borrowAndWithdraw(
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
          actions.fetchWalletBalances()
          onClose()
        })
        .catch((err) => {
          setSubmitting(false)
          console.warn('Error borrowing and withdrawing:', err)
          notify({
            message: 'Could not perform borrow and withdraw',
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
      <div className="pb-6 px-8">
        <AccountSelect
          hideAddress
          accounts={withdrawAccounts}
          selectedAccount={selectedAccount}
          onSelectAccount={handleSetSelectedAccount}
          getBalance={getMaxForSelectedAccount}
        />
        <div className="flex items-center jusitfy-between text-th-fgd-1 mt-4 px-3 py-2 rounded-md bg-th-bkg-3">
          <span>Include Borrow</span>
          <Switch
            checked={includeBorrow}
            className="ml-auto"
            onChange={(checked) => setIncludeBorrow(checked)}
          />
        </div>
        <div className="flex justify-between pb-2 pt-4">
          <div className="text-th-fgd-1">Amount</div>
          <div className="flex space-x-4">
            <div
              className="text-th-fgd-1 underline cursor-pointer default-transition hover:text-th-primary hover:no-underline"
              onClick={
                includeBorrow
                  ? setMaxBorrowForSelectedAccount
                  : setMaxForSelectedAccount
              }
            >
              Max
            </div>
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
    </Modal>
  )
}

export default React.memo(WithdrawModal)
