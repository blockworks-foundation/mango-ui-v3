import { useState, useEffect, useMemo } from 'react'
import TradeHistoryTable from '../TradeHistoryTable'
import { useTranslation } from 'next-i18next'
import useMangoStore from '../../stores/useMangoStore'
import { ArrowSmDownIcon, ExternalLinkIcon } from '@heroicons/react/solid'
import { Table, TrHead, Th, TrBody, Td } from '../TableElements'
import { LinkButton } from '../Button'
import { useSortableData } from '../../hooks/useSortableData'
import { formatUsdValue } from '../../utils'

const historyViews = [
  { label: 'Trades', key: 'Trades' },
  { label: 'Deposits', key: 'Deposit' },
  { label: 'Withdrawals', key: 'Withdraw' },
  /*'Liquidations'*/
]

export default function AccountHistory() {
  const { t } = useTranslation('common')
  const [view, setView] = useState('Trades')
  const [history, setHistory] = useState(null)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)

  const mangoAccountPk = useMemo(() => {
    console.log('new mango account')

    return mangoAccount.publicKey.toString()
  }, [mangoAccount])

  useEffect(() => {
    const fetchAccountActivity = async () => {
      const response = await fetch(
        `https://mango-transaction-log.herokuapp.com/v3/stats/activity-feed?mango-account=${mangoAccountPk}`
      )
      const parsedResponse = await response.json()
      setHistory(parsedResponse)
    }

    if (mangoAccountPk) {
      fetchAccountActivity()
    }
  }, [mangoAccountPk])

  console.log('history', history)

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between pb-4">
        <div>
          <div className="mb-1 text-th-fgd-1 text-lg">{t('history')}</div>
          <div className="mr-4 text-xs text-th-fgd-3">
            There may be a short delay in displaying your latest history. Use
            the{' '}
            <a
              href={`https://explorer.solana.com/address/${mangoAccountPk}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Explorer
            </a>{' '}
            to verify any delayed transactions.
          </div>
        </div>
        <div className="flex mb-1 mt-4 md:mt-0">
          {historyViews.map(({ label, key }, index) => (
            <div
              className={`px-2 py-1 ${
                index > 0 ? 'ml-2' : null
              } rounded-md cursor-pointer default-transition bg-th-bkg-3
                          ${
                            view === key
                              ? `ring-1 ring-inset ring-th-primary text-th-primary`
                              : `text-th-fgd-1 opacity-50 hover:opacity-100`
                          }
                        `}
              onClick={() => setView(key)}
              key={key as string}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
      <ViewContent view={view} history={history} />
    </>
  )
}

const HistoryTable = ({ history, view }) => {
  const { t } = useTranslation('common')
  const filteredHistory = useMemo(() => {
    return history.length
      ? history
          .filter((h) => h.activity_type === view)
          .map((h) => h.activity_details)
      : []
  }, [history, view])
  const { items, requestSort, sortConfig } = useSortableData(filteredHistory)

  return (
    <>
      {items.length ? (
        <>
          <Table>
            <thead>
              <TrHead>
                <Th>
                  <LinkButton
                    className="flex items-center no-underline font-normal"
                    onClick={() => requestSort('block_datetime')}
                  >
                    {t('date')}
                    <ArrowSmDownIcon
                      className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                        sortConfig?.key === 'block_datetime'
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
                    className="flex items-center no-underline font-normal"
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
                    className="flex items-center no-underline font-normal"
                    onClick={() => requestSort('quantity')}
                  >
                    {t('quantity')}
                    <ArrowSmDownIcon
                      className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                        sortConfig?.key === 'quantity'
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
                    className="flex items-center no-underline font-normal"
                    onClick={() => requestSort('usd_equivalent')}
                  >
                    {t('value')}
                    <ArrowSmDownIcon
                      className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                        sortConfig?.key === 'usd_equivalent'
                          ? sortConfig.direction === 'ascending'
                            ? 'transform rotate-180'
                            : 'transform rotate-360'
                          : null
                      }`}
                    />
                  </LinkButton>
                </Th>
                <Th>
                  <span></span>
                </Th>
              </TrHead>
            </thead>
            <tbody>
              {items.map((activity_details: any, index) => {
                const date = new Date(activity_details.block_datetime)
                return (
                  <TrBody index={index} key={activity_details.signature}>
                    <Td>
                      <div>{date.toLocaleDateString()}</div>
                      <div className="text-xs text-th-fgd-3">
                        {date.toLocaleTimeString()}
                      </div>
                    </Td>
                    <Td>
                      <div className="flex items-center">
                        <img
                          alt=""
                          width="20"
                          height="20"
                          src={`/assets/icons/${activity_details.symbol.toLowerCase()}.svg`}
                          className={`mr-2.5`}
                        />
                        {activity_details.symbol}
                      </div>
                    </Td>
                    <Td>{activity_details.quantity}</Td>
                    <Td>{formatUsdValue(activity_details.usd_equivalent)}</Td>
                    <Td>
                      <a
                        className="default-transition flex items-center justify-end text-th-fgd-2"
                        href={`https://explorer.solana.com/tx/${activity_details.signature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span>View Transaction</span>
                        <ExternalLinkIcon className={`h-4 w-4 ml-1.5`} />
                      </a>
                    </Td>
                  </TrBody>
                )
              })}
            </tbody>
          </Table>
        </>
      ) : (
        <div className="w-full text-center py-6 bg-th-bkg-1 text-th-fgd-3 rounded-md">
          History empty.
        </div>
      )}
    </>
  )
}

const ViewContent = ({ view, history }) => {
  const { t } = useTranslation('common')

  switch (view) {
    case 'Trades':
      return <TradeHistoryTable />
    case 'Deposit':
      return <HistoryTable history={history} view={view} />
    case 'Withdraw':
      return <HistoryTable history={history} view={view} />
    case 'Liquidation':
      return <div>{t('liquidations')}</div>
    default:
      return <TradeHistoryTable />
  }
}
