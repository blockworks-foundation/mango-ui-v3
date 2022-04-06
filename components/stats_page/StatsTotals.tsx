import { I80F48 } from '@blockworks-foundation/mango-client'
import Chart from '../Chart'
import { tokenPrecision } from '../../utils'
import { useViewport } from '../../hooks/useViewport'
import { breakpoints } from '../TradePageGrid'
import { Table, Td, Th, TrBody, TrHead } from '../TableElements'
import { ExpandableRow, Row } from '../TableElements'
import { useTranslation } from 'next-i18next'

interface Values {
  name: string
  value: number
  time: string
}

interface Points {
  value: number
  time: string
}

function formatNumberString(x: number, decimals): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(x)
}

const getAverageStats = (
  stats: any[],
  daysAgo: number,
  symbol: string,
  type: string
): string => {
  if (stats?.length) {
    const priorDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
    const selectedStatsData = stats.filter((s) => s.name === symbol)
    const timeFilteredStats = selectedStatsData.filter(
      (d) => new Date(d.time).getTime() >= priorDate.getTime()
    )

    const oldestStat = timeFilteredStats[0]
    const latestStat = timeFilteredStats[timeFilteredStats.length - 1]
    const avg =
      Math.pow(latestStat[type] / oldestStat[type], 365 / daysAgo) * 100 - 100

    priorDate.setHours(priorDate.getHours() + 1)

    if (new Date(oldestStat.hourly).getDate() > priorDate.getDate()) {
      return '-'
    } else {
      return `${avg.toFixed(4)}%`
    }
  }
  return '-'
}

export default function StatsTotals({ latestStats, stats }) {
  const { t } = useTranslation('common')
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false

  // get deposit and borrow values from stats
  const depositValues: Values[] = []
  const borrowValues: Values[] = []

  for (let i = 0; i < stats.length; i++) {
    const time = stats[i].hourly
    const name = stats[i].name
    const depositValue =
      stats[i].name === 'USDC'
        ? stats[i].totalDeposits
        : stats[i].totalDeposits * stats[i].baseOraclePrice

    const borrowValue =
      stats[i].name === 'USDC'
        ? stats[i].totalBorrows
        : stats[i].totalBorrows * stats[i].baseOraclePrice

    if (typeof depositValue === 'number' && name && time) {
      depositValues.push({
        name,
        value: depositValue,
        time,
      })
    }

    if (typeof borrowValue === 'number' && name && time) {
      borrowValues.push({
        name,
        value: borrowValue,
        time,
      })
    }
  }

  const formatValues = (values) => {
    // get value for each symbol every hour
    const hours = values.reduce((acc, d) => {
      const found = acc.find((a) => a.time === d.time && a.name === d.name)
      const value = {
        value: d.value,
        name: d.name,
        time: d.time,
      }
      if (!found) {
        acc.push(value)
      } else {
        found.value = d.value
      }
      return acc
    }, [])

    // sum the values for each hour
    const holder = {}

    hours.forEach(function (d) {
      if (d.time in holder) {
        holder[d.time] = holder[d.time] + d.value
      } else {
        holder[d.time] = d.value
      }
    })

    const points: Points[] = []

    for (const prop in holder) {
      points.push({ time: prop, value: holder[prop] })
    }
    return points
  }

  return (
    <>
      <div className="grid grid-flow-col grid-cols-1 grid-rows-2 gap-2 pb-8 sm:gap-4 md:grid-cols-2 md:grid-rows-1">
        <div
          className="relative h-56 rounded-md border border-th-bkg-3 p-4 md:mb-0"
          style={{ height: '330px' }}
        >
          <Chart
            title={t('total-deposit-value')}
            xAxis="time"
            yAxis="value"
            data={formatValues(depositValues)}
            labelFormat={(x) =>
              x &&
              '$' + x.toLocaleString(undefined, { maximumFractionDigits: 0 })
            }
            type="area"
          />
        </div>
        <div
          className="relative rounded-md border border-th-bkg-3 p-4"
          style={{ height: '330px' }}
        >
          <Chart
            title={t('total-borrow-value')}
            xAxis="time"
            yAxis="value"
            data={formatValues(borrowValues)}
            labelFormat={(x) =>
              x &&
              '$' + x.toLocaleString(undefined, { maximumFractionDigits: 0 })
            }
            type="area"
          />
        </div>
      </div>
      {!isMobile ? (
        <>
          <div className="pb-8">
            <h2 className="mb-4">{t('current-stats')}</h2>
            {latestStats.length > 0 ? (
              <Table>
                <thead>
                  <TrHead>
                    <Th>{t('asset')}</Th>
                    <Th>{t('total-deposits')}</Th>
                    <Th>{t('total-borrows')}</Th>
                    <Th>{t('deposit-rate')}</Th>
                    <Th>{t('borrow-rate')}</Th>
                    <Th>{t('utilization')}</Th>
                  </TrHead>
                </thead>
                <tbody>
                  {latestStats.map((stat) => (
                    <TrBody key={stat.name}>
                      <Td>
                        <div className="flex items-center">
                          <img
                            alt=""
                            width="20"
                            height="20"
                            src={`/assets/icons/${stat.name.toLowerCase()}.svg`}
                            className={`mr-2.5`}
                          />
                          {stat.name}
                        </div>
                      </Td>
                      <Td>
                        {formatNumberString(
                          stat.totalDeposits,
                          tokenPrecision[stat.name]
                        )}
                      </Td>
                      <Td>
                        {formatNumberString(
                          stat.totalBorrows,
                          tokenPrecision[stat.name]
                        )}
                      </Td>
                      <Td>
                        <span className="text-th-green">
                          {formatNumberString(
                            stat.depositInterest.toNumber(),
                            2
                          )}
                          %
                        </span>
                      </Td>
                      <Td>
                        <span className="text-th-red">
                          {formatNumberString(
                            stat.borrowInterest.toNumber(),
                            2
                          )}
                          %
                        </span>
                      </Td>
                      <Td>
                        {formatNumberString(
                          stat.utilization
                            .mul(I80F48.fromNumber(100))
                            .toNumber(),
                          2
                        )}
                        %
                      </Td>
                    </TrBody>
                  ))}
                </tbody>
              </Table>
            ) : (
              <>
                <div className="h-8 w-full animate-pulse rounded bg-th-bkg-3" />
                <div className="mt-1 h-8 w-full animate-pulse rounded bg-th-bkg-3" />
                <div className="mt-1 h-8 w-full animate-pulse rounded bg-th-bkg-3" />
              </>
            )}
          </div>
          <div className="pb-8">
            <h2 className="mb-4">{t('average-deposit')}</h2>
            {stats.length > 1 ? (
              <Table>
                <thead>
                  <TrHead>
                    <Th>{t('asset')}</Th>
                    <Th>24h</Th>
                    <Th>7d</Th>
                    <Th>30d</Th>
                  </TrHead>
                </thead>
                <tbody>
                  {latestStats.map((stat) => (
                    <TrBody key={stat.name}>
                      <Td>
                        <div className="flex items-center">
                          <img
                            alt=""
                            width="20"
                            height="20"
                            src={`/assets/icons/${stat.name.toLowerCase()}.svg`}
                            className={`mr-2.5`}
                          />
                          {stat.name}
                        </div>
                      </Td>
                      <Td>
                        {getAverageStats(stats, 1, stat.name, 'depositIndex')}
                      </Td>
                      <Td>
                        {getAverageStats(stats, 7, stat.name, 'depositIndex')}
                      </Td>
                      <Td>
                        {getAverageStats(stats, 30, stat.name, 'depositIndex')}
                      </Td>
                    </TrBody>
                  ))}
                </tbody>
              </Table>
            ) : (
              <>
                <div className="h-8 w-full animate-pulse rounded bg-th-bkg-3" />
                <div className="mt-1 h-8 w-full animate-pulse rounded bg-th-bkg-3" />
                <div className="mt-1 h-8 w-full animate-pulse rounded bg-th-bkg-3" />
              </>
            )}
          </div>
          <h2 className="mb-4">{t('average-borrow')}</h2>
          {stats.length > 1 ? (
            <Table>
              <thead>
                <TrHead>
                  <Th>{t('asset')}</Th>
                  <Th>24h</Th>
                  <Th>7d</Th>
                  <Th>30d</Th>
                </TrHead>
              </thead>
              <tbody>
                {latestStats.map((stat) => (
                  <TrBody key={stat.name}>
                    <Td>
                      <div className="flex items-center">
                        <img
                          alt=""
                          width="20"
                          height="20"
                          src={`/assets/icons/${stat.name.toLowerCase()}.svg`}
                          className={`mr-2.5`}
                        />
                        {stat.name}
                      </div>
                    </Td>
                    <Td>
                      {getAverageStats(stats, 1, stat.name, 'borrowIndex')}
                    </Td>
                    <Td>
                      {getAverageStats(stats, 7, stat.name, 'borrowIndex')}
                    </Td>
                    <Td>
                      {getAverageStats(stats, 30, stat.name, 'borrowIndex')}
                    </Td>
                  </TrBody>
                ))}
              </tbody>
            </Table>
          ) : (
            <>
              <div className="h-8 w-full animate-pulse rounded bg-th-bkg-3" />
              <div className="mt-1 h-8 w-full animate-pulse rounded bg-th-bkg-3" />
              <div className="mt-1 h-8 w-full animate-pulse rounded bg-th-bkg-3" />
            </>
          )}
        </>
      ) : (
        <>
          <div className="mb-8 border-b border-th-bkg-4">
            <h2 className="mb-4">{t('current-stats')}</h2>
            {latestStats.map((stat) => (
              <ExpandableRow
                buttonTemplate={
                  <div className="grid w-full grid-cols-12 grid-rows-2  text-left sm:grid-rows-1 sm:text-right">
                    <div className="text-fgd-1 col-span-12 sm:col-span-6">
                      <div className="flex items-center">
                        <img
                          alt=""
                          width="20"
                          height="20"
                          src={`/assets/icons/${stat.name
                            .split(/-|\//)[0]
                            .toLowerCase()}.svg`}
                          className={`mr-2.5`}
                        />
                        {stat.name}
                      </div>
                    </div>
                    <div className="col-span-6 sm:col-span-3">
                      <div className="pb-0.5 text-xs text-th-fgd-3">
                        {t('total-deposits')}
                      </div>
                      {formatNumberString(stat.totalDeposits, 0)}
                    </div>
                    <div className="col-span-6 sm:col-span-3">
                      <div className="pb-0.5 text-xs text-th-fgd-3">
                        {t('total-borrows')}
                      </div>
                      {formatNumberString(stat.totalBorrows, 0)}
                    </div>
                  </div>
                }
                key={stat.name}
                panelTemplate={
                  <div className="grid grid-flow-row grid-cols-2 gap-4">
                    <div className="text-left">
                      <div className="pb-0.5 text-xs text-th-fgd-3">
                        {t('deposit-rate')}
                      </div>
                      <span className="text-th-green">
                        {formatNumberString(stat.depositInterest.toNumber(), 2)}
                        %
                      </span>
                    </div>
                    <div className="text-left">
                      <div className="pb-0.5 text-xs text-th-fgd-3">
                        {t('borrow-rate')}
                      </div>
                      <span className="text-th-red">
                        {formatNumberString(stat.borrowInterest.toNumber(), 2)}%
                      </span>
                    </div>
                    <div className="text-left">
                      <div className="pb-0.5 text-xs text-th-fgd-3">
                        {t('utilization')}
                      </div>
                      {formatNumberString(
                        stat.utilization.mul(I80F48.fromNumber(100)).toNumber(),
                        2
                      )}
                      %
                    </div>
                  </div>
                }
              />
            ))}
          </div>
          <div className="mb-8 border-b border-th-bkg-4">
            <h2 className="mb-4">{t('average-deposit')}</h2>
            {stats.length > 1
              ? latestStats.map((stat) => (
                  <Row key={stat.name}>
                    <div className="grid grid-cols-12 grid-rows-2 text-left sm:grid-rows-1 sm:text-right">
                      <div className="text-fgd-1 col-span-12 sm:col-span-3">
                        <div className="flex items-center">
                          <img
                            alt=""
                            width="20"
                            height="20"
                            src={`/assets/icons/${stat.name
                              .split(/-|\//)[0]
                              .toLowerCase()}.svg`}
                            className={`mr-2.5`}
                          />
                          {stat.name}
                        </div>
                      </div>
                      <div className="col-span-4 sm:col-span-3">
                        <div className="pb-0.5 text-xs text-th-fgd-3">24h</div>
                        {getAverageStats(stats, 1, stat.name, 'depositIndex')}
                      </div>
                      <div className="col-span-4 sm:col-span-3">
                        <div className="pb-0.5 text-xs text-th-fgd-3">7d</div>
                        {getAverageStats(stats, 7, stat.name, 'depositIndex')}
                      </div>
                      <div className="col-span-4 sm:col-span-3">
                        <div className="pb-0.5 text-xs text-th-fgd-3">30d</div>
                        {getAverageStats(stats, 30, stat.name, 'depositIndex')}
                      </div>
                    </div>
                  </Row>
                ))
              : null}
          </div>
          <div className="mb-4 border-b border-th-bkg-4">
            <h2 className="mb-4">{t('average-borrow')}</h2>
            {stats.length > 1
              ? latestStats.map((stat) => (
                  <Row key={stat.name}>
                    <div className="grid grid-cols-12 grid-rows-2 gap-2 text-left sm:grid-rows-1 sm:text-right">
                      <div className="text-fgd-1 col-span-12 flex items-center sm:col-span-3">
                        <div className="flex items-center">
                          <img
                            alt=""
                            width="20"
                            height="20"
                            src={`/assets/icons/${stat.name
                              .split(/-|\//)[0]
                              .toLowerCase()}.svg`}
                            className={`mr-2.5`}
                          />
                          {stat.name}
                        </div>
                      </div>
                      <div className="col-span-4 sm:col-span-3">
                        <div className="pb-0.5 text-xs text-th-fgd-3">24h</div>
                        {getAverageStats(stats, 1, stat.name, 'borrowIndex')}
                      </div>
                      <div className="col-span-4 sm:col-span-3">
                        <div className="pb-0.5 text-xs text-th-fgd-3">7d</div>
                        {getAverageStats(stats, 7, stat.name, 'borrowIndex')}
                      </div>
                      <div className="col-span-4 sm:col-span-3">
                        <div className="pb-0.5 text-xs text-th-fgd-3">30d</div>
                        {getAverageStats(stats, 30, stat.name, 'borrowIndex')}
                      </div>
                    </div>
                  </Row>
                ))
              : null}
          </div>
        </>
      )}
    </>
  )
}
