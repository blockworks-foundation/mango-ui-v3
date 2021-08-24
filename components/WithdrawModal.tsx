import React, { FunctionComponent, useEffect, useMemo, useState } from 'react'
import Modal from './Modal'
import Input from './Input'
import { ElementTitle } from './styles'
import useMangoStore from '../stores/useMangoStore'
import { DECIMALS, floorToDecimal, tokenPrecision } from '../utils/index'
import Loading from './Loading'
import Slider from './Slider'
import Button, { LinkButton } from './Button'
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
import { Disclosure } from '@headlessui/react'
import Select from './Select'
import { withdraw } from '../utils/mango'
import {
  ZERO_I80F48,
  I80F48,
  MangoAccount,
  nativeI80F48ToUi,
} from '@blockworks-foundation/mango-client'
import { notify } from '../utils/notifications'

interface WithdrawModalProps {
  onClose: () => void
  isOpen: boolean
  title?: string
  tokenSymbol?: string
  borrow?: boolean
}

const WithdrawModal: FunctionComponent<WithdrawModalProps> = ({
  isOpen,
  onClose,
  tokenSymbol = '',
  borrow = false,
  title,
}) => {
  const [withdrawTokenSymbol, setWithdrawTokenSymbol] = useState(
    tokenSymbol || 'USDC'
  )
  const [inputAmount, setInputAmount] = useState('')
  const [invalidAmountMessage, setInvalidAmountMessage] = useState('')
  const [maxAmount, setMaxAmount] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [includeBorrow, setIncludeBorrow] = useState(borrow)
  const [simulation, setSimulation] = useState(null)
  const [showSimulation, setShowSimulation] = useState(false)
  const [sliderPercentage, setSliderPercentage] = useState(0)
  const [maxButtonTransition, setMaxButtonTransition] = useState(false)

  const actions = useMangoStore((s) => s.actions)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const mangoGroupConfig = useMangoStore((s) => s.selectedMangoGroup.config)

  const tokens = useMemo(() => mangoGroupConfig.tokens, [mangoGroupConfig])
  const token = useMemo(
    () => tokens.find((t) => t.symbol === withdrawTokenSymbol),
    [withdrawTokenSymbol, tokens]
  )
  const tokenIndex = mangoGroup.getTokenIndex(token.mintKey)

  useEffect(() => {
    if (!mangoGroup || !mangoAccount || !withdrawTokenSymbol) return

    const mintDecimals = mangoGroup.tokens[tokenIndex].decimals
    const tokenDeposits = mangoAccount.getUiDeposit(
      mangoCache.rootBankCache[tokenIndex],
      mangoGroup,
      tokenIndex
    )
    const tokenBorrows = mangoAccount.getUiBorrow(
      mangoCache.rootBankCache[tokenIndex],
      mangoGroup,
      tokenIndex
    )

    const maxWithoutBorrows = nativeI80F48ToUi(
      mangoAccount.getAvailableBalance(mangoGroup, mangoCache, tokenIndex),
      mangoGroup.tokens[tokenIndex].decimals
    )
    const maxWithBorrows = mangoAccount.getMaxWithBorrowForToken(
      mangoGroup,
      mangoCache,
      tokenIndex
    )

    // get max withdraw amount
    let maxWithdraw = maxWithoutBorrows
    if (includeBorrow) {
      maxWithdraw = maxWithoutBorrows.gt(maxWithBorrows)
        ? maxWithoutBorrows
        : maxWithBorrows
    }

    if (maxWithdraw.gt(I80F48.fromNumber(0))) {
      setMaxAmount(
        floorToDecimal(parseFloat(maxWithdraw.toFixed()), token.decimals)
      )
    } else {
      setMaxAmount(0)
    }

    // simulate change to deposits & borrow based on input amount
    const parsedInputAmount = inputAmount
      ? I80F48.fromString(inputAmount)
      : ZERO_I80F48
    let newDeposit = tokenDeposits.sub(parsedInputAmount)
    newDeposit = newDeposit.gt(ZERO_I80F48) ? newDeposit : ZERO_I80F48

    let newBorrow = parsedInputAmount.sub(tokenDeposits)
    newBorrow = newBorrow.gt(ZERO_I80F48) ? newBorrow : ZERO_I80F48
    newBorrow = newBorrow.add(tokenBorrows)

    // clone MangoAccount and arrays to not modify selectedMangoAccount
    const simulation = new MangoAccount(null, mangoAccount)
    simulation.deposits = [...mangoAccount.deposits]
    simulation.borrows = [...mangoAccount.borrows]

    // update with simulated values
    simulation.deposits[tokenIndex] = newDeposit
      .mul(I80F48.fromNumber(Math.pow(10, mintDecimals)))
      .div(mangoCache.rootBankCache[tokenIndex].depositIndex)
    simulation.borrows[tokenIndex] = newBorrow
      .mul(I80F48.fromNumber(Math.pow(10, mintDecimals)))
      .div(mangoCache.rootBankCache[tokenIndex].borrowIndex)

    const liabsVal = simulation
      .getLiabsVal(mangoGroup, mangoCache, 'Init')
      .toNumber()
    const leverage = simulation.getLeverage(mangoGroup, mangoCache).toNumber()
    const equity = simulation.computeValue(mangoGroup, mangoCache).toNumber()
    const initHealthRatio = simulation
      .getHealthRatio(mangoGroup, mangoCache, 'Init')
      .toNumber()

    setSimulation({
      initHealthRatio,
      liabsVal,
      leverage,
      equity,
    })
  }, [
    includeBorrow,
    inputAmount,
    tokenIndex,
    mangoAccount,
    mangoGroup,
    mangoCache,
  ])

  const handleWithdraw = () => {
    setSubmitting(true)

    withdraw({
      amount: Number(inputAmount),
      token: mangoGroup.tokens[tokenIndex].mint,
      allowBorrow: includeBorrow,
    })
      .then((txid: string) => {
        setSubmitting(false)
        actions.fetchMangoGroup()
        actions.fetchMangoAccounts()
        actions.fetchWalletTokens()
        notify({
          title: 'Withdraw successful',
          type: 'success',
          txid,
        })
        onClose()
      })
      .catch((err) => {
        setSubmitting(false)
        console.error('Error withdrawing:', err)
        notify({
          title: 'Could not perform withdraw',
          description: err.message,
          txid: err.txid,
          type: 'error',
        })
        onClose()
      })
  }

  const handleSetSelectedAsset = (symbol) => {
    setInputAmount('')
    setSliderPercentage(0)
    setWithdrawTokenSymbol(symbol)
  }

  const getDepositsForSelectedAsset = (): I80F48 => {
    return mangoAccount.getUiDeposit(
      mangoCache.rootBankCache[tokenIndex],
      mangoGroup,
      tokenIndex
    )
  }

  const getBorrowAmount = () => {
    const tokenBalance = getDepositsForSelectedAsset()
    const borrowAmount = I80F48.fromString(inputAmount).sub(tokenBalance)
    return borrowAmount.gt(ZERO_I80F48) ? borrowAmount : 0
  }

  const getAccountStatusColor = (
    initHealthRatio: number,
    isRisk?: boolean,
    isStatus?: boolean
  ) => {
    if (initHealthRatio < 1) {
      return isRisk ? (
        <div className="text-th-red">High</div>
      ) : isStatus ? (
        'bg-th-red'
      ) : (
        'border-th-red text-th-red'
      )
    } else if (initHealthRatio > 1 && initHealthRatio < 10) {
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
    setInputAmount('')
    setSliderPercentage(0)
    setInvalidAmountMessage('')
  }

  const setMaxForSelectedAsset = async () => {
    setInputAmount(maxAmount.toString())
    setSliderPercentage(100)
    setInvalidAmountMessage('')
    setMaxButtonTransition(true)
  }

  const onChangeAmountInput = (amount: string) => {
    setInputAmount(amount)
    setSliderPercentage((Number(amount) / maxAmount) * 100)
    setInvalidAmountMessage('')
  }

  const onChangeSlider = async (percentage) => {
    const amount = (percentage / 100) * maxAmount
    if (percentage === 100) {
      setInputAmount(maxAmount.toString())
    } else {
      setInputAmount(floorToDecimal(amount, token.decimals).toString())
    }
    setSliderPercentage(percentage)
    setInvalidAmountMessage('')
    validateAmountInput(amount)
  }

  const validateAmountInput = (amount) => {
    const parsedAmount = Number(amount)
    if (
      (getDepositsForSelectedAsset() === ZERO_I80F48 ||
        getDepositsForSelectedAsset().lt(I80F48.fromNumber(parsedAmount))) &&
      !includeBorrow
    ) {
      setInvalidAmountMessage('Insufficient balance. Borrow funds to withdraw')
    }
  }

  useEffect(() => {
    if (simulation && simulation.initHealthRatio < 0 && includeBorrow) {
      setInvalidAmountMessage(
        'Leverage too high. Reduce the amount to withdraw'
      )
    }
  }, [simulation])

  const getTokenBalances = () => {
    const mangoCache = useMangoStore.getState().selectedMangoGroup.cache
    const mangoGroup = useMangoStore.getState().selectedMangoGroup.current

    return tokens.map((token) => {
      const tokenIndex = mangoGroup.getTokenIndex(token.mintKey)
      return {
        symbol: token.symbol,
        balance: mangoAccount
          .getUiDeposit(
            mangoCache.rootBankCache[tokenIndex],
            mangoGroup,
            tokenIndex
          )
          .toFixed(tokenPrecision[token.symbol]),
      }
    })
  }

  // turn off slider transition for dragging slider handle interaction
  useEffect(() => {
    if (maxButtonTransition) {
      setMaxButtonTransition(false)
    }
  }, [maxButtonTransition])

  if (!withdrawTokenSymbol) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <>
        {!showSimulation ? (
          <>
            <Modal.Header>
              <ElementTitle noMarignBottom>
                {title ? title : 'Withdraw Funds'}
              </ElementTitle>
            </Modal.Header>
            <div className="pb-2 text-th-fgd-1">Asset</div>
            <Select
              value={
                withdrawTokenSymbol && mangoAccount ? (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <img
                        alt=""
                        width="20"
                        height="20"
                        src={`/assets/icons/${withdrawTokenSymbol.toLowerCase()}.svg`}
                        className={`mr-2.5`}
                      />
                      {withdrawTokenSymbol}
                    </div>
                    {mangoAccount
                      .getUiDeposit(
                        mangoCache.rootBankCache[tokenIndex],
                        mangoGroup,
                        tokenIndex
                      )
                      .toFixed(tokenPrecision[withdrawTokenSymbol])}
                  </div>
                ) : (
                  <span className="text-th-fgd-4">Select an asset</span>
                )
              }
              onChange={(asset) => handleSetSelectedAsset(asset)}
            >
              {getTokenBalances().map(({ symbol, balance }) => (
                <Select.Option key={symbol} value={symbol}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <img
                        alt=""
                        width="20"
                        height="20"
                        src={`/assets/icons/${symbol.toLowerCase()}.svg`}
                        className={`mr-2.5`}
                      />
                      <span>{symbol}</span>
                    </div>
                    {balance}
                  </div>
                </Select.Option>
              ))}
            </Select>
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
                <button
                  className="font-normal text-th-fgd-1 underline cursor-pointer default-transition hover:text-th-primary hover:no-underline focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={
                    !includeBorrow &&
                    getDepositsForSelectedAsset().eq(ZERO_I80F48)
                  }
                  onClick={setMaxForSelectedAsset}
                >
                  Max
                </button>
              </div>
            </div>
            <div className="flex">
              <Input
                disabled={!withdrawTokenSymbol}
                type="number"
                min="0"
                className={`border border-th-fgd-4 flex-grow pr-11`}
                error={!!invalidAmountMessage}
                placeholder="0.00"
                value={inputAmount}
                onBlur={(e) => validateAmountInput(e.target.value)}
                onChange={(e) => onChangeAmountInput(e.target.value)}
                suffix={withdrawTokenSymbol}
              />
              {simulation ? (
                <Tooltip
                  placement="right"
                  content="Projected Leverage"
                  className="py-1"
                >
                  <span
                    className={`${getAccountStatusColor(
                      simulation.initHealthRatio
                    )} bg-th-bkg-1 border flex font-semibold h-10 items-center justify-center ml-2 rounded text-th-fgd-1 w-14`}
                  >
                    {simulation.leverage.toFixed(2)}x
                  </span>
                </Tooltip>
              ) : null}
            </div>
            {invalidAmountMessage ? (
              <div className="flex items-center pt-1.5 text-th-red">
                <ExclamationCircleIcon className="h-4 w-4 mr-1.5" />
                {invalidAmountMessage}
              </div>
            ) : null}
            <div className="pt-3 pb-4">
              <Slider
                disabled={!withdrawTokenSymbol}
                value={sliderPercentage}
                onChange={(v) => onChangeSlider(v)}
                step={1}
                maxButtonTransition={maxButtonTransition}
              />
            </div>
            <div className={`pt-8 flex justify-center`}>
              <Button
                onClick={() => setShowSimulation(true)}
                disabled={
                  Number(inputAmount) <= 0 || simulation?.initHealthRatio < 0
                }
                className="w-full"
              >
                Next
              </Button>
            </div>
          </>
        ) : null}
        {showSimulation && simulation ? (
          <>
            <Modal.Header>
              <ElementTitle noMarignBottom>Confirm Withdraw</ElementTitle>
            </Modal.Header>
            {simulation.initHealthRatio < 0 ? (
              <div className="border border-th-red mb-4 p-2 rounded">
                <div className="flex items-center text-th-red">
                  <ExclamationCircleIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />
                  Prices have changed and increased your leverage. Reduce the
                  withdrawal amount.
                </div>
              </div>
            ) : null}
            <div className="bg-th-bkg-1 p-4 rounded-lg text-th-fgd-1 text-center">
              <div className="text-th-fgd-3 pb-1">{`You're about to withdraw`}</div>
              <div className="flex items-center justify-center">
                <div className="font-semibold relative text-xl">
                  {inputAmount}
                  <span className="absolute bottom-0.5 font-normal ml-1.5 text-xs text-th-fgd-4">
                    {withdrawTokenSymbol}
                  </span>
                </div>
              </div>
              {getBorrowAmount() > 0 ? (
                <div className="pt-2 text-th-fgd-4">{`Includes borrow of ~${getBorrowAmount().toFixed(
                  DECIMALS[withdrawTokenSymbol]
                )} ${withdrawTokenSymbol}`}</div>
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
                              simulation.initHealthRatio,
                              false,
                              true
                            )} opacity-75`}
                          ></span>
                          <span
                            className={`relative inline-flex rounded-full h-2 w-2 ${getAccountStatusColor(
                              simulation.initHealthRatio,
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
                    {simulation ? (
                      <div>
                        <div className="flex justify-between pb-2">
                          <div className="text-th-fgd-4">Account Value</div>
                          <div className="text-th-fgd-1">
                            ${simulation.equity.toFixed(2)}
                          </div>
                        </div>
                        <div className="flex justify-between pb-2">
                          <div className="text-th-fgd-4">Account Risk</div>
                          <div className="text-th-fgd-1">
                            {getAccountStatusColor(
                              simulation.initHealthRatio,
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
                          <div className="text-th-fgd-4">Borrow Value</div>
                          <div className="text-th-fgd-1">
                            ${simulation.liabsVal.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>
            <div className={`mt-5 flex justify-center`}>
              <Button
                onClick={handleWithdraw}
                disabled={
                  Number(inputAmount) <= 0 || simulation.initHealthRatio < 0
                }
                className="w-full"
              >
                <div className={`flex items-center justify-center`}>
                  {submitting && <Loading className="-ml-1 mr-3" />}
                  Withdraw
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
      </>
    </Modal>
  )
}

export default React.memo(WithdrawModal)
