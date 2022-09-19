import { useCallback, useMemo, useState } from 'react'
import useMangoStore from '../stores/useMangoStore'
import Button from '../components/Button'
import { notify } from '../utils/notifications'
import {
  ExclamationIcon,
  // InformationCircleIcon
} from '@heroicons/react/solid'
import { Market } from '@project-serum/serum'
import {
  // getMarketIndexBySymbol,
  getTokenBySymbol,
  // ZERO_I80F48,
} from '@blockworks-foundation/mango-client'
import Loading from './Loading'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from './TradePageGrid'
import {
  floorToDecimal,
  formatUsdValue,
  getPrecisionDigits,
  // usdFormatter,
} from '../utils'
import { ExpandableRow, Table, Td, Th, TrBody, TrHead } from './TableElements'
import DepositModal from './DepositModal'
import WithdrawModal from './WithdrawModal'
import MobileTableHeader from './mobile/MobileTableHeader'
import { useTranslation } from 'next-i18next'
import { TransactionSignature } from '@solana/web3.js'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useWallet } from '@solana/wallet-adapter-react'
// import Tooltip from './Tooltip'

const BalancesTable = ({
  showZeroBalances = false,
  showDepositWithdraw = false,
  clickToPopulateTradeForm = false,
}) => {
  const { t } = useTranslation('common')
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [actionSymbol, setActionSymbol] = useState('')
  const spotBalances = useMangoStore((s) => s.selectedMangoAccount.spotBalances)

  const balances = useMemo(() => {
    return spotBalances?.length > 0
      ? spotBalances
          .filter((bal) => {
            return (
              showZeroBalances ||
              (bal.deposits && +bal.deposits > 0) ||
              (bal.borrows && +bal.borrows > 0) ||
              (bal.orders && bal.orders > 0) ||
              (bal.unsettled && bal.unsettled > 0)
            )
          })
          .sort((a, b) => {
            const aV = a.value ? Math.abs(+a.value) : 0
            const bV = b.value ? Math.abs(+b.value) : 0
            return bV - aV
          })
      : []
  }, [spotBalances])

  const actions = useMangoStore((s) => s.actions)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoGroupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  // const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const selectedMarket = useMangoStore((s) => s.selectedMarket.current)
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const setMangoStore = useMangoStore((s) => s.set)
  const price = useMangoStore((s) => s.tradeForm.price)
  const mangoGroupCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const { width } = useViewport()
  const [submitting, setSubmitting] = useState(false)
  const isMobile = width ? width < breakpoints.md : false
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const { wallet, publicKey } = useWallet()
  const canWithdraw = publicKey ? mangoAccount?.owner.equals(publicKey) : true
  const { asPath } = useRouter()

  const handleSizeClick = (size, symbol) => {
    const minOrderSize = selectedMarket?.minOrderSize
    const sizePrecisionDigits = minOrderSize
      ? getPrecisionDigits(minOrderSize)
      : null
    const marketIndex = marketConfig.marketIndex

    const priceOrDefault = price
      ? price
      : mangoGroup && mangoGroupCache
      ? mangoGroup.getPriceUi(marketIndex, mangoGroupCache)
      : null

    if (!priceOrDefault || !sizePrecisionDigits || !minOrderSize) {
      return
    }

    let roundedSize, side
    if (symbol === 'USDC') {
      roundedSize = parseFloat(
        (
          Math.abs(size) / priceOrDefault +
          (size < 0 ? minOrderSize / 2 : -minOrderSize / 2)
        ) // round up so neg USDC gets cleared
          .toFixed(sizePrecisionDigits)
      )
      side = size > 0 ? 'buy' : 'sell'
    } else {
      roundedSize = parseFloat(
        (
          Math.abs(size) + (size < 0 ? minOrderSize / 2 : -minOrderSize / 2)
        ).toFixed(sizePrecisionDigits)
      )
      side = size > 0 ? 'sell' : 'buy'
    }
    const quoteSize = parseFloat((roundedSize * priceOrDefault).toFixed(2))
    setMangoStore((state) => {
      state.tradeForm.baseSize = roundedSize
      state.tradeForm.quoteSize = quoteSize
      state.tradeForm.side = side
    })
  }
  const handleOpenDepositModal = useCallback((symbol) => {
    setActionSymbol(symbol)
    setShowDepositModal(true)
  }, [])

  const handleOpenWithdrawModal = useCallback((symbol) => {
    setActionSymbol(symbol)
    setShowWithdrawModal(true)
  }, [])

  async function handleSettleAll() {
    const markets = useMangoStore.getState().selectedMangoGroup.markets
    const mangoClient = useMangoStore.getState().connection.client

    try {
      setSubmitting(true)
      const spotMarkets = Object.values(markets).filter(
        (mkt) => mkt instanceof Market
      ) as Market[]

      if (!mangoGroup || !mangoAccount || !wallet) {
        return
      }

      const txids: TransactionSignature[] | undefined =
        await mangoClient.settleAll(
          mangoGroup,
          mangoAccount,
          spotMarkets,
          wallet?.adapter
        )
      if (txids) {
        for (const txid of txids) {
          notify({ title: t('settle-success'), txid })
        }
      } else {
        notify({
          title: t('settle-error'),
          type: 'error',
        })
      }
    } catch (e) {
      console.warn('Error settling all:', e)
      if (e.message === 'No unsettled funds') {
        notify({
          title: t('no-unsettled'),
          type: 'error',
        })
      } else {
        notify({
          title: t('settle-error'),
          description: e.message,
          txid: e.txid,
          type: 'error',
        })
      }
    } finally {
      actions.reloadOrders()
      // actions.reloadMangoAccount()
      setSubmitting(false)
    }
  }

  const unsettledBalances = spotBalances.filter(
    (bal) => bal.unsettled && bal.unsettled > 0
  )

  const trimDecimals = useCallback((num: string) => {
    if (parseFloat(num) === 0) {
      return '0'
    }
    // Trim the decimals depending on the length of the whole number
    const splitNum = num.split('.')
    if (splitNum.length > 1) {
      const wholeNum = splitNum[0]
      const decimals = splitNum[1]
      if (wholeNum.length > 8) {
        return `${wholeNum}.${decimals.substring(0, 2)}`
      } else if (wholeNum.length > 3) {
        return `${wholeNum}.${decimals.substring(0, 3)}`
      }
    }
    return num
  }, [])

  return (
    <div className={`flex flex-col pb-2 sm:pb-4`}>
      {unsettledBalances.length > 0 ? (
        <div className="mb-6 rounded-lg border border-th-bkg-4 p-4 sm:p-6">
          <div className="flex items-center justify-between pb-4">
            <div className="flex items-center">
              <ExclamationIcon className="mr-1.5 mt-0.5 h-5 w-5 flex-shrink-0 text-th-primary" />
              <h3>{t('unsettled-balances')}</h3>
            </div>
            <Button
              className="h-8 whitespace-nowrap pt-0 pb-0 pl-3 pr-3 text-xs"
              onClick={handleSettleAll}
            >
              {submitting ? <Loading /> : t('settle-all')}
            </Button>
          </div>
          <div className="grid grid-flow-row grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {unsettledBalances.map((bal) => {
              const tokenConfig = getTokenBySymbol(mangoGroupConfig, bal.symbol)
              return (
                <div
                  className="col-span-1 flex items-center justify-between rounded-full bg-th-bkg-2 px-5 py-3"
                  key={bal.symbol}
                >
                  <div className="flex space-x-2">
                    <div className="flex items-center">
                      <img
                        alt=""
                        width="20"
                        height="20"
                        src={`/assets/icons/${bal.symbol.toLowerCase()}.svg`}
                        className={`mr-3`}
                      />
                      <div>
                        <p className="mb-0 text-xs text-th-fgd-1">
                          {bal.symbol}
                        </p>
                        {bal.unsettled ? (
                          <div className="font-bold text-th-green">
                            {floorToDecimal(
                              bal.unsettled,
                              tokenConfig.decimals
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
      <div className={`md:overflow-x-auto`}>
        <div className={`inline-block min-w-full align-middle`}>
          {balances.length > 0 ? (
            !isMobile ? (
              <Table>
                <thead>
                  <TrHead>
                    <Th>{''}</Th>
                    <Th>{t('deposits')}</Th>
                    <Th>{t('borrows')}</Th>
                    <Th>{t('in-orders')}</Th>
                    <Th>{t('unsettled')}</Th>
                    <Th>{t('net-balance')}</Th>
                    <Th>{t('value')}</Th>
                    {/* <Th>
                      <Tooltip content={t('tooltip-estimated-liq-price')}>
                        <span className="flex items-center">
                          {t('estimated-liq-price')}
                          <InformationCircleIcon className="ml-1 h-4 w-4 flex-shrink-0 text-th-fgd-4" />
                        </span>
                      </Tooltip>
                    </Th> */}
                    <Th>
                      {t('deposit')}
                      <span className="mx-1 text-th-fgd-4">|</span>
                      {t('borrow')} (APR)
                    </Th>
                  </TrHead>
                </thead>
                <tbody>
                  {balances.map((balance, index) => {
                    if (
                      !balance ||
                      typeof balance.decimals !== 'number' ||
                      !balance.deposits ||
                      !balance.borrows ||
                      !balance.net ||
                      !balance.value ||
                      !balance.borrowRate ||
                      !balance.depositRate
                    ) {
                      return null
                    }

                    // const marketIndex = getMarketIndexBySymbol(
                    //   mangoGroupConfig,
                    //   balance.symbol
                    // )

                    // const liquidationPrice =
                    //   mangoGroup &&
                    //   mangoAccount &&
                    //   marketIndex &&
                    //   mangoGroup &&
                    //   mangoCache
                    //     ? mangoAccount.getLiquidationPrice(
                    //         mangoGroup,
                    //         mangoCache,
                    //         marketIndex
                    //       )
                    //     : undefined

                    return (
                      <TrBody key={`${balance.symbol}${index}`}>
                        <Td>
                          <div className="flex items-center">
                            <img
                              alt=""
                              width="20"
                              height="20"
                              src={`/assets/icons/${balance.symbol.toLowerCase()}.svg`}
                              className={`mr-2.5`}
                            />

                            {balance.symbol === 'USDC' ||
                            decodeURIComponent(asPath).includes(
                              `${balance.symbol}/USDC`
                            ) ? (
                              <span>{balance.symbol}</span>
                            ) : (
                              <Link
                                href={{
                                  pathname: '/',
                                  query: { name: `${balance.symbol}/USDC` },
                                }}
                                shallow={true}
                              >
                                <a className="text-th-fgd-1 underline hover:text-th-fgd-1 hover:no-underline">
                                  {balance.symbol}
                                </a>
                              </Link>
                            )}
                          </div>
                        </Td>
                        <Td>
                          {trimDecimals(
                            balance.deposits.toFormat(balance.decimals)
                          )}
                        </Td>
                        <Td>
                          {trimDecimals(
                            balance.borrows.toFormat(balance.decimals)
                          )}
                        </Td>
                        <Td>
                          {balance.orders?.toLocaleString(undefined, {
                            maximumFractionDigits: balance.decimals,
                          })}
                        </Td>
                        <Td>
                          {balance.unsettled?.toLocaleString(undefined, {
                            maximumFractionDigits: balance.decimals,
                          })}
                        </Td>
                        <Td>
                          {marketConfig.kind === 'spot' &&
                          marketConfig.name.includes(balance.symbol) &&
                          selectedMarket &&
                          clickToPopulateTradeForm ? (
                            <span
                              className={
                                balance.net.toNumber() != 0
                                  ? 'cursor-pointer underline hover:no-underline'
                                  : ''
                              }
                              onClick={() =>
                                handleSizeClick(balance.net, balance.symbol)
                              }
                            >
                              {trimDecimals(
                                balance.net.toFormat(balance.decimals)
                              )}
                            </span>
                          ) : (
                            trimDecimals(balance.net.toFormat(balance.decimals))
                          )}
                        </Td>
                        <Td>{formatUsdValue(balance.value.toNumber())}</Td>
                        {/* <Td>
                          {liquidationPrice && liquidationPrice.gt(ZERO_I80F48)
                            ? usdFormatter(liquidationPrice)
                            : '–'}
                        </Td> */}
                        <Td>
                          <span className="text-th-green">
                            {balance.depositRate.toFixed(2)}%
                          </span>
                          <span className="mx-1 text-th-fgd-4">|</span>
                          <span className="text-th-red">
                            {balance.borrowRate.toFixed(2)}%
                          </span>
                        </Td>
                        {showDepositWithdraw ? (
                          <Td>
                            <div className="flex justify-end space-x-2">
                              <Button
                                className="h-8 w-[86px] pt-0 pb-0 pl-3 pr-3 text-xs"
                                onClick={() =>
                                  handleOpenDepositModal(balance.symbol)
                                }
                              >
                                {balance.borrows.toNumber() > 0
                                  ? t('repay')
                                  : t('deposit')}
                              </Button>
                              <Button
                                className="h-8 w-[86px] pt-0 pb-0 pl-3 pr-3 text-xs"
                                onClick={() =>
                                  handleOpenWithdrawModal(balance.symbol)
                                }
                                disabled={!canWithdraw}
                                primary={false}
                              >
                                {t('withdraw')}
                              </Button>
                            </div>
                          </Td>
                        ) : null}
                      </TrBody>
                    )
                  })}
                </tbody>
                {showDepositModal && (
                  <DepositModal
                    isOpen={showDepositModal}
                    onClose={() => setShowDepositModal(false)}
                    tokenSymbol={actionSymbol}
                    // repayAmount={
                    //   balance.borrows.toNumber() > 0
                    //     ? balance.borrows.toFixed()
                    //     : ''
                    // }
                  />
                )}
                {showWithdrawModal && (
                  <WithdrawModal
                    isOpen={showWithdrawModal}
                    onClose={() => setShowWithdrawModal(false)}
                    tokenSymbol={actionSymbol}
                  />
                )}
              </Table>
            ) : (
              <div className="border-b border-th-bkg-3">
                <MobileTableHeader
                  colOneHeader={t('asset')}
                  colTwoHeader={t('net-balance')}
                />
                {balances.map((balance, index) => {
                  if (
                    !balance ||
                    typeof balance.decimals !== 'number' ||
                    typeof balance.orders !== 'number' ||
                    typeof balance.unsettled !== 'number' ||
                    !balance.deposits ||
                    !balance.borrows ||
                    !balance.net ||
                    !balance.value ||
                    !balance.borrowRate ||
                    !balance.depositRate
                  ) {
                    return null
                  }
                  // const marketIndex = getMarketIndexBySymbol(
                  //   mangoGroupConfig,
                  //   balance.symbol
                  // )

                  // const liquidationPrice =
                  //   mangoGroup &&
                  //   mangoAccount &&
                  //   marketIndex &&
                  //   mangoGroup &&
                  //   mangoCache
                  //     ? mangoAccount.getLiquidationPrice(
                  //         mangoGroup,
                  //         mangoCache,
                  //         marketIndex
                  //       )
                  //     : undefined
                  return (
                    <ExpandableRow
                      buttonTemplate={
                        <div className="flex w-full items-center justify-between text-th-fgd-1">
                          <div className="flex items-center text-th-fgd-1">
                            <img
                              alt=""
                              width="20"
                              height="20"
                              src={`/assets/icons/${balance.symbol.toLowerCase()}.svg`}
                              className={`mr-2.5`}
                            />

                            {balance.symbol}
                          </div>
                          <div className="text-right text-th-fgd-1">
                            {balance.net.toFormat(balance.decimals)}
                          </div>
                        </div>
                      }
                      key={`${balance.symbol}${index}`}
                      panelTemplate={
                        <>
                          <div className="grid grid-flow-row grid-cols-2 gap-4 pb-4">
                            <div className="text-left">
                              <div className="pb-0.5 text-xs text-th-fgd-3">
                                {t('deposits')}
                              </div>
                              {balance.deposits.toFormat(balance.decimals)}
                            </div>
                            <div className="text-left">
                              <div className="pb-0.5 text-xs text-th-fgd-3">
                                {t('borrows')}
                              </div>
                              {balance.borrows.toFormat(balance.decimals)}
                            </div>
                            <div className="text-left">
                              <div className="pb-0.5 text-xs text-th-fgd-3">
                                {t('in-orders')}
                              </div>
                              {balance.orders.toLocaleString(undefined, {
                                maximumFractionDigits: balance.decimals,
                              })}
                            </div>
                            <div className="text-left">
                              <div className="pb-0.5 text-xs text-th-fgd-3">
                                {t('unsettled')}
                              </div>
                              {balance.unsettled.toLocaleString(undefined, {
                                maximumFractionDigits: balance.decimals,
                              })}
                            </div>
                            <div className="text-left">
                              <div className="pb-0.5 text-xs text-th-fgd-3">
                                {t('value')}
                              </div>
                              {formatUsdValue(balance.value.toNumber())}
                            </div>
                            {/* <div className="text-left">
                              <div className="pb-0.5 text-xs text-th-fgd-3">
                                <Tooltip
                                  content={t('tooltip-estimated-liq-price')}
                                >
                                  <span className="flex items-center">
                                    {t('estimated-liq-price')}
                                    <InformationCircleIcon className="ml-1 h-4 w-4 flex-shrink-0 text-th-fgd-4" />
                                  </span>
                                </Tooltip>
                              </div>
                              {liquidationPrice &&
                              liquidationPrice.gt(ZERO_I80F48)
                                ? usdFormatter(liquidationPrice)
                                : '–'}
                            </div> */}
                            <div className="text-left text-th-fgd-4">
                              <div className="pb-0.5 text-xs text-th-fgd-3">
                                <span>{t('deposit')}</span>
                                <span className="mx-1 text-th-fgd-4">|</span>
                                <span>{`${t('borrow')} (APR)`}</span>
                              </div>
                              <span className="text-th-green">
                                {balance.depositRate.toFixed(2)}%
                              </span>
                              <span className="mx-1 text-th-fgd-4">|</span>
                              <span className="text-th-red">
                                {balance.borrowRate.toFixed(2)}%
                              </span>
                            </div>
                          </div>
                          <div className="flex space-x-4">
                            <Button
                              className="h-8 w-1/2 pt-0 pb-0 pl-3 pr-3 text-xs"
                              onClick={() =>
                                handleOpenDepositModal(balance.symbol)
                              }
                            >
                              {balance.borrows.toNumber() > 0
                                ? t('repay')
                                : t('deposit')}
                            </Button>
                            <Button
                              className="h-8 w-1/2 border border-th-fgd-4 bg-transparent pt-0 pb-0 pl-3 pr-3 text-xs"
                              onClick={() =>
                                handleOpenWithdrawModal(balance.symbol)
                              }
                              primary={false}
                            >
                              {t('withdraw')}
                            </Button>
                          </div>

                          {showDepositModal && (
                            <DepositModal
                              isOpen={showDepositModal}
                              onClose={() => setShowDepositModal(false)}
                              tokenSymbol={actionSymbol}
                              repayAmount={
                                balance.borrows.toNumber() > 0
                                  ? balance.borrows.toFormat(balance.decimals)
                                  : ''
                              }
                            />
                          )}
                          {showWithdrawModal && (
                            <WithdrawModal
                              isOpen={showWithdrawModal}
                              onClose={() => setShowWithdrawModal(false)}
                              tokenSymbol={actionSymbol}
                            />
                          )}
                        </>
                      }
                    />
                  )
                })}
              </div>
            )
          ) : (
            <div
              className={`w-full rounded-md border border-th-bkg-3 py-6 text-center text-th-fgd-3`}
            >
              {t('no-balances')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BalancesTable
