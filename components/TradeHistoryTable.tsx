import { ArrowSmDownIcon } from '@heroicons/react/solid'
import BN from 'bn.js'
import useTradeHistory from '../hooks/useTradeHistory'
import Link from 'next/link'
import { useRouter } from 'next/router'
import SideBadge from './SideBadge'
import Button, { LinkButton } from './Button'
import { useSortableData } from '../hooks/useSortableData'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from './TradePageGrid'
import { Table, Td, Th, TrBody, TrHead } from './TableElements'
import { ExpandableRow } from './TableElements'
import { formatUsdValue } from '../utils'
import { useTranslation } from 'next-i18next'
import Pagination from './Pagination'
import usePagination from '../hooks/usePagination'
import { useEffect, useMemo, useState } from 'react'
import { useFilteredData } from '../hooks/useFilteredData'
import TradeHistoryFilterModal from './TradeHistoryFilterModal'
import {
  FilterIcon,
  InformationCircleIcon,
  RefreshIcon,
  SaveIcon,
} from '@heroicons/react/outline'
import { fetchHourlyPerformanceStats } from './account_page/AccountOverview'
import useMangoStore from '../stores/useMangoStore'
import Loading from './Loading'
import { canWithdraw } from '../utils/mango'
import { exportDataToCSV } from '../utils/export'
import Tooltip from './Tooltip'

const renderTradeDateTime = (timestamp: BN | string) => {
  let date
  // don't compare to BN because of npm maddness
  // prototypes can be different due to multiple versions being imported
  if (typeof timestamp === 'string') {
    date = new Date(timestamp)
  } else {
    date = new Date(timestamp.toNumber() * 1000)
  }

  return (
    <>
      <div>{date.toLocaleDateString()}</div>
      <div className="text-xs text-th-fgd-3">{date.toLocaleTimeString()}</div>
    </>
  )
}

const TradeHistoryTable = ({
  numTrades,
  showExportPnl,
}: {
  numTrades?: number
  showExportPnl?: boolean
}) => {
  const { t } = useTranslation('common')
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const { asPath } = useRouter()
  const tradeHistory = useTradeHistory({ excludePerpLiquidations: true })
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.md : false
  const [filters, setFilters] = useState({})
  const [showFiltersModal, setShowFiltersModal] = useState(false)
  const [loadExportData, setLoadExportData] = useState(false)

  const filteredData = useFilteredData(tradeHistory, filters)

  const {
    paginatedData,
    totalPages,
    nextPage,
    previousPage,
    page,
    firstPage,
    lastPage,
    setData,
    data,
  } = usePagination(filteredData, { perPage: 100 })
  const { items, requestSort, sortConfig } = useSortableData(paginatedData)

  useEffect(() => {
    if (data?.length !== filteredData?.length) {
      setData(filteredData)
    }
  }, [filteredData])

  const renderMarketName = (trade: any) => {
    if (
      trade.marketName.includes('PERP') ||
      trade.marketName.includes('USDC')
    ) {
      const location = `/?name=${trade.marketName}`
      if (asPath.includes(location)) {
        return <span>{trade.marketName}</span>
      } else {
        return (
          <Link href={location} shallow={true}>
            <a className="text-th-fgd-1 underline hover:text-th-fgd-1 hover:no-underline">
              {trade.marketName}
            </a>
          </Link>
        )
      }
    } else {
      return <span>{trade.marketName}</span>
    }
  }

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

  const hasActiveFilter = useMemo(() => {
    return tradeHistory.length !== filteredData.length
  }, [data, filteredData])

  return (
    <>
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center">
          <h4 className="mb-0 text-th-fgd-1">
            {data.length} {data.length === 1 ? 'Trade' : 'Trades'}
          </h4>
          <Tooltip
            content={
              <div className="mr-4 text-xs text-th-fgd-3">
                {t('delay-displaying-recent')} {t('use-explorer-one')}
                <a
                  href={`https://explorer.solana.com/address/${mangoAccount.publicKey.toString()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('use-explorer-two')}
                </a>
                {t('use-explorer-three')}
              </div>
            }
          >
            <InformationCircleIcon className="ml-1.5 h-4 w-4 cursor-pointer text-th-fgd-3" />
          </Tooltip>
        </div>
        <div className="flex items-center space-x-3">
          {hasActiveFilter ? (
            <LinkButton
              className="flex items-center text-xs"
              onClick={() => setFilters({})}
            >
              <RefreshIcon className="mr-1.5 h-4 w-4" />
              Reset Filters
            </LinkButton>
          ) : null}
          {tradeHistory.length >= 15 && tradeHistory.length <= 10000 ? (
            <Button
              className="flex h-8 items-center justify-center whitespace-nowrap pt-0 pb-0 pl-3 pr-3 text-xs"
              onClick={() => setShowFiltersModal(true)}
            >
              <FilterIcon className="mr-1.5 h-4 w-4" />
              Filter
            </Button>
          ) : null}
          {canWithdraw() && showExportPnl ? (
            <Button
              className={`flex h-8 items-center justify-center whitespace-nowrap pt-0 pb-0 pl-3 pr-3 text-xs`}
              onClick={exportPerformanceDataToCSV}
            >
              {loadExportData ? (
                <Loading />
              ) : (
                <div className={`flex items-center`}>
                  <SaveIcon className={`mr-1.5 h-4 w-4`} />
                  Export PnL CSV
                </div>
              )}
            </Button>
          ) : null}
        </div>
      </div>
      <div className={`flex flex-col sm:pb-4`}>
        <div className={`overflow-x-auto sm:-mx-6 lg:-mx-8`}>
          <div
            className={`inline-block min-w-full align-middle sm:px-6 lg:px-8`}
          >
            {tradeHistory && paginatedData.length > 0 ? (
              !isMobile ? (
                <>
                  <Table>
                    <thead>
                      <TrHead>
                        <Th>
                          <LinkButton
                            className="flex items-center no-underline"
                            onClick={() => requestSort('marketName')}
                          >
                            <span className="font-normal">{t('market')}</span>
                            <ArrowSmDownIcon
                              className={`default-transition ml-1 h-4 w-4 flex-shrink-0 ${
                                sortConfig?.key === 'marketName'
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
                            className="flex items-center no-underline"
                            onClick={() => requestSort('side')}
                          >
                            <span className="font-normal">{t('side')}</span>
                            <ArrowSmDownIcon
                              className={`default-transition ml-1 h-4 w-4 flex-shrink-0 ${
                                sortConfig?.key === 'side'
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
                            className="flex items-center no-underline"
                            onClick={() => requestSort('size')}
                          >
                            <span className="font-normal">{t('size')}</span>
                            <ArrowSmDownIcon
                              className={`default-transition ml-1 h-4 w-4 flex-shrink-0 ${
                                sortConfig?.key === 'size'
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
                            className="flex items-center no-underline"
                            onClick={() => requestSort('price')}
                          >
                            <span className="font-normal">{t('price')}</span>
                            <ArrowSmDownIcon
                              className={`default-transition ml-1 h-4 w-4 flex-shrink-0 ${
                                sortConfig?.key === 'price'
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
                            className="flex items-center no-underline"
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
                            className="flex items-center no-underline"
                            onClick={() => requestSort('liquidity')}
                          >
                            <span className="font-normal">
                              {t('liquidity')}
                            </span>
                            <ArrowSmDownIcon
                              className={`default-transition ml-1 h-4 w-4 flex-shrink-0 ${
                                sortConfig?.key === 'liquidity'
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
                            className="flex items-center no-underline"
                            onClick={() => requestSort('feeCost')}
                          >
                            <span className="font-normal">{t('fee')}</span>
                            <ArrowSmDownIcon
                              className={`default-transition ml-1 h-4 w-4 flex-shrink-0 ${
                                sortConfig?.key === 'feeCost'
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
                            className="flex items-center no-underline"
                            onClick={() => requestSort('loadTimestamp')}
                          >
                            <span className="font-normal">
                              {t('approximate-time')}
                            </span>
                            <ArrowSmDownIcon
                              className={`default-transition ml-1 h-4 w-4 flex-shrink-0 ${
                                sortConfig?.key === 'loadTimestamp'
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
                      {items.map((trade: any) => {
                        return (
                          <TrBody key={`${trade.seqNum}${trade.marketName}`}>
                            <Td className="!py-2 ">
                              <div className="flex items-center">
                                <img
                                  alt=""
                                  width="20"
                                  height="20"
                                  src={`/assets/icons/${trade.marketName
                                    .split(/-|\//)[0]
                                    .toLowerCase()}.svg`}
                                  className={`mr-2.5`}
                                />
                                {renderMarketName(trade)}
                              </div>
                            </Td>
                            <Td className="!py-2 ">
                              <SideBadge side={trade.side} />
                            </Td>
                            <Td className="!py-2 ">{trade.size}</Td>
                            <Td className="!py-2 ">
                              $
                              {new Intl.NumberFormat('en-US').format(
                                trade.price
                              )}
                            </Td>
                            <Td className="!py-2 ">
                              {formatUsdValue(trade.value)}
                            </Td>
                            <Td className="!py-2 ">
                              {t(trade.liquidity.toLowerCase())}
                            </Td>
                            <Td className="!py-2 ">
                              {formatUsdValue(trade.feeCost)}
                            </Td>
                            <Td className="w-[0.1%] !py-2">
                              {trade.loadTimestamp || trade.timestamp
                                ? renderTradeDateTime(
                                    trade.loadTimestamp || trade.timestamp
                                  )
                                : t('recent')}
                            </Td>
                            <Td className="keep-break w-[0.1%] !py-2">
                              {trade.marketName.includes('PERP') ? (
                                <a
                                  className="text-xs text-th-fgd-4 underline underline-offset-4"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  href={`/account?pubkey=${
                                    trade.liquidity === 'Taker'
                                      ? trade.maker
                                      : trade.taker
                                  }`}
                                >
                                  {t('view-counterparty')}
                                </a>
                              ) : null}
                            </Td>
                          </TrBody>
                        )
                      })}
                    </tbody>
                  </Table>
                  {numTrades && items.length > numTrades ? (
                    <div className="mt-4 flex items-center justify-center">
                      <Link href="/account" shallow={true}>
                        {t('view-all-trades')}
                      </Link>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end">
                      <Pagination
                        page={page}
                        totalPages={totalPages}
                        nextPage={nextPage}
                        lastPage={lastPage}
                        firstPage={firstPage}
                        previousPage={previousPage}
                      />
                    </div>
                  )}
                </>
              ) : (
                paginatedData.map((trade: any, index) => (
                  <ExpandableRow
                    buttonTemplate={
                      <>
                        <div className="text-fgd-1 flex w-full items-center justify-between">
                          <div className="text-left">
                            {trade.loadTimestamp || trade.timestamp
                              ? renderTradeDateTime(
                                  trade.loadTimestamp || trade.timestamp
                                )
                              : t('recent')}
                          </div>
                          <div>
                            <div className="text-right">
                              <div className="mb-0.5 flex items-center text-left">
                                <img
                                  alt=""
                                  width="16"
                                  height="16"
                                  src={`/assets/icons/${trade.marketName
                                    .split(/-|\//)[0]
                                    .toLowerCase()}.svg`}
                                  className={`mr-1.5`}
                                />
                                {trade.marketName}
                              </div>
                              <div className="text-xs text-th-fgd-3">
                                <span
                                  className={`mr-1
                                ${
                                  trade.side === 'buy' || trade.side === 'long'
                                    ? 'text-th-green'
                                    : 'text-th-red'
                                }
                              `}
                                >
                                  {trade.side.toUpperCase()}
                                </span>
                                {trade.size}
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    }
                    key={`${index}`}
                    panelTemplate={
                      <div className="grid grid-flow-row grid-cols-2 gap-4">
                        <div className="text-left">
                          <div className="pb-0.5 text-xs text-th-fgd-3">
                            {t('price')}
                          </div>
                          {formatUsdValue(trade.price)}
                        </div>
                        <div className="text-left">
                          <div className="pb-0.5 text-xs text-th-fgd-3">
                            {t('value')}
                          </div>
                          {formatUsdValue(trade.value)}
                        </div>
                        <div className="text-left">
                          <div className="pb-0.5 text-xs text-th-fgd-3">
                            {t('liquidity')}
                          </div>
                          {trade.liquidity}
                        </div>
                        <div className="text-left">
                          <div className="pb-0.5 text-xs text-th-fgd-3">
                            {t('fee')}
                          </div>
                          {formatUsdValue(trade.feeCost)}
                        </div>
                      </div>
                    }
                  />
                ))
              )
            ) : hasActiveFilter ? (
              <div className="w-full rounded-md bg-th-bkg-1 py-6 text-center text-th-fgd-3">
                No trades found...
              </div>
            ) : (
              <div className="w-full rounded-md bg-th-bkg-1 py-6 text-center text-th-fgd-3">
                {t('no-history')}
                {asPath === '/account' ? (
                  <Link href={'/'} shallow={true}>
                    <a className="ml-2 inline-flex py-0">{t('make-trade')}</a>
                  </Link>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
      {showFiltersModal ? (
        <TradeHistoryFilterModal
          filters={filters}
          setFilters={setFilters}
          isOpen={showFiltersModal}
          onClose={() => setShowFiltersModal(false)}
        />
      ) : null}
    </>
  )
}

export default TradeHistoryTable
