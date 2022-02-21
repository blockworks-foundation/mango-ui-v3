import { useState, useEffect, useMemo } from 'react'
import TradeHistoryTable from '../TradeHistoryTable'
import { useTranslation } from 'next-i18next'
import useMangoStore from '../../stores/useMangoStore'
import { ArrowSmDownIcon, ExternalLinkIcon } from '@heroicons/react/solid'
import { Table, TrHead, Th, TrBody, Td } from '../TableElements'
import { LinkButton } from '../Button'
import { useSortableData } from '../../hooks/useSortableData'
import { formatUsdValue } from '../../utils'
import {
  getMarketByBaseSymbolAndKind,
  PerpMarket,
} from '@blockworks-foundation/mango-client'
import { exportDataToCSV } from '../../utils/export'
import { notify } from '../../utils/notifications'
import useTradeHistory from '../../hooks/useTradeHistory'
import Button from '../Button'
import { SaveIcon } from '@heroicons/react/outline'

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

  return (
    <>
      <div className="bg-th-bkg-3 flex mb-4 md:mb-6 md:-mt-6 md:-mx-6 px-3 md:px-4 py-2 rounded-md md:rounded-none md:rounded-t-md">
        {historyViews.map(({ label, key }, index) => (
          <div
            className={`font-bold md:px-2 py-1 text-xs md:text-sm ${
              index > 0 ? 'ml-4 md:ml-2' : null
            } rounded-md cursor-pointer default-transition
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
            className={`flex items-center justify-center text-xs h-8 pt-0 pb-0 pl-3 pr-3 whitespace-nowrap`}
            onClick={exportHistoryToCSV}
          >
            <div className={`flex items-center`}>
              <SaveIcon className={`h-4 w-4 mr-1.5`} />
              {t('export-data')}
            </div>
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
                    onClick={() => requestSort('asset_amount')}
                  >
                    Asset Lost
                    <ArrowSmDownIcon
                      className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                        sortConfig?.key === 'asset_amount'
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
                    onClick={() => requestSort('asset_price')}
                  >
                    Price
                    <ArrowSmDownIcon
                      className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                        sortConfig?.key === 'asset_price'
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
                    onClick={() => requestSort('liab_amount')}
                  >
                    Asset Gained
                    <ArrowSmDownIcon
                      className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                        sortConfig?.key === 'liab_amount'
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
                    onClick={() => requestSort('liab_price')}
                  >
                    Price
                    <ArrowSmDownIcon
                      className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                        sortConfig?.key === 'liab_price'
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

                const date = new Date(activity_details.block_datetime)
                const lostDecimals = assetLost.symbol === 'SOL' ? 9 : 6
                const gainedDecimals = assetGained.symbol === 'SOL' ? 9 : 6
                return (
                  <TrBody key={activity_details.signature}>
                    <Td>
                      <div>{date.toLocaleDateString()}</div>
                      <div className="text-xs text-th-fgd-3">
                        {date.toLocaleTimeString()}
                      </div>
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
          History empty
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
              {items.map((activity_details: any) => {
                const date = new Date(activity_details.block_datetime)
                return (
                  <TrBody key={activity_details.signature}>
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
                        <span>{t('view-transaction')}</span>
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
          {t('history-empty')}
        </div>
      )}
    </>
  )
}
