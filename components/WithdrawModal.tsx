import React, { useEffect, useMemo, useState } from 'react'
import Modal from './Modal'
import Input from './Input'
import AccountSelect from './AccountSelect'
import { ElementTitle } from './styles'
import useMangoStore from '../stores/useMangoStore'
import useMarketList from '../hooks/useMarketList'
import {
  getSymbolForTokenMintAddress,
  displayDepositsForMarginAccount,
} from '../utils/index'
import useConnection from '../hooks/useConnection'
import { borrowAndWithdraw, withdraw } from '../utils/mango'
import Loading from './Loading'
import Slider from './Slider'
import Button, { LinkButton } from './Button'
import { notify } from '../utils/notifications'
import Switch from './Switch'
import Tooltip from './Tooltip'
import {
  ExclamationCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/outline'
import {
  ChevronLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/solid'
import { Disclosure, Transition } from '@headlessui/react'
import { PublicKey } from '@solana/web3.js'
import { MarginAccount, uiToNative } from '@blockworks-foundation/mango-client'

const WithdrawModal = ({ isOpen, onClose }) => {
  const [inputAmount, setInputAmount] = useState(0)
  const [invalidAmountMessage, setInvalidAmountMessage] = useState('')
  const [maxAmount, setMaxAmount] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [includeBorrow, setIncludeBorrow] = useState(false)
  const [simulation, setSimulation] = useState(null)
  const [showSimulation, setShowSimulation] = useState(false)
  const [sliderPercentage, setSliderPercentage] = useState(0)
  const [maxButtonTransition, setMaxButtonTransition] = useState(false)
  const { getTokenIndex, symbols } = useMarketList()
  const { connection, programId } = useConnection()
  const walletAccounts = useMangoStore((s) => s.wallet.balances)
  const prices = useMangoStore((s) => s.selectedMangoGroup.prices)
  const selectedMangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
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
  const symbol = getSymbolForTokenMintAddress(
    selectedAccount?.account?.mint.toString()
  )
  const DECIMALS = {
    BTC: 6,
    ETH: 5,
    SOL: 2,
    SRM: 2,
    USDT: 2,
  }

  useEffect(() => {
    if (!selectedMangoGroup || !selectedMarginAccount) return

    const mintDecimals = selectedMangoGroup.mintDecimals[tokenIndex]
    const groupIndex = selectedMangoGroup.indexes[tokenIndex]
    const deposits = selectedMarginAccount.getUiDeposit(
      selectedMangoGroup,
      tokenIndex
    )
    const borrows = selectedMarginAccount.getUiBorrow(
      selectedMangoGroup,
      tokenIndex
    )

    const currentAssetsVal =
      selectedMarginAccount.getAssetsVal(selectedMangoGroup, prices) -
      getMaxForSelectedAccount() * prices[tokenIndex]
    const currentLiabs = selectedMarginAccount.getLiabsVal(
      selectedMangoGroup,
      prices
    )
    // multiply by 0.99 and subtract 0.01 to account for rounding issues
    const liabsAvail = (currentAssetsVal / 1.2 - currentLiabs) * 0.99 - 0.01

    // calculate max withdraw amount
    const amountToWithdraw = includeBorrow
      ? liabsAvail / prices[tokenIndex] + getMaxForSelectedAccount()
      : getMaxForSelectedAccount()

    if (amountToWithdraw > 0) {
      setMaxAmount(amountToWithdraw)
    } else {
      setMaxAmount(0)
    }

    // simulate change to deposits & borrow based on input amount
    const newDeposit = Math.max(0, deposits - inputAmount)
    const newBorrows = borrows + Math.max(0, inputAmount - deposits)

    // clone MarginAccount and arrays to not modify selectedMarginAccount
    const simulation = new MarginAccount(null, selectedMarginAccount)
    simulation.deposits = [...selectedMarginAccount.deposits]
    simulation.borrows = [...selectedMarginAccount.borrows]

    // update with simulated values
    simulation.deposits[tokenIndex] =
      uiToNative(newDeposit, mintDecimals).toNumber() / groupIndex.deposit
    simulation.borrows[tokenIndex] =
      uiToNative(newBorrows, mintDecimals).toNumber() / groupIndex.borrow

    const equity = simulation.computeValue(selectedMangoGroup, prices)
    const assetsVal = simulation.getAssetsVal(selectedMangoGroup, prices)
    const liabsVal = simulation.getLiabsVal(selectedMangoGroup, prices)
    const collateralRatio = simulation.getCollateralRatio(
      selectedMangoGroup,
      prices
    )
    const leverage = 1 / Math.max(0, collateralRatio - 1)
    setSimulation({
      equity,
      assetsVal,
      liabsVal,
      collateralRatio,
      leverage,
    })
  }, [
    includeBorrow,
    inputAmount,
    prices,
    tokenIndex,
    selectedMarginAccount,
    selectedMangoGroup,
  ])

  const handleWithdraw = () => {
    setSubmitting(true)
    const marginAccount = useMangoStore.getState().selectedMarginAccount.current
    const mangoGroup = useMangoStore.getState().selectedMangoGroup.current
    const wallet = useMangoStore.getState().wallet.current
    if (!marginAccount || !mangoGroup) return

    if (!includeBorrow) {
      withdraw(
        connection,
        new PublicKey(programId),
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
            txid: err.txid,
            type: 'error',
          })
          onClose()
        })
    } else {
      borrowAndWithdraw(
        connection,
        new PublicKey(programId),
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
            txid: err.txid,
            type: 'error',
          })
          onClose()
        })
    }
  }

  const handleSetSelectedAccount = (val) => {
    setInputAmount(0)
    setSliderPercentage(0)
    setSelectedAccount(val)
  }

  const getMaxForSelectedAccount = () => {
    return displayDepositsForMarginAccount(
      selectedMarginAccount,
      selectedMangoGroup,
      tokenIndex
    )
  }

  const getBorrowAmount = () => {
    const tokenBalance = getMaxForSelectedAccount()
    const borrowAmount = inputAmount - tokenBalance
    return borrowAmount > 0 ? borrowAmount : 0
  }

  const getAccountStatusColor = (
    collateralRatio: number,
    isRisk?: boolean,
    isStatus?: boolean
  ) => {
    if (collateralRatio < 1.25) {
      return isRisk ? (
        <div className="text-th-red">High</div>
      ) : isStatus ? (
        'bg-th-red'
      ) : (
        'border-th-red text-th-red'
      )
    } else if (collateralRatio > 1.25 && collateralRatio < 1.5) {
      return isRisk ? (
        <div className="text-th-orange">Moderate</div>
      ) : isStatus ? (
        'bg-th-orange'
      ) : (
        'border-th-orange text-th-orange'
      )
    } else {
      return isRisk ? (
        <div className="text-th-green">Low</div>
      ) : isStatus ? (
        'bg-th-green'
      ) : (
        'border-th-green text-th-green'
      )
    }
  }

  const handleIncludeBorrowSwitch = (checked) => {
    setIncludeBorrow(checked)
    setInputAmount(0)
    setSliderPercentage(0)
    setInvalidAmountMessage('')
  }

  const setMaxForSelectedAccount = () => {
    setInputAmount(getMaxForSelectedAccount())
    setSliderPercentage(100)
    setInvalidAmountMessage('')
    setMaxButtonTransition(true)
  }

  const setMaxBorrowForSelectedAccount = async () => {
    setInputAmount(trimDecimals(maxAmount, DECIMALS[symbol]))
    setSliderPercentage(100)
    setInvalidAmountMessage('')
    setMaxButtonTransition(true)
  }

  const onChangeAmountInput = (amount) => {
    setInputAmount(amount)
    setSliderPercentage((amount / maxAmount) * 100)
    setInvalidAmountMessage('')
  }

  const onChangeSlider = async (percentage) => {
    const amount = (percentage / 100) * maxAmount
    setInputAmount(trimDecimals(amount, DECIMALS[symbol]))
    setSliderPercentage(percentage)
    setInvalidAmountMessage('')
  }

  const validateAmountInput = (e) => {
    const amount = e.target.value
    if (Number(amount) <= 0) {
      setInvalidAmountMessage('Withdrawal amount must be greater than 0')
    }
    if (simulation.collateralRatio < 1.2) {
      setInvalidAmountMessage(
        'Leverage too high. Reduce the amount to withdraw'
      )
    }
  }

  const trimDecimals = (n, digits) => {
    const step = Math.pow(10, digits || 0)
    const temp = Math.trunc(step * n)

    return temp / step
  }

  // turn off slider transition for dragging slider handle interaction
  useEffect(() => {
    if (maxButtonTransition) {
      setMaxButtonTransition(false)
    }
  }, [maxButtonTransition])

  if (!selectedAccount) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {simulation ? (
        <>
          <Transition
            appear={true}
            show={!showSimulation}
            enter="transition ease-out delay-200 duration-500"
            enterFrom="opacity-0"
            enterTo="opacity-100"
          >
            {!showSimulation ? (
              <>
                <Modal.Header>
                  <ElementTitle noMarignBottom>Withdraw Funds</ElementTitle>
                </Modal.Header>
                <AccountSelect
                  hideAddress
                  accounts={withdrawAccounts}
                  selectedAccount={selectedAccount}
                  onSelectAccount={handleSetSelectedAccount}
                  getBalance={getMaxForSelectedAccount}
                  symbols={symbols}
                />
                <div className="flex items-center jusitfy-between text-th-fgd-1 mt-4 p-2 rounded-md bg-th-bkg-3">
                  <div className="flex items-center text-fgd-1 pr-4">
                    <span>Borrow Funds</span>
                    <Tooltip content="Interest is charged on your borrowed balance and is subject to change.">
                      <InformationCircleIcon
                        className={`h-5 w-5 ml-2 text-th-fgd-3 cursor-help`}
                      />
                    </Tooltip>
                  </div>
                  <Switch
                    checked={includeBorrow}
                    className="ml-auto"
                    onChange={(checked) => handleIncludeBorrowSwitch(checked)}
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
                <div className="flex">
                  <Input
                    type="number"
                    min="0"
                    className={`border border-th-fgd-4 flex-grow pr-11`}
                    error={!!invalidAmountMessage}
                    placeholder="0.00"
                    value={inputAmount}
                    onBlur={validateAmountInput}
                    onChange={(e) => onChangeAmountInput(e.target.value)}
                    suffix={symbol}
                  />
                  <Tooltip content="Account Leverage" className="py-1">
                    <span
                      className={`${getAccountStatusColor(
                        simulation.collateralRatio
                      )} bg-th-bkg-1 border flex font-semibold h-10 items-center justify-center ml-2 rounded text-th-fgd-1 w-14`}
                    >
                      {simulation.leverage < 5
                        ? simulation.leverage.toFixed(2)
                        : '>5'}
                      x
                    </span>
                  </Tooltip>
                </div>
                {invalidAmountMessage ? (
                  <div className="flex items-center pt-1.5 text-th-red">
                    <ExclamationCircleIcon className="h-4 w-4 mr-1.5" />
                    {invalidAmountMessage}
                  </div>
                ) : null}
                <div className="pt-3 pb-4">
                  <Slider
                    disabled={null}
                    value={sliderPercentage}
                    onChange={(v) => onChangeSlider(v)}
                    step={1}
                    maxButtonTransition={maxButtonTransition}
                  />
                </div>
                <div className={`mt-5 flex justify-center`}>
                  <Button
                    onClick={() => setShowSimulation(true)}
                    disabled={
                      Number(inputAmount) <= 0 ||
                      simulation.collateralRatio < 1.2
                    }
                    className="w-full"
                  >
                    Next
                  </Button>
                </div>
              </>
            ) : null}
          </Transition>
          <Transition
            show={showSimulation}
            enter="transition ease-out delay-200 duration-500"
            enterFrom="opacity-0"
            enterTo="opacity-100"
          >
            {showSimulation ? (
              <>
                <Modal.Header>
                  <ElementTitle noMarignBottom>Confirm Withdraw</ElementTitle>
                </Modal.Header>
                {simulation.collateralRatio < 1.2 ? (
                  <div className="border border-th-red mb-4 p-2 rounded">
                    <div className="flex items-center text-th-red">
                      <ExclamationCircleIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />
                      Prices have changed and increased your leverage. Reduce
                      the withdrawal amount.
                    </div>
                  </div>
                ) : null}
                <div className="bg-th-bkg-1 p-4 rounded-lg text-th-fgd-1 text-center">
                  <div className="text-th-fgd-3 pb-1">{`You're about to withdraw`}</div>
                  <div className="flex items-center justify-center">
                    <div className="font-semibold relative text-xl">
                      {inputAmount}
                      <span className="absolute bottom-0.5 font-normal ml-1.5 text-xs text-th-fgd-4">
                        {symbol}
                      </span>
                    </div>
                  </div>
                  {getBorrowAmount() > 0 ? (
                    <div className="pt-2 text-th-fgd-4">{`Includes borrow of ~${getBorrowAmount().toFixed(
                      DECIMALS[symbol]
                    )} ${symbol}`}</div>
                  ) : null}
                </div>
                <Disclosure>
                  {({ open }) => (
                    <>
                      <Disclosure.Button
                        className={`border border-th-fgd-4 default-transition font-normal mt-4 pl-3 pr-2 py-2.5 ${
                          open ? 'rounded-b-none' : 'rounded-md'
                        } text-th-fgd-1 w-full hover:bg-th-bkg-3 focus:outline-none`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="flex h-2 w-2 mr-2.5 relative">
                              <span
                                className={`animate-ping absolute inline-flex h-full w-full rounded-full ${getAccountStatusColor(
                                  simulation.collateralRatio,
                                  false,
                                  true
                                )} opacity-75`}
                              ></span>
                              <span
                                className={`relative inline-flex rounded-full h-2 w-2 ${getAccountStatusColor(
                                  simulation.collateralRatio,
                                  false,
                                  true
                                )}`}
                              ></span>
                            </span>
                            Account Health Check
                            <Tooltip content="The details of your account after this withdrawal.">
                              <InformationCircleIcon
                                className={`h-5 w-5 ml-2 text-th-fgd-3 cursor-help`}
                              />
                            </Tooltip>
                          </div>
                          {open ? (
                            <ChevronUpIcon className="h-5 w-5 mr-1" />
                          ) : (
                            <ChevronDownIcon className="h-5 w-5 mr-1" />
                          )}
                        </div>
                      </Disclosure.Button>
                      <Disclosure.Panel
                        className={`border border-th-fgd-4 border-t-0 p-4 rounded-b-md`}
                      >
                        <div>
                          <div className="flex justify-between pb-2">
                            <div className="text-th-fgd-4">Account Value</div>
                            <div className="text-th-fgd-1">
                              ${simulation.assetsVal.toFixed(2)}
                            </div>
                          </div>
                          <div className="flex justify-between pb-2">
                            <div className="text-th-fgd-4">Account Risk</div>
                            <div className="text-th-fgd-1">
                              {getAccountStatusColor(
                                simulation.collateralRatio,
                                true
                              )}
                            </div>
                          </div>
                          <div className="flex justify-between pb-2">
                            <div className="text-th-fgd-4">Leverage</div>
                            <div className="text-th-fgd-1">
                              {simulation.leverage.toFixed(2)}x
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <div className="text-th-fgd-4">
                              Collateral Ratio
                            </div>
                            <div className="text-th-fgd-1">
                              {simulation.collateralRatio * 100 < 200
                                ? Math.floor(simulation.collateralRatio * 100)
                                : '>200'}
                              %
                            </div>
                          </div>
                          {simulation.liabsVal > 0.05 ? (
                            <div className="flex justify-between pt-2">
                              <div className="text-th-fgd-4">Borrow Value</div>
                              <div className="text-th-fgd-1">
                                ${simulation.liabsVal.toFixed(2)}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </Disclosure.Panel>
                    </>
                  )}
                </Disclosure>
                <div className={`mt-5 flex justify-center`}>
                  <Button
                    onClick={handleWithdraw}
                    disabled={
                      Number(inputAmount) <= 0 ||
                      simulation.collateralRatio < 1.2
                    }
                    className="w-full"
                  >
                    <div className={`flex items-center justify-center`}>
                      {submitting && <Loading className="-ml-1 mr-3" />}
                      Confirm
                    </div>
                  </Button>
                </div>
                <LinkButton
                  className="flex items-center mt-4 text-th-fgd-3"
                  onClick={() => setShowSimulation(false)}
                >
                  <ChevronLeftIcon className="h-5 w-5 mr-1" />
                  Back
                </LinkButton>
              </>
            ) : null}
          </Transition>
        </>
      ) : (
        <>
          <div className="animate-pulse bg-th-bkg-3 h-10 mb-4 rounded w-full" />
          <div className="animate-pulse bg-th-bkg-3 h-10 mb-4 rounded w-full" />
          <div className="animate-pulse bg-th-bkg-3 h-10 mb-4 rounded w-full" />
          <div className="animate-pulse bg-th-bkg-3 h-10 mb-4 rounded w-full" />
          <div className="animate-pulse bg-th-bkg-3 h-10 mb-4 rounded w-full" />
        </>
      )}
    </Modal>
  )
}

export default React.memo(WithdrawModal)
