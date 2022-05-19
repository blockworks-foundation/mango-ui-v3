import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'next-i18next'
import {
  ArrowSmDownIcon,
  ExternalLinkIcon,
  InformationCircleIcon,
  SaveIcon,
} from '@heroicons/react/outline'
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
  Row,
} from '../TableElements'
import { LinkButton } from '../Button'
import { useSortableData } from '../../hooks/useSortableData'
import { formatUsdValue } from '../../utils'
import Tooltip from '../Tooltip'
import { exportDataToCSV } from '../../utils/export'
import { notify } from '../../utils/notifications'
import Button from '../Button'
import { useViewport } from '../../hooks/useViewport'
import { breakpoints } from '.././TradePageGrid'
import MobileTableHeader from 'components/mobile/MobileTableHeader'

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

  const mangoAccountPk = useMemo(() => {
    if (mangoAccount) {
      return mangoAccount.publicKey.toString()
    }
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

  return (
    <>
      <div className="mb-4 flex rounded-md bg-th-bkg-3 px-3 py-2 md:mb-6 md:px-4">
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
      <ViewContent view={view} history={history} />
    </>
  )
}

const ViewContent = ({ view, history }) => {
  switch (view) {
    case 'Trades':
      return <TradeHistoryTable showActions />
    case 'Deposit':
      return <HistoryTable history={history} view={view} />
    case 'Withdraw':
      return <HistoryTable history={history} view={view} />
    case 'Liquidation':
      return <LiquidationHistoryTable history={history} view={view} />
    default:
      return <TradeHistoryTable showActions />
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
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const markets = useMangoStore((s) => s.selectedMangoGroup.markets)
  const groupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const filteredHistory = useMemo(() => {
    return history?.length
      ? history.filter((h) => h.activity_type.includes('liquidate'))
      : []
  }, [history, view])
  const { items, requestSort, sortConfig } = useSortableData(filteredHistory)

  const exportHistoryToCSV = () => {
    const dataToExport = history
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
    const headers = ['Timestamp', 'Asset', 'Quantity', 'Value']

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
      mangoAccount?.name || mangoAccount?.publicKey
    }-${tab}-${new Date().toLocaleDateString()}`

    exportDataToCSV(dataToExport, title, headers, t)
  }

  return (
    <>
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center">
          <h4 className="mb-0 text-th-fgd-1">
            {filteredHistory.length === 1
              ? t('number-liquidation', { number: filteredHistory.length })
              : t('number-liquidations', { number: filteredHistory.length })}
          </h4>
          <Tooltip
            content={
              <div className="mr-4 text-xs text-th-fgd-3">
                {t('delay-displaying-recent')} {t('use-explorer-one')}
                <a
                  href={`https://explorer.solana.com/address/${mangoAccount?.publicKey?.toString()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('use-explorer-two')}
                </a>
                {t('use-explorer-three')}
              </div>
            }
          >
            <InformationCircleIcon className="ml-1.5 h-5 w-5 cursor-pointer text-th-fgd-3" />
          </Tooltip>
        </div>
        <Button
          className={`flex h-8 items-center justify-center whitespace-nowrap pt-0 pb-0 pl-3 pr-3 text-xs`}
          onClick={exportHistoryToCSV}
        >
          <div className={`flex items-center`}>
            <SaveIcon className={`mr-1.5 h-4 w-4`} />
            {t('export-data')}
          </div>
        </Button>
      </div>
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
                    <span className="font-normal">{t('date')}</span>
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
                    <span className="font-normal">Asset Lost</span>
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
                    <span className="font-normal">Price</span>
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
                    <span className="font-normal">Asset Gained</span>
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
                    <span className="font-normal">Price</span>
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
                let perpMarket: PerpMarket | null = null
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
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.md : false
  const filteredHistory = useMemo(() => {
    return history?.length
      ? history
          .filter((h) => h.activity_type === view)
          .map((h) => h.activity_details)
      : []
  }, [history, view])
  const { items, requestSort, sortConfig } = useSortableData(filteredHistory)

  const exportHistoryToCSV = () => {
    const dataToExport = history
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
    const headers = ['Timestamp', 'Asset', 'Quantity', 'Value']

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
      mangoAccount?.name || mangoAccount?.publicKey
    }-${tab}-${new Date().toLocaleDateString()}`

    exportDataToCSV(dataToExport, title, headers, t)
  }

  return (
    <>
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center">
          <h4 className="mb-0 text-th-fgd-1">
            {filteredHistory.length === 1
              ? view === 'Withdraw'
                ? t('number-withdrawal', { number: filteredHistory.length })
                : t('number-deposit', { number: filteredHistory.length })
              : view === 'Withdraw'
              ? t('number-withdrawals', { number: filteredHistory.length })
              : t('number-deposits', { number: filteredHistory.length })}
          </h4>
          <Tooltip
            content={
              <div className="mr-4 text-xs text-th-fgd-3">
                {t('delay-displaying-recent')} {t('use-explorer-one')}
                <a
                  href={`https://explorer.solana.com/address/${mangoAccount?.publicKey?.toString()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('use-explorer-two')}
                </a>
                {t('use-explorer-three')}
              </div>
            }
          >
            <InformationCircleIcon className="ml-1.5 h-5 w-5 cursor-pointer text-th-fgd-3" />
          </Tooltip>
        </div>
        <Button
          className={`flex h-8 items-center justify-center whitespace-nowrap pt-0 pb-0 pl-3 pr-3 text-xs`}
          onClick={exportHistoryToCSV}
        >
          <div className={`flex items-center`}>
            <SaveIcon className={`mr-1.5 h-4 w-4`} />
            {t('export-data')}
          </div>
        </Button>
      </div>
      {items.length ? (
        !isMobile ? (
          <Table>
            <thead>
              <TrHead>
                <Th>
                  <LinkButton
                    className="flex items-center font-normal no-underline"
                    onClick={() => requestSort('block_datetime')}
                  >
                    <span className="font-normal">{t('date')}</span>
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
                    className="flex items-center font-normal no-underline"
                    onClick={() => requestSort('quantity')}
                  >
                    <span className="font-normal">{t('quantity')}</span>
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
                    <span className="font-normal">{t('value')}</span>
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
                const {
                  signature,
                  block_datetime,
                  symbol,
                  quantity,
                  usd_equivalent,
                } = activity_details
                return (
                  <TrBody key={signature}>
                    <Td>
                      <TableDateDisplay date={block_datetime} />
                    </Td>
                    <Td>
                      <div className="flex items-center">
                        <img
                          alt=""
                          width="20"
                          height="20"
                          src={`/assets/icons/${symbol.toLowerCase()}.svg`}
                          className={`mr-2.5`}
                        />
                        {symbol}
                      </div>
                    </Td>
                    <Td>{quantity.toLocaleString()}</Td>
                    <Td>{formatUsdValue(usd_equivalent)}</Td>
                    <Td>
                      <a
                        className="default-transition flex items-center justify-end text-th-fgd-2"
                        href={`https://explorer.solana.com/tx/${signature}`}
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
        ) : (
          <div className="mb-4 border-b border-th-bkg-4">
            <MobileTableHeader
              colOneHeader={t('date')}
              colTwoHeader={t('asset')}
            />
            {items.map((activity_details: any) => {
              const {
                signature,
                block_datetime,
                symbol,
                quantity,
                usd_equivalent,
              } = activity_details
              return (
                <Row key={signature}>
                  <div className="flex w-full items-center justify-between text-th-fgd-1">
                    <div className="text-left">
                      <TableDateDisplay date={block_datetime} />
                    </div>
                    <div className="flex items-center">
                      <div className="text-right">
                        <p className="mb-0 text-th-fgd-2">
                          {`${quantity.toLocaleString()} ${symbol}`}
                        </p>
                        <p className="mb-0 text-xs text-th-fgd-3">
                          {formatUsdValue(usd_equivalent)}
                        </p>
                      </div>
                      <a
                        className="default-transition flex items-center justify-end text-th-fgd-2"
                        href={`https://explorer.solana.com/tx/${signature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLinkIcon className={`ml-3.5 h-5 w-5`} />
                      </a>
                    </div>
                  </div>
                </Row>
              )
            })}
          </div>
        )
      ) : (
        <div className="w-full rounded-md bg-th-bkg-1 py-6 text-center text-th-fgd-3">
          {t('history-empty')}
        </div>
      )}
    </>
  )
}
