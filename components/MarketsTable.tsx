import { useMemo } from 'react'
import Link from 'next/link'
import { formatUsdValue, perpContractPrecision, usdFormatter } from '../utils'
import { Table, Td, Th, TrBody, TrHead } from './TableElements'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from './TradePageGrid'
import { useTranslation } from 'next-i18next'
import useMangoStore from '../stores/useMangoStore'
import MobileTableHeader from './mobile/MobileTableHeader'
import { ExpandableRow } from './TableElements'
import { FavoriteMarketButton } from './TradeNavMenu'
import { useSortableData } from '../hooks/useSortableData'
import { LinkButton } from './Button'
import { ArrowSmDownIcon } from '@heroicons/react/solid'

const MarketsTable = ({ isPerpMarket }) => {
  const { t } = useTranslation('common')
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.md : false
  const marketsInfo = useMangoStore((s) => s.marketsInfo)

  const perpMarketsInfo = useMemo(
    () =>
      marketsInfo
        .filter((mkt) => mkt?.name.includes('PERP'))
        .sort((a, b) => b.volumeUsd24h - a.volumeUsd24h),
    [marketsInfo]
  )

  const spotMarketsInfo = useMemo(
    () =>
      marketsInfo
        .filter((mkt) => mkt?.name.includes('USDC'))
        .sort((a, b) => b.volumeUsd24h - a.volumeUsd24h),
    [marketsInfo]
  )

  const { items, requestSort, sortConfig } = useSortableData(
    isPerpMarket ? perpMarketsInfo : spotMarketsInfo
  )

  return items.length > 0 ? (
    !isMobile ? (
      <Table>
        <thead>
          <TrHead>
            <Th>
              <LinkButton
                className="flex items-center font-normal no-underline"
                onClick={() => requestSort('name')}
              >
                <span className="font-normal text-th-fgd-3">{t('market')}</span>
                <ArrowSmDownIcon
                  className={`default-transition ml-1 h-4 w-4 flex-shrink-0 ${
                    sortConfig?.key === 'name'
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
                onClick={() => requestSort('last')}
              >
                <span className="font-normal text-th-fgd-3">{t('price')}</span>
                <ArrowSmDownIcon
                  className={`default-transition ml-1 h-4 w-4 flex-shrink-0 ${
                    sortConfig?.key === 'last'
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
                onClick={() => requestSort('change24h')}
              >
                <span className="font-normal text-th-fgd-3">
                  {t('rolling-change')}
                </span>
                <ArrowSmDownIcon
                  className={`default-transition ml-1 h-4 w-4 flex-shrink-0 ${
                    sortConfig?.key === 'change24h'
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
                onClick={() => requestSort('volumeUsd24h')}
              >
                <span className="font-normal text-th-fgd-3">
                  {t('daily-volume')}
                </span>
                <ArrowSmDownIcon
                  className={`default-transition ml-1 h-4 w-4 flex-shrink-0 ${
                    sortConfig?.key === 'volumeUsd24h'
                      ? sortConfig.direction === 'ascending'
                        ? 'rotate-180 transform'
                        : 'rotate-360 transform'
                      : null
                  }`}
                />
              </LinkButton>
            </Th>
            {isPerpMarket ? (
              <>
                <Th>
                  <LinkButton
                    className="flex items-center font-normal no-underline"
                    onClick={() => requestSort('funding1h')}
                  >
                    <span className="font-normal text-th-fgd-3">
                      {t('average-funding')}
                    </span>
                    <ArrowSmDownIcon
                      className={`default-transition ml-1 h-4 w-4 flex-shrink-0 ${
                        sortConfig?.key === 'funding1h'
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
                    onClick={() => requestSort('openInterestUsd')}
                  >
                    <span className="font-normal text-th-fgd-3">
                      {t('open-interest')}
                    </span>
                    <ArrowSmDownIcon
                      className={`default-transition ml-1 h-4 w-4 flex-shrink-0 ${
                        sortConfig?.key === 'openInterestUsd'
                          ? sortConfig.direction === 'ascending'
                            ? 'rotate-180 transform'
                            : 'rotate-360 transform'
                          : null
                      }`}
                    />
                  </LinkButton>
                </Th>
              </>
            ) : null}
            <Th>
              <span className="flex justify-end">{t('favorite')}</span>
            </Th>
          </TrHead>
        </thead>
        <tbody>
          {items.map((market) => {
            const {
              baseSymbol,
              change24h,
              funding1h,
              last,
              name,
              openInterest,
              openInterestUsd,
              volumeUsd24h,
            } = market
            const fundingApr = funding1h
              ? (funding1h * 24 * 365).toFixed(2)
              : '-'

            return (
              <TrBody key={name} className="hover:bg-th-bkg-3">
                <Td>
                  <Link href={`/?name=${name}`} shallow={true}>
                    <a className="hover:cursor-pointer">
                      <div className="flex h-full items-center text-th-fgd-2 hover:text-th-primary">
                        <img
                          alt=""
                          width="20"
                          height="20"
                          src={`/assets/icons/${baseSymbol.toLowerCase()}.svg`}
                          className={`mr-2.5`}
                        />
                        <span className="default-transition">{name}</span>
                      </div>
                    </a>
                  </Link>
                </Td>
                <Td>
                  {last ? (
                    formatUsdValue(last)
                  ) : (
                    <span className="text-th-fgd-4">Unavailable</span>
                  )}
                </Td>
                <Td>
                  <span
                    className={change24h >= 0 ? 'text-th-green' : 'text-th-red'}
                  >
                    {change24h || change24h === 0 ? (
                      `${(change24h * 100).toFixed(2)}%`
                    ) : (
                      <span className="text-th-fgd-4">Unavailable</span>
                    )}
                  </span>
                </Td>
                <Td>
                  {volumeUsd24h ? (
                    usdFormatter(volumeUsd24h, 0)
                  ) : (
                    <span className="text-th-fgd-4">Unavailable</span>
                  )}
                </Td>
                {isPerpMarket ? (
                  <>
                    <Td>
                      {funding1h ? (
                        <>
                          <span>{`${funding1h.toFixed(4)}%`}</span>{' '}
                          <span className="text-xs text-th-fgd-3">{`(${fundingApr}% APR)`}</span>
                        </>
                      ) : (
                        <span className="text-th-fgd-4">Unavailable</span>
                      )}
                    </Td>
                    <Td>
                      {openInterestUsd ? (
                        <>
                          <span>{usdFormatter(openInterestUsd, 0)}</span>{' '}
                          {openInterest ? (
                            <div className="text-xs text-th-fgd-4">
                              {openInterest.toLocaleString(undefined, {
                                maximumFractionDigits:
                                  perpContractPrecision[baseSymbol],
                              })}{' '}
                              {baseSymbol}
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <span className="text-th-fgd-4">Unavailable</span>
                      )}
                    </Td>
                  </>
                ) : null}
                <Td>
                  <div className="flex justify-end">
                    <FavoriteMarketButton market={market} />
                  </div>
                </Td>
              </TrBody>
            )
          })}
        </tbody>
      </Table>
    ) : (
      <div className="mb-4 border-b border-th-bkg-4">
        <MobileTableHeader
          colOneHeader={t('asset')}
          colTwoHeader={`${t('price')}/${t('rolling-change')}`}
        />
        {items.map((market, index) => {
          const {
            baseSymbol,
            change24h,
            funding1h,
            high24h,
            last,
            low24h,
            name,
            openInterest,
            volumeUsd24h,
          } = market
          const fundingApr = funding1h ? (funding1h * 24 * 365).toFixed(2) : '-'

          return (
            <ExpandableRow
              buttonTemplate={
                <div className="flex w-full items-center justify-between text-th-fgd-1">
                  <div className="flex items-center text-th-fgd-1">
                    <img
                      alt=""
                      width="20"
                      height="20"
                      src={`/assets/icons/${baseSymbol.toLowerCase()}.svg`}
                      className={`mr-2.5`}
                    />

                    {market.baseSymbol}
                  </div>
                  <div className="flex space-x-2.5 text-right text-th-fgd-1">
                    <div>{formatUsdValue(last)}</div>
                    <div className="text-th-fgd-4">|</div>
                    <div
                      className={
                        change24h >= 0 ? 'text-th-green' : 'text-th-red'
                      }
                    >
                      {change24h || change24h === 0 ? (
                        `${(change24h * 100).toFixed(2)}%`
                      ) : (
                        <span className="text-th-fgd-4">Unavailable</span>
                      )}
                    </div>
                  </div>
                </div>
              }
              key={`${name}${index}`}
              panelTemplate={
                <>
                  <div className="grid grid-flow-row grid-cols-2 gap-4 pb-4">
                    <div className="text-left">
                      <div className="pb-0.5 text-xs text-th-fgd-3">
                        {t('daily-low')}
                      </div>
                      {low24h ? (
                        formatUsdValue(low24h)
                      ) : (
                        <span className="text-th-fgd-4">Unavailable</span>
                      )}
                    </div>
                    <div className="text-left">
                      <div className="pb-0.5 text-xs text-th-fgd-3">
                        {t('daily-high')}
                      </div>
                      {high24h ? (
                        formatUsdValue(high24h)
                      ) : (
                        <span className="text-th-fgd-4">Unavailable</span>
                      )}
                    </div>
                    {isPerpMarket ? (
                      <>
                        <div className="text-left">
                          <div className="pb-0.5 text-xs text-th-fgd-3">
                            {t('daily-volume')}
                          </div>
                          {volumeUsd24h ? (
                            usdFormatter(volumeUsd24h, 0)
                          ) : (
                            <span className="text-th-fgd-4">Unavailable</span>
                          )}
                        </div>
                        <div className="text-left">
                          <div className="pb-0.5 text-xs text-th-fgd-3">
                            {t('average-funding')}
                          </div>
                          {funding1h ? (
                            `${funding1h.toLocaleString(undefined, {
                              maximumSignificantDigits: 3,
                            })}% (${fundingApr}% APR)`
                          ) : (
                            <span className="text-th-fgd-4">Unavailable</span>
                          )}
                        </div>
                        <div className="text-left">
                          <div className="pb-0.5 text-xs text-th-fgd-3">
                            {t('open-interest')}
                          </div>
                          {openInterest ? (
                            `${openInterest.toLocaleString()} ${
                              market.baseSymbol
                            }`
                          ) : (
                            <span className="text-th-fgd-4">Unavailable</span>
                          )}
                        </div>
                      </>
                    ) : null}
                  </div>
                </>
              }
            />
          )
        })}
      </div>
    )
  ) : null
}

export default MarketsTable
