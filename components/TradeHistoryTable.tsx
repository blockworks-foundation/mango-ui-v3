import { ArrowSmDownIcon } from '@heroicons/react/solid'
import BN from 'bn.js'
import useTradeHistory from '../hooks/useTradeHistory'
import Link from 'next/link'
import { useRouter } from 'next/router'
import SideBadge from './SideBadge'
import { LinkButton } from './Button'
import { useSortableData } from '../hooks/useSortableData'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from './TradePageGrid'
import { Table, Td, Th, TrBody, TrHead } from './TableElements'
import { ExpandableRow } from './TableElements'
import { formatUsdValue } from '../utils'
import { useTranslation } from 'next-i18next'
import Pagination from './Pagination'
import usePagination from '../hooks/usePagination'
import { useEffect } from 'react'

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

const TradeHistoryTable = ({ numTrades }: { numTrades?: number }) => {
  const { t } = useTranslation('common')
  const { asPath } = useRouter()
  const tradeHistory = useTradeHistory({ excludePerpLiquidations: true })
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.md : false

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
  } = usePagination(tradeHistory || [], { perPage: 100 })
  const { items, requestSort, sortConfig } = useSortableData(paginatedData)

  useEffect(() => {
    if (tradeHistory?.length && data?.length !== tradeHistory?.length) {
      setData(tradeHistory)
    }
  }, [tradeHistory])

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
            <a className="text-th-fgd-1 underline hover:no-underline hover:text-th-fgd-1">
              {trade.marketName}
            </a>
          </Link>
        )
      }
    } else {
      return <span>{trade.marketName}</span>
    }
  }

  return (
    <div className={`flex flex-col sm:pb-4`}>
      <div className={`overflow-x-auto sm:-mx-6 lg:-mx-8`}>
        <div className={`align-middle inline-block min-w-full sm:px-6 lg:px-8`}>
          {tradeHistory && tradeHistory.length ? (
            !isMobile ? (
              <>
                <Table>
                  <thead>
                    <TrHead>
                      <Th>
                        <LinkButton
                          className="flex items-center no-underline font-normal"
                          onClick={() => requestSort('market')}
                        >
                          {t('market')}
                          <ArrowSmDownIcon
                            className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                              sortConfig?.key === 'market'
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
                          onClick={() => requestSort('side')}
                        >
                          {t('side')}
                          <ArrowSmDownIcon
                            className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                              sortConfig?.key === 'side'
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
                          onClick={() => requestSort('size')}
                        >
                          {t('size')}
                          <ArrowSmDownIcon
                            className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                              sortConfig?.key === 'size'
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
                          onClick={() => requestSort('price')}
                        >
                          {t('price')}
                          <ArrowSmDownIcon
                            className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                              sortConfig?.key === 'price'
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
                          className="flex items-center no-underline font-normal"
                          onClick={() => requestSort('liquidity')}
                        >
                          {t('liquidity')}
                          <ArrowSmDownIcon
                            className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                              sortConfig?.key === 'liquidity'
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
                          onClick={() => requestSort('feeCost')}
                        >
                          {t('fee')}
                          <ArrowSmDownIcon
                            className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                              sortConfig?.key === 'feeCost'
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
                          onClick={() => requestSort('loadTimestamp')}
                        >
                          {t('approximate-time')}
                          <ArrowSmDownIcon
                            className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                              sortConfig?.key === 'loadTimestamp'
                                ? sortConfig.direction === 'ascending'
                                  ? 'transform rotate-180'
                                  : 'transform rotate-360'
                                : null
                            }`}
                          />
                        </LinkButton>
                      </Th>
                      <Th> </Th>
                    </TrHead>
                  </thead>
                  <tbody>
                    {paginatedData.map((trade: any) => {
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
                            {new Intl.NumberFormat('en-US').format(trade.price)}
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
                          <Td className="!py-2 w-[0.1%]">
                            {trade.loadTimestamp || trade.timestamp
                              ? renderTradeDateTime(
                                  trade.loadTimestamp || trade.timestamp
                                )
                              : t('recent')}
                          </Td>
                          <Td className="!py-2 w-[0.1%] keep-break">
                            {trade.marketName.includes('PERP') ? (
                              <a
                                className="text-th-fgd-4 underline text-xs underline-offset-4"
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
                  <div className="flex items-center justify-center mt-4">
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
                      <div className="flex items-center justify-between text-fgd-1 w-full">
                        <div className="text-left">
                          {trade.loadTimestamp || trade.timestamp
                            ? renderTradeDateTime(
                                trade.loadTimestamp || trade.timestamp
                              )
                            : t('recent')}
                        </div>
                        <div>
                          <div className="text-right">
                            <div className="flex items-center mb-0.5 text-left">
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
                            <div className="text-th-fgd-3 text-xs">
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
                  index={index}
                  panelTemplate={
                    <div className="grid grid-cols-2 grid-flow-row gap-4">
                      <div className="text-left">
                        <div className="pb-0.5 text-th-fgd-3 text-xs">
                          {t('price')}
                        </div>
                        {formatUsdValue(trade.price)}
                      </div>
                      <div className="text-left">
                        <div className="pb-0.5 text-th-fgd-3 text-xs">
                          {t('value')}
                        </div>
                        {formatUsdValue(trade.value)}
                      </div>
                      <div className="text-left">
                        <div className="pb-0.5 text-th-fgd-3 text-xs">
                          {t('liquidity')}
                        </div>
                        {trade.liquidity}
                      </div>
                      <div className="text-left">
                        <div className="pb-0.5 text-th-fgd-3 text-xs">
                          {t('fee')}
                        </div>
                        {formatUsdValue(trade.feeCost)}
                      </div>
                    </div>
                  }
                />
              ))
            )
          ) : (
            <div className="w-full text-center py-6 bg-th-bkg-1 text-th-fgd-3 rounded-md">
              {t('no-history')}
              {asPath === '/account' ? (
                <Link href={'/'} shallow={true}>
                  <a className="inline-flex ml-2 py-0">{t('make-trade')}</a>
                </Link>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TradeHistoryTable
