import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'next-i18next'
import { ArrowSmDownIcon, ExternalLinkIcon } from '@heroicons/react/outline'
import { SaveIcon } from '@heroicons/react/outline'
import {
  getMarketByBaseSymbolAndKind,
  PerpMarket,
} from '@blockworks-foundation/mango-client'

import TradeHistoryTable from '../TradeHistoryTable'
import useMangoStore from '../../stores/useMangoStore'
import {
  Table,
  TrHead,
  Th,
  TrBody,
  Td,
  TableDateDisplay,
} from '../TableElements'
import { LinkButton } from '../Button'
import { useSortableData } from '../../hooks/useSortableData'
import { formatUsdValue } from '../../utils'
import { exportDataToCSV } from '../../utils/export'
import { notify } from '../../utils/notifications'
import useTradeHistory from '../../hooks/useTradeHistory'
import Button from '../Button'
import Loading from '../Loading'
import { fetchHourlyPerformanceStats } from './AccountOverview'

const historyViews = [
  { label: 'Trades', key: 'Trades' },
  { label: 'Deposits', key: 'Deposit' },
  { label: 'Withdrawals', key: 'Withdraw' },
  { label: 'Liquidations', key: 'Liquidation' },
]

export default function AccountHistory() {
  const { t } = useTranslation('common')
  const [view, setView] = useState('Trades')
  const [history, setHistory] = useState(null)
  const [loadExportData, setLoadExportData] = useState(false)

  const wallet = useMangoStore((s) => s.wallet.current)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const tradeHistory = useTradeHistory({ excludePerpLiquidations: true })

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

  const exportPerformanceDataToCSV = async () => {
    setLoadExportData(true)
    const exportData = await fetchHourlyPerformanceStats(
      mangoAccount.publicKey.toString(),
      10000
    )
    const dataToExport = exportData.map((row) => {
      const timestamp = new Date(row.time)
      return {
        timestamp: `${timestamp.toLocaleDateString()} ${timestamp.toLocaleTimeString()}`,
        account_equity: row.account_equity,
        pnl: row.pnl,
      }
    })

    const title = `${
      mangoAccount.name || mangoAccount.publicKey
    }-Performance-${new Date().toLocaleDateString()}`
    const headers = ['Timestamp', 'Account Equity', 'PNL']

    exportDataToCSV(dataToExport, title, headers, t)
    setLoadExportData(false)
  }

  const exportHistoryToCSV = () => {
    let dataToExport
    let headers

    if (view == 'Trades') {
      dataToExport = tradeHistory.map((trade) => {
        const timestamp = new Date(trade.loadTimestamp)
        return {
          asset: trade.marketName,
          orderType: trade.side.toUpperCase(),
          quantity: trade.size,
          price: trade.price,
          value: trade.value,
          liquidity: trade.liquidity,
          fee: trade.feeCost,
          date: `${timestamp.toLocaleDateString()} ${timestamp.toLocaleTimeString()}`,
        }
      })
      headers = [
        'Market',
        'Side',
        'Size',
        'Price',
        'Value',
        'Liquidity',
        'Fee',
        'Approx. Time',
      ]
    } else {
      dataToExport = history
        .filter((val) => val.activity_type == view)
        .map((row) => {
          row = row.activity_details
          const timestamp = new Date(row.block_datetime)

          return {
            date: `${timestamp.toLocaleDateString()} ${timestamp.toLocaleTimeString()}`,
            asset: row.symbol,
            quantity: row.quantity,
            value: row.usd_equivalent,
          }
        })
      headers = ['Timestamp', 'Asset', 'Quantity', 'Value']
    }

    if (dataToExport.length == 0) {
      notify({
        title: t('export-data-empty'),
        description: '',
        type: 'info',
      })
      return
    }

    const tab = historyViews.filter((v) => v.key == view)[0].label
    const title = `${
      mangoAccount.name || mangoAccount.publicKey
    }-${tab}-${new Date().toLocaleDateString()}`

    exportDataToCSV(dataToExport, title, headers, t)
  }

  const canWithdraw =
    mangoAccount && wallet?.publicKey
      ? mangoAccount.owner.equals(wallet.publicKey)
      : false

  return (
    <>
      <div className="mb-4 flex bg-th-bkg-3 px-3 py-2 md:-mx-6 md:mb-6 md:px-4">
        {historyViews.map(({ label, key }, index) => (
          <div
            className={`py-1 text-xs font-bold md:px-2 md:text-sm ${
              index > 0 ? 'ml-4 md:ml-2' : null
            } default-transition cursor-pointer rounded-md
                          ${
                            view === key
                              ? `text-th-primary`
                              : `text-th-fgd-3 hover:text-th-fgd-1`
                          }
                        `}
            onClick={() => setView(key)}
            key={key as string}
          >
            {t(label.toLowerCase())}
          </div>
        ))}
      </div>
      <div className="flex flex-col pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="pb-4 sm:pb-0">
          <h2 className="mb-1">{t(`${view.toLowerCase()}-history`)}</h2>
          <div className="mr-4 text-xs text-th-fgd-3">
            {t('delay-displaying-recent')} {t('use-explorer-one')}
            <a
              href={`https://explorer.solana.com/address/${mangoAccountPk}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('use-explorer-two')}
            </a>
            {t('use-explorer-three')}
          </div>
        </div>
        {view !== 'Trades' ? (
          <Button
            className={`flex h-8 items-center justify-center whitespace-nowrap pt-0 pb-0 pl-3 pr-3 text-xs`}
            onClick={exportHistoryToCSV}
          >
            <div className={`flex items-center`}>
              <SaveIcon className={`mr-1.5 h-4 w-4`} />
              {t('export-data')}
            </div>
          </Button>
        ) : canWithdraw ? (
          <Button
            className={`flex h-8 items-center justify-center whitespace-nowrap pt-0 pb-0 pl-3 pr-3 text-xs`}
            onClick={exportPerformanceDataToCSV}
          >
            {loadExportData ? (
              <Loading />
            ) : (
              <div className={`flex items-center`}>
                <SaveIcon className={`mr-1.5 h-4 w-4`} />
                {t('export-pnl-csv')}
              </div>
            )}
          </Button>
        ) : null}
      </div>
      <ViewContent view={view} history={history} />
    </>
  )
}

const ViewContent = ({ view, history }) => {
  switch (view) {
    case 'Trades':
      return <TradeHistoryTable />
    case 'Deposit':
      return <HistoryTable history={history} view={view} />
    case 'Withdraw':
      return <HistoryTable history={history} view={view} />
    case 'Liquidation':
      return <LiquidationHistoryTable history={history} view={view} />
    default:
      return <TradeHistoryTable />
  }
}

const parseActivityDetails = (activity_details, activity_type, perpMarket) => {
  let assetGained, assetLost

  const assetSymbol =
    activity_type === 'liquidate_perp_market'
      ? 'USD (PERP)'
      : activity_details.asset_symbol

  const liabSymbol =
    activity_type === 'liquidate_perp_market' ||
    activity_details.liab_type === 'Perp'
      ? activity_details.liab_symbol.includes('USDC')
        ? 'USD (PERP)'
        : `${activity_details.liab_symbol}-PERP`
      : activity_details.liab_symbol

  const liabAmount =
    perpMarket && liabSymbol !== 'USD (PERP)'
      ? perpMarket.baseLotsToNumber(activity_details.liab_amount)
      : activity_details.liab_amount

  const assetAmount = activity_details.asset_amount

  const asset_amount = {
    amount: parseFloat(assetAmount),
    symbol: assetSymbol,
    price: parseFloat(activity_details.asset_price),
  }

  const liab_amount = {
    amount: parseFloat(liabAmount),
    symbol: liabSymbol,
    price: parseFloat(activity_details.liab_price),
  }

  switch (activity_type) {
    case 'liquidate_token_and_token':
      return [liab_amount, asset_amount]
    case 'liquidate_token_and_perp':
      if (activity_details.asset_type === 'Token') {
        return [liab_amount, asset_amount]
      } else {
        return [asset_amount, liab_amount]
      }
    case 'liquidate_perp_market':
      if (parseFloat(activity_details.asset_amount) > 0) {
        assetGained = asset_amount
        assetLost = liab_amount
      } else {
        assetGained = liab_amount
        assetLost = asset_amount
      }
      return [assetGained, assetLost]
    default:
      return []
  }
}

const LiquidationHistoryTable = ({ history, view }) => {
  const { t } = useTranslation('common')
  const markets = useMangoStore((s) => s.selectedMangoGroup.markets)
  const groupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const filteredHistory = useMemo(() => {
    return history?.length
      ? history.filter((h) => h.activity_type.includes('liquidate'))
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
                    className="flex items-center font-normal no-underline"
                    onClick={() => requestSort('block_datetime')}
                  >
                    {t('date')}
                    <ArrowSmDownIcon
                      className={`default-transition ml-1 h-4 w-4 flex-shrink-0 ${
                        sortConfig?.key === 'block_datetime'
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
                    className="flex items-center font-normal no-underline"
                    onClick={() => requestSort('asset_amount')}
                  >
                    Asset Lost
                    <ArrowSmDownIcon
                      className={`default-transition ml-1 h-4 w-4 flex-shrink-0 ${
                        sortConfig?.key === 'asset_amount'
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
                    className="flex items-center font-normal no-underline"
                    onClick={() => requestSort('asset_price')}
                  >
                    Price
                    <ArrowSmDownIcon
                      className={`default-transition ml-1 h-4 w-4 flex-shrink-0 ${
                        sortConfig?.key === 'asset_price'
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
                    className="flex items-center font-normal no-underline"
                    onClick={() => requestSort('liab_amount')}
                  >
                    Asset Gained
                    <ArrowSmDownIcon
                      className={`default-transition ml-1 h-4 w-4 flex-shrink-0 ${
                        sortConfig?.key === 'liab_amount'
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
                    className="flex items-center font-normal no-underline"
                    onClick={() => requestSort('liab_price')}
                  >
                    Price
                    <ArrowSmDownIcon
                      className={`default-transition ml-1 h-4 w-4 flex-shrink-0 ${
                        sortConfig?.key === 'liab_price'
                          ? sortConfig.direction === 'ascending'
                            ? 'rotate-180 transform'
                            : 'rotate-360 transform'
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
              {items.map(({ activity_details, activity_type }) => {
                let perpMarket: PerpMarket
                if (activity_type.includes('perp')) {
                  const symbol = activity_details.perp_market.split('-')[0]
                  const marketConfig = getMarketByBaseSymbolAndKind(
                    groupConfig,
                    symbol,
                    'perp'
                  )
                  perpMarket = markets[
                    marketConfig.publicKey.toString()
                  ] as PerpMarket
                }

                const [assetGained, assetLost] = parseActivityDetails(
                  activity_details,
                  activity_type,
                  perpMarket
                )

                const lostDecimals = assetLost.symbol === 'SOL' ? 9 : 6
                const gainedDecimals = assetGained.symbol === 'SOL' ? 9 : 6
                return (
                  <TrBody key={activity_details.signature}>
                    <Td>
                      <TableDateDisplay
                        date={activity_details.block_datetime}
                      />
                    </Td>

                    <Td>
                      <span className="text-th-red">
                        {Math.abs(assetLost.amount).toLocaleString(undefined, {
                          maximumFractionDigits: lostDecimals,
                        })}{' '}
                      </span>
                      {assetLost.symbol}
                    </Td>
                    <Td>
                      {assetLost.price.toLocaleString(undefined, {
                        maximumFractionDigits: lostDecimals,
                      })}
                    </Td>
                    <Td>
                      <span className="text-th-green">
                        {Math.abs(assetGained.amount).toLocaleString(
                          undefined,
                          {
                            maximumFractionDigits: gainedDecimals,
                          }
                        )}{' '}
                      </span>
                      {assetGained.symbol}
                    </Td>
                    <Td>
                      {assetGained.price.toLocaleString(undefined, {
                        maximumFractionDigits: gainedDecimals,
                      })}
                    </Td>
                    <Td>
                      <a
                        className="default-transition flex items-center justify-end text-th-fgd-2"
                        href={`https://explorer.solana.com/tx/${activity_details.signature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span>View Transaction</span>
                        <ExternalLinkIcon className={`ml-1.5 h-4 w-4`} />
                      </a>
                    </Td>
                  </TrBody>
                )
              })}
            </tbody>
          </Table>
        </>
      ) : (
        <div className="w-full rounded-md bg-th-bkg-1 py-6 text-center text-th-fgd-3">
          {t('history-empty')}
        </div>
      )}
    </>
  )
}

const HistoryTable = ({ history, view }) => {
  const { t } = useTranslation('common')
  const filteredHistory = useMemo(() => {
    return history?.length
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
                    className="flex items-center font-normal no-underline"
                    onClick={() => requestSort('block_datetime')}
                  >
                    {t('date')}
                    <ArrowSmDownIcon
                      className={`default-transition ml-1 h-4 w-4 flex-shrink-0 ${
                        sortConfig?.key === 'block_datetime'
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
                    className="flex items-center font-normal no-underline"
                    onClick={() => requestSort('symbol')}
                  >
                    {t('asset')}
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
                    className="flex items-center font-normal no-underline"
                    onClick={() => requestSort('quantity')}
                  >
                    {t('quantity')}
                    <ArrowSmDownIcon
                      className={`default-transition ml-1 h-4 w-4 flex-shrink-0 ${
                        sortConfig?.key === 'quantity'
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
                    className="flex items-center font-normal no-underline"
                    onClick={() => requestSort('usd_equivalent')}
                  >
                    {t('value')}
                    <ArrowSmDownIcon
                      className={`default-transition ml-1 h-4 w-4 flex-shrink-0 ${
                        sortConfig?.key === 'usd_equivalent'
                          ? sortConfig.direction === 'ascending'
                            ? 'rotate-180 transform'
                            : 'rotate-360 transform'
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
              {items.map((activity_details: any) => {
                return (
                  <TrBody key={activity_details.signature}>
                    <Td>
                      <TableDateDisplay
                        date={activity_details.block_datetime}
                      />
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
                    <Td>{activity_details.quantity.toLocaleString()}</Td>
                    <Td>{formatUsdValue(activity_details.usd_equivalent)}</Td>
                    <Td>
                      <a
                        className="default-transition flex items-center justify-end text-th-fgd-2"
                        href={`https://explorer.solana.com/tx/${activity_details.signature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span>{t('view-transaction')}</span>
                        <ExternalLinkIcon className={`ml-1.5 h-4 w-4`} />
                      </a>
                    </Td>
                  </TrBody>
                )
              })}
            </tbody>
          </Table>
        </>
      ) : (
        <div className="w-full rounded-md bg-th-bkg-1 py-6 text-center text-th-fgd-3">
          {t('history-empty')}
        </div>
      )}
    </>
  )
}
