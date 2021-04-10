import React, { useMemo, useState } from 'react'
import xw from 'xwind'
// import { nativeToUi } from '@blockworks-foundation/mango-client/lib/utils'
import Modal from './Modal'
import AccountSelect from './AccountSelect'
import useMangoStore from '../stores/useMangoStore'
import useMarketList from '../hooks/useMarketList'
import { getSymbolForTokenMintAddress, tokenPrecision } from '../utils/index'
import useConnection from '../hooks/useConnection'
import { withdraw } from '../utils/mango'
import Loading from './Loading'
import Button from './Button'

const WithdrawModal = ({ isOpen, onClose }) => {
  const [inputAmount, setInputAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { symbols } = useMarketList()
  const { getTokenIndex } = useMarketList()
  const { connection, programId } = useConnection()
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

  const withdrawDisabled = Number(inputAmount) <= 0

  const setMaxForSelectedAccount = () => {
    const marginAccount = useMangoStore.getState().selectedMarginAccount.current
    const mangoGroup = useMangoStore.getState().selectedMangoGroup.current
    const mintAddress = selectedAccount?.account.mint.toString()
    const tokenIndex = getTokenIndex(mintAddress)
    const symbol = getSymbolForTokenMintAddress(mintAddress)
    const max = marginAccount.getUiDeposit(mangoGroup, tokenIndex)

    setInputAmount(max.toFixed(tokenPrecision[symbol]))
  }

  const handleWithdraw = () => {
    setSubmitting(true)
    const marginAccount = useMangoStore.getState().selectedMarginAccount.current
    const mangoGroup = useMangoStore.getState().selectedMangoGroup.current
    const wallet = useMangoStore.getState().wallet.current
    if (marginAccount && mangoGroup) {
      console.log('withdrawing')

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
        .then((transSig: string) => {
          actions.fetchWalletBalances()
          setSubmitting(false)
          console.log('Successfull withrawal:', transSig)
          onClose()
        })
        .catch((err) => {
          setSubmitting(false)
          console.warn('Error withdrawing:', err)
          onClose()
        })
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header>
        <div css={xw`text-mango-med-light flex-shrink invisible`}>X</div>
        <div
          css={xw`text-mango-med-light flex-grow text-center flex items-center justify-center`}
        >
          <div css={xw`flex-initial`}>Select: </div>
          <div css={xw`ml-4 flex-grow`}>
            <AccountSelect
              hideBalance
              accounts={depositAccounts}
              selectedAccount={selectedAccount}
              onSelectAccount={setSelectedAccount}
            />
          </div>
        </div>
        <div css={xw`text-mango-med-light flex-shrink ml-6 mr-2 text-lg`}>
          <button onClick={onClose} css={xw`hover:text-mango-yellow`}>
            <svg
              viewBox="64 64 896 896"
              focusable="false"
              data-icon="close"
              width="1em"
              height="1em"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M563.8 512l262.5-312.9c4.4-5.2.7-13.1-6.1-13.1h-79.8c-4.7 0-9.2 2.1-12.3 5.7L511.6 449.8 295.1 191.7c-3-3.6-7.5-5.7-12.3-5.7H203c-6.8 0-10.5 7.9-6.1 13.1L459.4 512 196.9 824.9A7.95 7.95 0 00203 838h79.8c4.7 0 9.2-2.1 12.3-5.7l216.5-258.1 216.5 258.1c3 3.6 7.5 5.7 12.3 5.7h79.8c6.8 0 10.5-7.9 6.1-13.1L563.8 512z"></path>
            </svg>
          </button>
        </div>
      </Modal.Header>
      <div css={xw`pb-6 px-8`}>
        <div css={xw`mt-3 text-center sm:mt-5`}>
          <div css={xw`mt-6 bg-mango-dark-light rounded-md flex items-center`}>
            <img
              alt=""
              width="20"
              height="20"
              src={`/assets/icons/${getSymbolForTokenMintAddress(
                selectedAccount?.account?.mint.toString()
              ).toLowerCase()}.svg`}
              css={xw`ml-3`}
            />
            <input
              type="number"
              min="0"
              css={xw`outline-none bg-mango-dark-light w-full py-4 mx-3 text-2xl text-gray-300 flex-grow`}
              placeholder="0.00"
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
            ></input>
            <Button
              onClick={setMaxForSelectedAccount}
              css={xw`m-2 rounded py-1`}
            >
              Max
            </Button>
          </div>
        </div>
        <div css={xw`mt-5 sm:mt-6 flex justify-center`}>
          <Button onClick={handleWithdraw} disabled={withdrawDisabled}>
            <div css={xw`flex items-center`}>
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
