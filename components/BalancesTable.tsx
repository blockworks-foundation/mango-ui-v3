import { useCallback, useState } from 'react'
import { useBalances } from '../hooks/useBalances'
import useMangoStore from '../stores/useMangoStore'
import Button, { LinkButton } from '../components/Button'
import { notify } from '../utils/notifications'
import { ArrowSmDownIcon, ExclamationIcon } from '@heroicons/react/outline'
import { Market } from '@project-serum/serum'
import { getTokenBySymbol } from '@blockworks-foundation/mango-client'
import Loading from './Loading'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from './TradePageGrid'
import { floorToDecimal, formatUsdValue, getPrecisionDigits } from '../utils'
import { ExpandableRow, Table, Td, Th, TrBody, TrHead } from './TableElements'
import { useSortableData } from '../hooks/useSortableData'
import DepositModal from './DepositModal'
import WithdrawModal from './WithdrawModal'
import MobileTableHeader from './mobile/MobileTableHeader'
import { useTranslation } from 'next-i18next'
import { TransactionSignature } from '@solana/web3.js'
import Link from 'next/link'
import { useRouter } from 'next/router'

const BalancesTable = ({
  showZeroBalances = false,
  showDepositWithdraw = false,
  clickToPopulateTradeForm = false,
}) => {
  const { t } = useTranslation('common')
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [actionSymbol, setActionSymbol] = useState('')
  const balances = useBalances()
  const { items, requestSort, sortConfig } = useSortableData(
    balances
      .filter(
        (bal) =>
          showZeroBalances ||
          +bal.deposits > 0 ||
          +bal.borrows > 0 ||
          bal.orders > 0 ||
          bal.unsettled > 0
      )
      .sort((a, b) => Math.abs(+b.value) - Math.abs(+a.value))
  )
  const actions = useMangoStore((s) => s.actions)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoGroupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const selectedMarket = useMangoStore((s) => s.selectedMarket.current)
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const setMangoStore = useMangoStore((s) => s.set)
  const price = useMangoStore((s) => s.tradeForm.price)
  const mangoGroupCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const { width } = useViewport()
  const [submitting, setSubmitting] = useState(false)
  const isMobile = width ? width < breakpoints.md : false
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const wallet = useMangoStore((s) => s.wallet.current)
  const canWithdraw = wallet?.publicKey
    ? mangoAccount?.owner.equals(wallet.publicKey)
    : true
  const { asPath } = useRouter()

  const handleSizeClick = (size, symbol) => {
    const minOrderSize = selectedMarket.minOrderSize
    const sizePrecisionDigits = getPrecisionDigits(minOrderSize)
    const marketIndex = marketConfig.marketIndex

    const priceOrDefault = price
      ? price
      : mangoGroup.getPriceUi(marketIndex, mangoGroupCache)

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

      const txids: TransactionSignature[] = await mangoClient.settleAll(
        mangoGroup,
        mangoAccount,
        spotMarkets,
        wallet
      )

      for (const txid of txids) {
        notify({ title: t('settle-success'), txid })
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

  const unsettledBalances = balances.filter((bal) => bal.unsettled > 0)

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
          <div className="grid grid-flow-row grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {unsettledBalances.map((bal) => {
              const tokenConfig = getTokenBySymbol(mangoGroupConfig, bal.symbol)
              return (
                <div
                  className="col-span-1 flex items-center justify-between rounded-full bg-th-bkg-3 px-5 py-3"
                  key={bal.symbol}
                >
                  <div className="flex space-x-2">
                    <div className="flex items-center">
                      <img
                        alt=""
                        width="24"
                        height="24"
                        src={`/assets/icons/${bal.symbol.toLowerCase()}.svg`}
                        className={`mr-3`}
                      />
                      <div>
                        <p className="mb-0 text-xs text-th-fgd-1">
                          {bal.symbol}
                        </p>
                        <div className="font-bold text-th-green">
                          {floorToDecimal(bal.unsettled, tokenConfig.decimals)}
                        </div>
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
          {items.length > 0 ? (
            !isMobile ? (
              <Table>
                <thead>
                  <TrHead>
                    <Th>
                      <LinkButton
                        className="flex items-center text-left no-underline"
                        onClick={() => requestSort('symbol')}
                      >
                        <span className="font-normal">{t('asset')}</span>
                        <ArrowSmDownIcon
                          className={`default-transition ml-1 h-4 w-4 flex-shrink-0 ${
                            sortConfig?.key === 'symbol'
                              ? sortConfig.direction === 'ascending'
                                ? 'rotate-180 transform'
                                : 'rotate-360 transform'
                              : null
                          }`}
                        />
                      </LinkButton>
                    </Th>
                    <Th>
                      <LinkButton
                        className="flex items-center text-left no-underline"
                        onClick={() => requestSort('deposits')}
                      >
                        <span className="font-normal">{t('deposits')}</span>
                        <ArrowSmDownIcon
                          className={`default-transition ml-1 h-4 w-4 flex-shrink-0 ${
                            sortConfig?.key === 'deposits'
                              ? sortConfig.direction === 'ascending'
                                ? 'rotate-180 transform'
                                : 'rotate-360 transform'
                              : null
                          }`}
                        />
                      </LinkButton>
                    </Th>
                    <Th>
                      <LinkButton
                        className="flex items-center text-left no-underline"
                        onClick={() => requestSort('borrows')}
                      >
                        <span className="font-normal">{t('borrows')}</span>
                        <ArrowSmDownIcon
                          className={`default-transition ml-1 h-4 w-4 flex-shrink-0 ${
                            sortConfig?.key === 'borrows'
                              ? sortConfig.direction === 'ascending'
                                ? 'rotate-180 transform'
                                : 'rotate-360 transform'
                              : null
                          }`}
                        />
                      </LinkButton>
                    </Th>
                    <Th>
                      <LinkButton
                        className="flex items-center text-left no-underline"
                        onClick={() => requestSort('orders')}
                      >
                        <span className="font-normal">{t('in-orders')}</span>
                        <ArrowSmDownIcon
                          className={`default-transition ml-1 h-4 w-4 flex-shrink-0 ${
                            sortConfig?.key === 'orders'
                              ? sortConfig.direction === 'ascending'
                                ? 'rotate-180 transform'
                                : 'rotate-360 transform'
                              : null
                          }`}
                        />
                      </LinkButton>
                    </Th>
                    <Th>
                      <LinkButton
                        className="flex items-center text-left no-underline"
                        onClick={() => requestSort('unsettled')}
                      >
                        <span className="font-normal">{t('unsettled')}</span>
                        <ArrowSmDownIcon
                          className={`default-transition ml-1 h-4 w-4 flex-shrink-0 ${
                            sortConfig?.key === 'unsettled'
                              ? sortConfig.direction === 'ascending'
                                ? 'rotate-180 transform'
                                : 'rotate-360 transform'
                              : null
                          }`}
                        />
                      </LinkButton>
                    </Th>
                    <Th>
                      <LinkButton
                        className="flex items-center text-left no-underline"
                        onClick={() => requestSort('net')}
                      >
                        <span className="font-normal">{t('net-balance')}</span>
                        <ArrowSmDownIcon
                          className={`default-transition ml-1 h-4 w-4 flex-shrink-0 ${
                            sortConfig?.key === 'net'
                              ? sortConfig.direction === 'ascending'
                                ? 'rotate-180 transform'
                                : 'rotate-360 transform'
                              : null
                          }`}
                        />
                      </LinkButton>
                    </Th>
                    <Th>
                      <LinkButton
                        className="flex items-center text-left no-underline"
                        onClick={() => requestSort('value')}
                      >
                        <span className="font-normal">{t('value')}</span>
                        <ArrowSmDownIcon
                          className={`default-transition ml-1 h-4 w-4 flex-shrink-0 ${
                            sortConfig?.key === 'value'
                              ? sortConfig.direction === 'ascending'
                                ? 'rotate-180 transform'
                                : 'rotate-360 transform'
                              : null
                          }`}
                        />
                      </LinkButton>
                    </Th>
                    <Th>
                      <LinkButton
                        className="flex items-center text-left no-underline"
                        onClick={() => requestSort('depositRate')}
                      >
                        <span className="font-normal">{t('deposit-rate')}</span>
                        <ArrowSmDownIcon
                          className={`default-transition ml-1 h-4 w-4 flex-shrink-0 ${
                            sortConfig?.key === 'depositRate'
                              ? sortConfig.direction === 'ascending'
                                ? 'rotate-180 transform'
                                : 'rotate-360 transform'
                              : null
                          }`}
                        />
                      </LinkButton>
                    </Th>
                    <Th>
                      <LinkButton
                        className="flex items-center text-left no-underline"
                        onClick={() => requestSort('borrowRate')}
                      >
                        <span className="font-normal">{t('borrow-rate')}</span>
                        <ArrowSmDownIcon
                          className={`default-transition ml-1 h-4 w-4 flex-shrink-0 ${
                            sortConfig?.key === 'borrowRate'
                              ? sortConfig.direction === 'ascending'
                                ? 'rotate-180 transform'
                                : 'rotate-360 transform'
                              : null
                          }`}
                        />
                      </LinkButton>
                    </Th>
                  </TrHead>
                </thead>
                <tbody>
                  {items.map((balance, index) => {
                    if (!balance) {
                      return null
                    }
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
                        <Td>{balance.orders}</Td>
                        <Td>{balance.unsettled}</Td>
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
                        <Td>
                          <span className="text-th-green">
                            {balance.depositRate.toFixed(2)}%
                          </span>
                        </Td>
                        <Td>
                          <span className="text-th-red">
                            {balance.borrowRate.toFixed(2)}%
                          </span>
                        </Td>
                        {showDepositWithdraw ? (
                          <Td>
                            <div className="flex justify-end">
                              <Button
                                className="h-7 pt-0 pb-0 pl-3 pr-3 text-xs"
                                onClick={() =>
                                  handleOpenDepositModal(balance.symbol)
                                }
                              >
                                {balance.borrows.toNumber() > 0
                                  ? t('repay')
                                  : t('deposit')}
                              </Button>
                              <Button
                                className="ml-4 h-7 pt-0 pb-0 pl-3 pr-3 text-xs"
                                onClick={() =>
                                  handleOpenWithdrawModal(balance.symbol)
                                }
                                disabled={!canWithdraw}
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
              <div className="border-b border-th-bkg-4">
                <MobileTableHeader
                  colOneHeader={t('asset')}
                  colTwoHeader={t('net-balance')}
                />
                {items.map((balance, index) => (
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
                          <div className="text-left text-th-fgd-4">
                            <div className="pb-0.5 text-xs text-th-fgd-3">
                              {t('rates')}
                            </div>
                            <span className="mr-1 text-th-green">
                              {balance.depositRate.toFixed(2)}%
                            </span>
                            /
                            <span className="ml-1 text-th-red">
                              {balance.borrowRate.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-4">
                          <Button
                            className="h-7 w-1/2 pt-0 pb-0 pl-3 pr-3 text-xs"
                            onClick={() =>
                              handleOpenDepositModal(balance.symbol)
                            }
                          >
                            {balance.borrows.toNumber() > 0
                              ? t('repay')
                              : t('deposit')}
                          </Button>
                          <Button
                            className="h-7 w-1/2 pt-0 pb-0 pl-3 pr-3 text-xs"
                            onClick={() =>
                              handleOpenWithdrawModal(balance.symbol)
                            }
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
                ))}
              </div>
            )
          ) : (
            <div
              className={`w-full rounded-md bg-th-bkg-1 py-6 text-center text-th-fgd-3`}
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
