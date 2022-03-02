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
  const mangoClient = useMangoStore((s) => s.connection.client)
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

  return (
    <div className={`flex flex-col pb-2 sm:pb-4`}>
      {unsettledBalances.length > 0 ? (
        <div className="border border-th-bkg-4 mb-6 p-4 sm:p-6 rounded-lg">
          <div className="flex items-center justify-between pb-4">
            <div className="flex items-center">
              <ExclamationIcon className="flex-shrink-0 h-5 mr-1.5 mt-0.5 text-th-primary w-5" />
              <h3>{t('unsettled-balances')}</h3>
            </div>
            <Button
              className="text-xs pt-0 pb-0 h-8 pl-3 pr-3 whitespace-nowrap"
              onClick={handleSettleAll}
            >
              {submitting ? <Loading /> : t('settle-all')}
            </Button>
          </div>
          <div className="gap-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 grid-flow-row">
            {unsettledBalances.map((bal) => {
              const tokenConfig = getTokenBySymbol(mangoGroupConfig, bal.symbol)
              return (
                <div
                  className="bg-th-bkg-3 col-span-1 flex items-center justify-between px-5 py-3 rounded-full"
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
                        <p className="mb-0 text-th-fgd-1 text-xs">
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
        <div className={`align-middle inline-block min-w-full`}>
          {items.length > 0 ? (
            !isMobile ? (
              <Table>
                <thead>
                  <TrHead>
                    <Th>
                      <LinkButton
                        className="flex items-center no-underline font-normal text-left"
                        onClick={() => requestSort('symbol')}
                      >
                        {t('asset')}
                        <ArrowSmDownIcon
                          className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                            sortConfig?.key === 'symbol'
                              ? sortConfig.direction === 'ascending'
                                ? 'transform rotate-180'
                                : 'transform rotate-360'
                              : null
                          }`}
                        />
                      </LinkButton>
                    </Th>
                    <Th>
                      <LinkButton
                        className="flex items-center no-underline font-normal text-left"
                        onClick={() => requestSort('deposits')}
                      >
                        {t('deposits')}
                        <ArrowSmDownIcon
                          className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                            sortConfig?.key === 'deposits'
                              ? sortConfig.direction === 'ascending'
                                ? 'transform rotate-180'
                                : 'transform rotate-360'
                              : null
                          }`}
                        />
                      </LinkButton>
                    </Th>
                    <Th>
                      <LinkButton
                        className="flex items-center no-underline font-normal text-left"
                        onClick={() => requestSort('borrows')}
                      >
                        {t('borrows')}
                        <ArrowSmDownIcon
                          className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                            sortConfig?.key === 'borrows'
                              ? sortConfig.direction === 'ascending'
                                ? 'transform rotate-180'
                                : 'transform rotate-360'
                              : null
                          }`}
                        />
                      </LinkButton>
                    </Th>
                    <Th>
                      <LinkButton
                        className="flex items-center no-underline font-normal text-left"
                        onClick={() => requestSort('orders')}
                      >
                        {t('in-orders')}
                        <ArrowSmDownIcon
                          className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                            sortConfig?.key === 'orders'
                              ? sortConfig.direction === 'ascending'
                                ? 'transform rotate-180'
                                : 'transform rotate-360'
                              : null
                          }`}
                        />
                      </LinkButton>
                    </Th>
                    <Th>
                      <LinkButton
                        className="flex items-center no-underline font-normal text-left"
                        onClick={() => requestSort('unsettled')}
                      >
                        {t('unsettled')}
                        <ArrowSmDownIcon
                          className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                            sortConfig?.key === 'unsettled'
                              ? sortConfig.direction === 'ascending'
                                ? 'transform rotate-180'
                                : 'transform rotate-360'
                              : null
                          }`}
                        />
                      </LinkButton>
                    </Th>
                    <Th>
                      <LinkButton
                        className="flex items-center no-underline font-normal text-left"
                        onClick={() => requestSort('net')}
                      >
                        {t('net-balance')}
                        <ArrowSmDownIcon
                          className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                            sortConfig?.key === 'net'
                              ? sortConfig.direction === 'ascending'
                                ? 'transform rotate-180'
                                : 'transform rotate-360'
                              : null
                          }`}
                        />
                      </LinkButton>
                    </Th>
                    <Th>
                      <LinkButton
                        className="flex items-center no-underline font-normal text-left"
                        onClick={() => requestSort('value')}
                      >
                        {t('value')}
                        <ArrowSmDownIcon
                          className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                            sortConfig?.key === 'value'
                              ? sortConfig.direction === 'ascending'
                                ? 'transform rotate-180'
                                : 'transform rotate-360'
                              : null
                          }`}
                        />
                      </LinkButton>
                    </Th>
                    <Th>
                      <LinkButton
                        className="flex items-center no-underline font-normal text-left"
                        onClick={() => requestSort('depositRate')}
                      >
                        {t('deposit-rate')}
                        <ArrowSmDownIcon
                          className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                            sortConfig?.key === 'depositRate'
                              ? sortConfig.direction === 'ascending'
                                ? 'transform rotate-180'
                                : 'transform rotate-360'
                              : null
                          }`}
                        />
                      </LinkButton>
                    </Th>
                    <Th>
                      <LinkButton
                        className="flex items-center no-underline font-normal text-left"
                        onClick={() => requestSort('borrowRate')}
                      >
                        {t('borrow-rate')}
                        <ArrowSmDownIcon
                          className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                            sortConfig?.key === 'borrowRate'
                              ? sortConfig.direction === 'ascending'
                                ? 'transform rotate-180'
                                : 'transform rotate-360'
                              : null
                          }`}
                        />
                      </LinkButton>
                    </Th>
                  </TrHead>
                </thead>
                <tbody>
                  {items.map((balance, index) => (
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
                              <a className="text-th-fgd-1 underline hover:no-underline hover:text-th-fgd-1">
                                {balance.symbol}
                              </a>
                            </Link>
                          )}
                        </div>
                      </Td>
                      <Td>
                        {balance.deposits.toLocaleString(undefined, {
                          maximumFractionDigits: balance.decimals,
                        })}
                      </Td>
                      <Td>
                        {balance.borrows.toLocaleString(undefined, {
                          maximumFractionDigits: balance.decimals,
                        })}
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
                            {balance.net.toLocaleString(undefined, {
                              maximumFractionDigits: balance.decimals,
                            })}
                          </span>
                        ) : (
                          balance.net.toLocaleString(undefined, {
                            maximumFractionDigits: balance.decimals,
                          })
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
                              className="text-xs pt-0 pb-0 h-7 pl-3 pr-3"
                              onClick={() =>
                                handleOpenDepositModal(balance.symbol)
                              }
                            >
                              {balance.borrows.toNumber() > 0
                                ? t('repay')
                                : t('deposit')}
                            </Button>
                            <Button
                              className="text-xs pt-0 pb-0 h-7 ml-4 pl-3 pr-3"
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
                  ))}
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
              <>
                <MobileTableHeader
                  colOneHeader={t('asset')}
                  colTwoHeader={t('net-balance')}
                />
                {items.map((balance, index) => (
                  <ExpandableRow
                    buttonTemplate={
                      <div className="flex items-center justify-between text-th-fgd-1 w-full">
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
                        <div className="text-th-fgd-1 text-right">
                          {balance.net.toLocaleString(undefined, {
                            maximumFractionDigits: balance.decimals,
                          })}
                        </div>
                      </div>
                    }
                    key={`${balance.symbol}${index}`}
                    panelTemplate={
                      <>
                        <div className="grid grid-cols-2 grid-flow-row gap-4 pb-4">
                          <div className="text-left">
                            <div className="pb-0.5 text-th-fgd-3 text-xs">
                              {t('deposits')}
                            </div>
                            {balance.deposits.toLocaleString(undefined, {
                              maximumFractionDigits: balance.decimals,
                            })}
                          </div>
                          <div className="text-left">
                            <div className="pb-0.5 text-th-fgd-3 text-xs">
                              {t('borrows')}
                            </div>
                            {balance.borrows.toLocaleString(undefined, {
                              maximumFractionDigits: balance.decimals,
                            })}
                          </div>
                          <div className="text-left">
                            <div className="pb-0.5 text-th-fgd-3 text-xs">
                              {t('in-orders')}
                            </div>
                            {balance.orders.toLocaleString(undefined, {
                              maximumFractionDigits: balance.decimals,
                            })}
                          </div>
                          <div className="text-left">
                            <div className="pb-0.5 text-th-fgd-3 text-xs">
                              {t('unsettled')}
                            </div>
                            {balance.unsettled.toLocaleString(undefined, {
                              maximumFractionDigits: balance.decimals,
                            })}
                          </div>
                          <div className="text-left">
                            <div className="pb-0.5 text-th-fgd-3 text-xs">
                              {t('value')}
                            </div>
                            {formatUsdValue(balance.value.toNumber())}
                          </div>
                          <div className="text-left text-th-fgd-4">
                            <div className="pb-0.5 text-th-fgd-3 text-xs">
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
                            className="text-xs pt-0 pb-0 h-7 pl-3 pr-3 w-1/2"
                            onClick={() =>
                              handleOpenDepositModal(balance.symbol)
                            }
                          >
                            {balance.borrows.toNumber() > 0
                              ? t('repay')
                              : t('deposit')}
                          </Button>
                          <Button
                            className="text-xs pt-0 pb-0 h-7 pl-3 pr-3 w-1/2"
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
                                ? balance.borrows.toLocaleString(undefined, {
                                    maximumFractionDigits: balance.decimals,
                                  })
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
              </>
            )
          ) : (
            <div
              className={`w-full text-center py-6 bg-th-bkg-1 text-th-fgd-3 rounded-md`}
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
