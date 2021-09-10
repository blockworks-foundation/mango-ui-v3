import { useCallback } from 'react'
import { useBalances } from '../hooks/useBalances'
import useMangoStore, { mangoClient } from '../stores/useMangoStore'
import Button, { LinkButton } from '../components/Button'
import { notify } from '../utils/notifications'
import { ArrowSmDownIcon, ExclamationIcon } from '@heroicons/react/outline'
import { Market } from '@project-serum/serum'
import { getTokenBySymbol } from '@blockworks-foundation/mango-client'
import { useState } from 'react'
import Loading from './Loading'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from './TradePageGrid'
import { floorToDecimal, formatUsdValue } from '../utils'
import { Table, Td, Th, TrBody, TrHead } from './TableElements'
import { useSortableData } from '../hooks/useSortableData'
import DepositModal from './DepositModal'
import WithdrawModal from './WithdrawModal'
import { ExpandableRow } from './TableElements'
import MobileTableHeader from './mobile/MobileTableHeader'

const BalancesTable = ({ showZeroBalances = false }) => {
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
  const { width } = useViewport()
  const [submitting, setSubmitting] = useState(false)
  const isMobile = width ? width < breakpoints.md : false

  const handleOpenDepositModal = useCallback((symbol) => {
    setActionSymbol(symbol)
    setShowDepositModal(true)
  }, [])

  const handleOpenWithdrawModal = useCallback((symbol) => {
    setActionSymbol(symbol)
    setShowWithdrawModal(true)
  }, [])

  async function handleSettleAll() {
    const mangoAccount = useMangoStore.getState().selectedMangoAccount.current
    const markets = useMangoStore.getState().selectedMangoGroup.markets
    const wallet = useMangoStore.getState().wallet.current

    try {
      setSubmitting(true)
      const spotMarkets = Object.values(markets).filter(
        (mkt) => mkt instanceof Market
      ) as Market[]
      await mangoClient.settleAll(mangoGroup, mangoAccount, spotMarkets, wallet)

      notify({ title: 'Successfully settled funds' })
    } catch (e) {
      console.warn('Error settling all:', e)
      if (e.message === 'No unsettled funds') {
        notify({
          title: 'There are no unsettled funds',
          type: 'error',
        })
      } else {
        notify({
          title: 'Error settling funds',
          description: e.message,
          txid: e.txid,
          type: 'error',
        })
      }
    } finally {
      await actions.reloadMangoAccount()
      setSubmitting(false)
    }
  }

  const unsettledBalances = balances.filter((bal) => bal.unsettled > 0)

  return (
    <div className={`flex flex-col py-4`}>
      {unsettledBalances.length > 0 ? (
        <div className="border border-th-bkg-4 rounded-lg mb-6 p-6">
          <div className="flex items-center justify-between pb-4">
            <div className="flex items-center text-lg">
              <ExclamationIcon className="flex-shrink-0 h-5 mr-1.5 mt-0.5 text-th-primary w-5" />
              Unsettled Balances
            </div>
            <Button
              className="text-xs pt-0 pb-0 h-8 pl-3 pr-3 whitespace-nowrap"
              onClick={handleSettleAll}
            >
              {submitting ? <Loading /> : 'Settle All'}
            </Button>
          </div>
          {unsettledBalances.map((bal) => {
            const tokenConfig = getTokenBySymbol(mangoGroupConfig, bal.symbol)
            return (
              <div
                className="border-b border-th-bkg-4 flex items-center justify-between py-4 last:border-b-0 last:pb-0"
                key={bal.symbol}
              >
                <div className="flex items-center">
                  <img
                    alt=""
                    width="20"
                    height="20"
                    src={`/assets/icons/${bal.symbol.toLowerCase()}.svg`}
                    className={`mr-2.5`}
                  />
                  <div>{bal.symbol}</div>
                </div>
                {`${floorToDecimal(bal.unsettled, tokenConfig.decimals)} ${
                  bal.symbol
                }`}
              </div>
            )
          })}
        </div>
      ) : null}
      <div className={`-my-2 overflow-x-auto`}>
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
                        Asset
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
                        Deposits
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
                        Borrows
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
                        In Orders
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
                        Unsettled
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
                        Net Balance
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
                        Value
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
                        Deposit Rate
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
                        Borrow Rate
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
                    <TrBody index={index} key={`${balance.symbol}${index}`}>
                      <Td>
                        <div className="flex items-center">
                          <img
                            alt=""
                            width="20"
                            height="20"
                            src={`/assets/icons/${balance.symbol.toLowerCase()}.svg`}
                            className={`mr-2.5`}
                          />

                          {balance.symbol}
                        </div>
                      </Td>
                      <Td>{balance.deposits.toFixed()}</Td>
                      <Td>{balance.borrows.toFixed()}</Td>
                      <Td>{balance.orders}</Td>
                      <Td>{balance.unsettled}</Td>
                      <Td>{balance.net.toFixed()}</Td>
                      <Td>{formatUsdValue(balance.value)}</Td>
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
                      <Td>
                        <div className="flex justify-end">
                          <Button
                            className="text-xs pt-0 pb-0 h-8 pl-3 pr-3"
                            onClick={() =>
                              handleOpenDepositModal(balance.symbol)
                            }
                          >
                            Deposit
                          </Button>
                          <Button
                            className="text-xs pt-0 pb-0 h-8 ml-4 pl-3 pr-3"
                            onClick={() =>
                              handleOpenWithdrawModal(balance.symbol)
                            }
                          >
                            Withdraw
                          </Button>
                        </div>
                      </Td>
                    </TrBody>
                  ))}
                </tbody>
                {showDepositModal && (
                  <DepositModal
                    isOpen={showDepositModal}
                    onClose={() => setShowDepositModal(false)}
                    tokenSymbol={actionSymbol}
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
                  headerTemplate={
                    <>
                      <div className="col-span-7">Asset</div>
                      <div className="col-span-4 text-right">Net Balance</div>
                    </>
                  }
                />
                {items.map((balance, index) => (
                  <ExpandableRow
                    buttonTemplate={
                      <>
                        <div className="col-span-7 flex items-center text-fgd-1">
                          <img
                            alt=""
                            width="20"
                            height="20"
                            src={`/assets/icons/${balance.symbol.toLowerCase()}.svg`}
                            className={`mr-2.5`}
                          />

                          {balance.symbol}
                        </div>
                        <div className="col-span-4 text-fgd-1 text-right">
                          {balance.net.toFixed()}
                        </div>
                      </>
                    }
                    key={`${balance.symbol}${index}`}
                    index={index}
                    panelTemplate={
                      <>
                        <div className="col-span-1 text-left">
                          <div className="pb-0.5 text-th-fgd-3 text-xs">
                            Deposits
                          </div>
                          {balance.deposits.toFixed()}
                        </div>
                        <div className="col-span-1 text-left">
                          <div className="pb-0.5 text-th-fgd-3 text-xs">
                            Borrows
                          </div>
                          {balance.borrows.toFixed()}
                        </div>
                        <div className="col-span-1 text-left">
                          <div className="pb-0.5 text-th-fgd-3 text-xs">
                            In Orders
                          </div>
                          {balance.orders.toFixed()}
                        </div>
                        <div className="col-span-1 text-left">
                          <div className="pb-0.5 text-th-fgd-3 text-xs">
                            Unsettled
                          </div>
                          {balance.unsettled.toFixed()}
                        </div>
                        <div className="col-span-1 text-left">
                          <div className="pb-0.5 text-th-fgd-3 text-xs">
                            Value
                          </div>
                          {formatUsdValue(balance.value)}
                        </div>
                        <div className="col-span-1 text-left text-th-fgd-4">
                          <div className="pb-0.5 text-th-fgd-3 text-xs">
                            Deposit/Borrow Rates
                          </div>
                          <span className="mr-1 text-th-green">
                            {balance.depositRate.toFixed(2)}%
                          </span>
                          /
                          <span className="ml-1 text-th-red">
                            {balance.borrowRate.toFixed(2)}%
                          </span>
                        </div>
                        <Button
                          className="col-span-1 text-xs pt-0 pb-0 h-8 pl-3 pr-3"
                          onClick={() => handleOpenDepositModal(balance.symbol)}
                        >
                          Deposit
                        </Button>
                        <Button
                          className="col-span-1 text-xs pt-0 pb-0 h-8 pl-3 pr-3"
                          onClick={() =>
                            handleOpenWithdrawModal(balance.symbol)
                          }
                        >
                          Withdraw
                        </Button>
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
              No balances
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BalancesTable
