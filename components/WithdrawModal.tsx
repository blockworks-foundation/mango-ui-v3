import React, { FunctionComponent, useEffect, useMemo, useState } from 'react'
import Modal from './Modal'
import Input, { Label } from './Input'
import { ElementTitle } from './styles'
import useMangoStore from '../stores/useMangoStore'
import { floorToDecimal, tokenPrecision } from '../utils/index'
import Loading from './Loading'
import Button, { LinkButton } from './Button'
import Switch from './Switch'
import Tooltip from './Tooltip'
import {
  ExclamationCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/solid'
import Select from './Select'
import { withdraw } from '../utils/mango'
import {
  ZERO_I80F48,
  I80F48,
  MangoAccount,
  nativeI80F48ToUi,
  MarketMode,
} from '@blockworks-foundation/mango-client'
import { notify } from '../utils/notifications'
import { useTranslation } from 'next-i18next'
import { useWallet } from '@solana/wallet-adapter-react'
import MangoAccountSelect from './MangoAccountSelect'
import InlineNotification from './InlineNotification'

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
  const { t } = useTranslation('common')
  const [withdrawTokenSymbol, setWithdrawTokenSymbol] = useState(
    tokenSymbol || 'USDC'
  )
  const [inputAmount, setInputAmount] = useState('')
  const [invalidAmountMessage, setInvalidAmountMessage] = useState('')
  const [maxAmount, setMaxAmount] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [includeBorrow, setIncludeBorrow] = useState(borrow)
  const [simulation, setSimulation] = useState<any | null>(null)
  const [showSimulation, setShowSimulation] = useState(false)
  const { wallet } = useWallet()
  const actions = useMangoStore((s) => s.actions)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const mangoAccounts = useMangoStore((s) => s.mangoAccounts)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const mangoGroupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const [withdrawMangoAccount, setWithdrawMangoAccount] =
    useState<MangoAccount | null>(mangoAccount)

  const tokens = useMemo(() => mangoGroupConfig.tokens, [mangoGroupConfig])
  const token = useMemo(
    () => tokens.find((t) => t.symbol === withdrawTokenSymbol),
    [withdrawTokenSymbol, tokens]
  )
  const tokenIndex =
    mangoGroup && token ? mangoGroup.getTokenIndex(token.mintKey) : 0
  const marketMode =
    mangoGroup && token
      ? mangoGroup.tokens[tokenIndex].spotMarketMode
      : MarketMode.Default
  const isCloseOnly =
    marketMode == MarketMode.CloseOnly ||
    marketMode == MarketMode.ForceCloseOnly

  const initHealthRatio = useMemo(() => {
    if (mangoAccount && mangoGroup && mangoCache) {
      return mangoAccount
        .getHealthRatio(mangoGroup, mangoCache, 'Init')
        .toNumber()
    }
    return -1
  }, [mangoAccount])

  useEffect(() => {
    if (
      !mangoGroup ||
      !withdrawMangoAccount ||
      !withdrawTokenSymbol ||
      !mangoCache
    )
      return

    const mintDecimals = mangoGroup.tokens[tokenIndex].decimals
    const tokenDeposits = withdrawMangoAccount.getUiDeposit(
      mangoCache.rootBankCache[tokenIndex],
      mangoGroup,
      tokenIndex
    )
    const tokenBorrows = withdrawMangoAccount.getUiBorrow(
      mangoCache.rootBankCache[tokenIndex],
      mangoGroup,
      tokenIndex
    )

    const maxWithoutBorrows = nativeI80F48ToUi(
      withdrawMangoAccount
        .getAvailableBalance(mangoGroup, mangoCache, tokenIndex)
        .floor(),
      mangoGroup.tokens[tokenIndex].decimals
    )
    const maxWithBorrows = withdrawMangoAccount
      .getMaxWithBorrowForToken(mangoGroup, mangoCache, tokenIndex)
      .add(maxWithoutBorrows)
      .mul(I80F48.fromString('0.995')) // handle rounding errors when borrowing

    if (isCloseOnly) {
      setIncludeBorrow(false)
    }
    // get max withdraw amount
    let maxWithdraw = maxWithoutBorrows
    if (includeBorrow) {
      maxWithdraw = maxWithoutBorrows.gt(maxWithBorrows)
        ? maxWithoutBorrows
        : maxWithBorrows
    }

    if (maxWithdraw.gt(I80F48.fromNumber(0)) && token) {
      setMaxAmount(
        floorToDecimal(parseFloat(maxWithdraw.toFixed()), token.decimals) -
          1 / Math.pow(10, token.decimals)
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
    // FIXME: MangoAccount needs type updated to accept null for pubKey
    // @ts-ignore
    const simulation = new MangoAccount(null, withdrawMangoAccount)
    simulation.deposits = [...withdrawMangoAccount.deposits]
    simulation.borrows = [...withdrawMangoAccount.borrows]

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
    const equity = simulation.computeValue(mangoGroup, mangoCache).toNumber()
    const initHealthRatio = simulation
      .getHealthRatio(mangoGroup, mangoCache, 'Init')
      .toNumber()

    const maintHealthRatio = simulation
      .getHealthRatio(mangoGroup, mangoCache, 'Maint')
      .toNumber()

    const leverage = simulation.getLeverage(mangoGroup, mangoCache).toNumber()

    setSimulation({
      equity,
      initHealthRatio,
      leverage,
      liabsVal,
      maintHealthRatio,
    })
  }, [
    includeBorrow,
    inputAmount,
    tokenIndex,
    withdrawMangoAccount,
    mangoGroup,
    mangoCache,
  ])

  const handleWithdraw = () => {
    if (!mangoGroup || !wallet) {
      return
    }
    setSubmitting(true)

    withdraw({
      amount: Number(inputAmount),
      token: mangoGroup.tokens[tokenIndex].mint,
      allowBorrow: includeBorrow,
      wallet,
      mangoAccount: withdrawMangoAccount,
    })
      .then((txid: string) => {
        setSubmitting(false)
        actions.fetchAllMangoAccounts(wallet)
        actions.fetchWalletTokens(wallet)
        notify({
          title: t('withdraw-success'),
          type: 'success',
          txid,
        })
        onClose()
      })
      .catch((err) => {
        setSubmitting(false)
        console.error('Error withdrawing:', err)
        notify({
          title: t('withdraw-error'),
          description: err.message,
          txid: err.txid,
          type: 'error',
        })
        onClose()
      })
  }

  const handleSetSelectedAsset = (symbol) => {
    setInputAmount('')
    setWithdrawTokenSymbol(symbol)
  }

  const getDepositsForSelectedAsset = (): I80F48 => {
    return withdrawMangoAccount && mangoCache && mangoGroup
      ? withdrawMangoAccount.getUiDeposit(
          mangoCache.rootBankCache[tokenIndex],
          mangoGroup,
          tokenIndex
        )
      : ZERO_I80F48
  }

  const getBorrowAmount = () => {
    const tokenBalance = getDepositsForSelectedAsset()
    const borrowAmount = I80F48.fromString(inputAmount).sub(tokenBalance)
    return borrowAmount.gt(ZERO_I80F48) ? borrowAmount : 0
  }

  const getAccountStatusColor = (
    health: number,
    isRisk?: boolean,
    isStatus?: boolean
  ) => {
    if (health < 15) {
      return isRisk ? (
        <div className="text-th-red">{t('high')}</div>
      ) : isStatus ? (
        'bg-th-red'
      ) : (
        'ring-th-red text-th-red'
      )
    } else if (health >= 15 && health < 50) {
      return isRisk ? (
        <div className="text-th-orange">{t('moderate')}</div>
      ) : isStatus ? (
        'bg-th-orange'
      ) : (
        'ring-th-orange text-th-orange'
      )
    } else {
      return isRisk ? (
        <div className="text-th-green">{t('low')}</div>
      ) : isStatus ? (
        'bg-th-green'
      ) : (
        'ring-th-green text-th-green'
      )
    }
  }

  const handleIncludeBorrowSwitch = (checked) => {
    setIncludeBorrow(checked)
    setInputAmount('')
    setInvalidAmountMessage('')
  }

  const onChangeAmountInput = (amount: string) => {
    setInputAmount(amount)
    setInvalidAmountMessage('')
  }

  const validateAmountInput = (amount) => {
    const parsedAmount = Number(amount)
    if (
      (getDepositsForSelectedAsset() === ZERO_I80F48 ||
        getDepositsForSelectedAsset().lt(I80F48.fromNumber(parsedAmount))) &&
      !includeBorrow
    ) {
      setInvalidAmountMessage(t('insufficient-balance-withdraw'))
    }
  }

  useEffect(() => {
    if (simulation && simulation.initHealthRatio < 0 && includeBorrow) {
      setInvalidAmountMessage(t('leverage-too-high'))
    }
  }, [simulation])

  const getTokenBalances = () => {
    const mangoCache = useMangoStore.getState().selectedMangoGroup.cache
    const mangoGroup = useMangoStore.getState().selectedMangoGroup.current

    if (mangoGroup && mangoCache) {
      return tokens.map((token) => {
        const tokenIndex = mangoGroup.getTokenIndex(token.mintKey)
        return {
          symbol: token.symbol,
          balance: withdrawMangoAccount
            ?.getUiDeposit(
              mangoCache.rootBankCache[tokenIndex],
              mangoGroup,
              tokenIndex
            )
            ?.toFixed(tokenPrecision[token.symbol]),
        }
      })
    }
  }

  if (!withdrawTokenSymbol) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <>
        {!showSimulation && mangoCache && mangoGroup ? (
          <>
            <Modal.Header>
              <ElementTitle noMarginBottom>
                {title ? title : t('withdraw-funds')}
              </ElementTitle>
            </Modal.Header>
            {initHealthRatio < 0 ? (
              <div className="pb-2">
                <InlineNotification type="error" desc={t('no-new-positions')} />
              </div>
            ) : null}
            {mangoAccounts.length > 1 ? (
              <div className="mb-4">
                <Label>{t('from-account')}</Label>
                <MangoAccountSelect
                  onChange={(v) => setWithdrawMangoAccount(v)}
                  value={withdrawMangoAccount}
                />
              </div>
            ) : null}
            <Label>{t('asset')}</Label>
            <Select
              value={
                withdrawTokenSymbol && withdrawMangoAccount ? (
                  <div className="flex w-full items-center justify-between">
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
                    {withdrawMangoAccount
                      ?.getUiDeposit(
                        mangoCache.rootBankCache[tokenIndex],
                        mangoGroup,
                        tokenIndex
                      )
                      ?.toFixed(tokenPrecision[withdrawTokenSymbol])}
                  </div>
                ) : (
                  <span className="text-th-fgd-4">{t('select-asset')}</span>
                )
              }
              onChange={(asset) => handleSetSelectedAsset(asset)}
            >
              {getTokenBalances()?.map(({ symbol, balance }) => (
                <Select.Option key={symbol} value={symbol}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <img
                        alt=""
                        width="16"
                        height="16"
                        src={`/assets/icons/${symbol.toLowerCase()}.svg`}
                        className={`mr-2`}
                      />
                      <span>{symbol}</span>
                    </div>
                    {balance}
                  </div>
                </Select.Option>
              ))}
            </Select>
            {!isCloseOnly ? (
              <div className="jusitfy-between mt-4 flex items-center rounded-md bg-th-bkg-3 p-2 text-th-fgd-1">
                <div className="text-fgd-1 flex items-center pr-4">
                  <span>{t('borrow-funds')}</span>
                  <Tooltip content={t('tooltip-interest-charged')}>
                    <InformationCircleIcon
                      className={`ml-2 h-5 w-5 cursor-help text-th-fgd-4`}
                    />
                  </Tooltip>
                </div>
                <Switch
                  checked={includeBorrow}
                  className="ml-auto"
                  onChange={(checked) => handleIncludeBorrowSwitch(checked)}
                />
              </div>
            ) : null}
            <div className="flex justify-between pt-4">
              <Label>{t('amount')}</Label>
              <LinkButton
                className="mb-1.5"
                onClick={() => setInputAmount(maxAmount.toString())}
              >
                {includeBorrow && !isCloseOnly
                  ? t('max-with-borrow')
                  : t('max')}
              </LinkButton>
            </div>
            <div className="flex">
              <Input
                disabled={!withdrawTokenSymbol}
                type="number"
                min="0"
                error={!!invalidAmountMessage}
                placeholder="0.00"
                value={inputAmount}
                onBlur={(e) => validateAmountInput(e.target.value)}
                onChange={(e) => onChangeAmountInput(e.target.value)}
                suffix={withdrawTokenSymbol}
              />
            </div>
            {simulation ? (
              <div className="mt-4 space-y-2 bg-th-bkg-2 p-4">
                <div className="flex justify-between">
                  <p className="mb-0">{t('tooltip-projected-health')}</p>
                  <p
                    className={`mb-0 font-bold text-th-fgd-1 ${getAccountStatusColor(
                      simulation.maintHealthRatio
                    )}`}
                  >
                    {simulation.maintHealthRatio > 100
                      ? '>100'
                      : simulation.maintHealthRatio.toFixed(2)}
                    %
                  </p>
                </div>
                <div className="flex justify-between">
                  <p className="mb-0">{t('tooltip-projected-leverage')}</p>
                  <p
                    className={`mb-0 font-bold text-th-fgd-1 ${getAccountStatusColor(
                      simulation.maintHealthRatio
                    )}`}
                  >
                    {simulation.leverage.toFixed(2)}x
                  </p>
                </div>
              </div>
            ) : null}
            {invalidAmountMessage ? (
              <div className="flex items-center pt-1.5 text-th-red">
                <ExclamationCircleIcon className="mr-1.5 h-4 w-4" />
                {invalidAmountMessage}
              </div>
            ) : null}
            <div className={`flex justify-center pt-6`}>
              <Button
                onClick={() => setShowSimulation(true)}
                disabled={
                  !inputAmount ||
                  Number(inputAmount) <= 0 ||
                  !!invalidAmountMessage ||
                  initHealthRatio < 0
                }
                className="w-full"
              >
                {t('next')}
              </Button>
            </div>
          </>
        ) : null}
        {showSimulation && simulation ? (
          <>
            <Modal.Header>
              <ElementTitle noMarginBottom>
                {t('confirm-withdraw')}
              </ElementTitle>
            </Modal.Header>
            {simulation.initHealthRatio < 0 ? (
              <div className="pb-2">
                <InlineNotification type="error" desc={t('prices-changed')} />
              </div>
            ) : null}
            <div className="rounded-lg bg-th-bkg-1 p-4 text-center text-th-fgd-1">
              <div className="pb-1 text-th-fgd-3">{t('about-to-withdraw')}</div>
              <div className="flex items-center justify-center">
                <div className="relative text-xl font-semibold">
                  {Number(inputAmount).toLocaleString(undefined, {
                    maximumFractionDigits: token?.decimals,
                  })}
                  <span className="absolute bottom-0.5 ml-1.5 text-xs font-normal text-th-fgd-4">
                    {withdrawTokenSymbol}
                  </span>
                </div>
              </div>
              {getBorrowAmount() > 0 ? (
                <div className="pt-2 text-th-fgd-4">{`${t(
                  'includes-borrow'
                )} ~${getBorrowAmount().toFixed(
                  mangoGroup?.tokens[tokenIndex].decimals
                )} ${withdrawTokenSymbol}`}</div>
              ) : null}
            </div>
            <div className={`mt-6 flex flex-col items-center`}>
              <Button
                onClick={handleWithdraw}
                disabled={
                  Number(inputAmount) <= 0 ||
                  simulation.initHealthRatio < 0 ||
                  submitting
                }
                className="w-full"
              >
                <div className={`flex items-center justify-center`}>
                  {submitting && <Loading className="-ml-1 mr-3" />}
                  {t('withdraw')}
                </div>
              </Button>
              <LinkButton
                className="mt-4"
                onClick={() => setShowSimulation(false)}
              >
                {t('cancel')}
              </LinkButton>
            </div>
          </>
        ) : null}
      </>
    </Modal>
  )
}

export default React.memo(WithdrawModal)
