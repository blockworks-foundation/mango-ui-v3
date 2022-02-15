import { I80F48 } from '@blockworks-foundation/mango-client'
import Chart from '../Chart'
import { tokenPrecision } from '../../utils'
import { useViewport } from '../../hooks/useViewport'
import { breakpoints } from '../TradePageGrid'
import { Table, Td, Th, TrBody, TrHead } from '../TableElements'
import { ExpandableRow, Row } from '../TableElements'
import { useTranslation } from 'next-i18next'

function formatNumberString(x: number, decimals): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(x)
}

const getAverageStats = (
  stats,
  daysAgo: number,
  symbol: string,
  type: string
) => {
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

export default function StatsTotals({ latestStats, stats }) {
  const { t } = useTranslation('common')
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false

  // get deposit and borrow values from stats
  const depositValues = []
  const borrowValues = []

  for (let i = 0; i < stats.length; i++) {
    const depositValue =
      stats[i].name === 'USDC'
        ? stats[i].totalDeposits
        : stats[i].totalDeposits * stats[i].baseOraclePrice

    const borrowValue =
      stats[i].name === 'USDC'
        ? stats[i].totalBorrows
        : stats[i].totalBorrows * stats[i].baseOraclePrice

    if (depositValue) {
      depositValues.push({
        name: stats[i].name,
        value: depositValue,
        time: stats[i].hourly,
      })
    }

    if (borrowValue) {
      borrowValues.push({
        name: stats[i].name,
        value: borrowValue,
        time: stats[i].hourly,
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

    const points = []

    for (const prop in holder) {
      points.push({ time: prop, value: holder[prop] })
    }
    return points
  }

  return (
    <>
      <div className="grid grid-flow-col grid-cols-1 grid-rows-2 md:grid-cols-2 md:grid-rows-1 gap-2 sm:gap-4 pb-8">
        <div
          className="border border-th-bkg-3 h-56 relative md:mb-0 p-4 rounded-md"
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
          className="border border-th-bkg-3 relative p-4 rounded-md"
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
            <div className="pb-4 text-th-fgd-1 text-lg">
              {t('current-stats')}
            </div>
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
                <div className="animate-pulse bg-th-bkg-3 h-8 rounded w-full" />
                <div className="animate-pulse bg-th-bkg-3 h-8 mt-1 rounded w-full" />
                <div className="animate-pulse bg-th-bkg-3 h-8 mt-1 rounded w-full" />
              </>
            )}
          </div>
          <div className="pb-8">
            <div className="pb-4 text-th-fgd-1 text-lg">
              {t('average-deposit')}
            </div>
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
                <div className="animate-pulse bg-th-bkg-3 h-8 rounded w-full" />
                <div className="animate-pulse bg-th-bkg-3 h-8 mt-1 rounded w-full" />
                <div className="animate-pulse bg-th-bkg-3 h-8 mt-1 rounded w-full" />
              </>
            )}
          </div>
          <div className="pb-4 text-th-fgd-1 text-lg">
            {t('average-borrow')}
          </div>
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
              <div className="animate-pulse bg-th-bkg-3 h-8 rounded w-full" />
              <div className="animate-pulse bg-th-bkg-3 h-8 mt-1 rounded w-full" />
              <div className="animate-pulse bg-th-bkg-3 h-8 mt-1 rounded w-full" />
            </>
          )}
        </>
      ) : (
        <>
          <div className="pb-8">
            <div className="pb-4 text-th-fgd-1 text-lg">
              {t('current-stats')}
            </div>
            {latestStats.map((stat, index) => (
              // latestStats.length > 0 ? (
              <ExpandableRow
                buttonTemplate={
                  <div className="grid grid-cols-12 grid-rows-2 sm:grid-rows-1 gap-2 text-left sm:text-right w-full">
                    <div className="col-span-12 sm:col-span-6 flex items-center text-fgd-1">
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
                      <div className="pb-0.5 text-th-fgd-3 text-xs">
                        {t('total-deposits')}
                      </div>
                      {formatNumberString(stat.totalDeposits, 0)}
                    </div>
                    <div className="col-span-6 sm:col-span-3">
                      <div className="pb-0.5 text-th-fgd-3 text-xs">
                        {t('total-borrows')}
                      </div>
                      {formatNumberString(stat.totalBorrows, 0)}
                    </div>
                  </div>
                }
                key={stat.name}
                index={index}
                panelTemplate={
                  <div className="grid grid-cols-2 grid-flow-row gap-4">
                    <div className="text-left">
                      <div className="pb-0.5 text-th-fgd-3 text-xs">
                        {t('deposit-rate')}
                      </div>
                      <span className="text-th-green">
                        {formatNumberString(stat.depositInterest.toNumber(), 2)}
                        %
                      </span>
                    </div>
                    <div className="text-left">
                      <div className="pb-0.5 text-th-fgd-3 text-xs">
                        {t('borrow-rate')}
                      </div>
                      <span className="text-th-red">
                        {formatNumberString(stat.borrowInterest.toNumber(), 2)}%
                      </span>
                    </div>
                    <div className="text-left">
                      <div className="pb-0.5 text-th-fgd-3 text-xs">
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
          <div className="pb-8">
            <div className="pb-4 text-th-fgd-1 text-lg">
              {t('average-deposit')}
            </div>
            {stats.length > 1
              ? latestStats.map((stat, index) => (
                  <Row key={stat.name} index={index}>
                    <div className="grid grid-cols-12 grid-rows-2 sm:grid-rows-1 gap-2 text-left sm:text-right">
                      <div className="col-span-12 sm:col-span-3 flex items-center text-fgd-1">
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
                        <div className="pb-0.5 text-th-fgd-3 text-xs">24h</div>
                        {getAverageStats(stats, 1, stat.name, 'depositIndex')}
                      </div>
                      <div className="col-span-4 sm:col-span-3">
                        <div className="pb-0.5 text-th-fgd-3 text-xs">7d</div>
                        {getAverageStats(stats, 7, stat.name, 'depositIndex')}
                      </div>
                      <div className="col-span-4 sm:col-span-3">
                        <div className="pb-0.5 text-th-fgd-3 text-xs">30d</div>
                        {getAverageStats(stats, 30, stat.name, 'depositIndex')}
                      </div>
                    </div>
                  </Row>
                ))
              : null}
          </div>
          <div className="pb-4 text-th-fgd-1 text-lg">
            {t('average-borrow')}
          </div>
          {stats.length > 1
            ? latestStats.map((stat, index) => (
                <Row key={stat.name} index={index}>
                  <div className="grid grid-cols-12 grid-rows-2 sm:grid-rows-1 gap-2 text-left sm:text-right">
                    <div className="col-span-12 sm:col-span-3 flex items-center text-fgd-1">
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
                      <div className="pb-0.5 text-th-fgd-3 text-xs">24h</div>
                      {getAverageStats(stats, 1, stat.name, 'borrowIndex')}
                    </div>
                    <div className="col-span-4 sm:col-span-3">
                      <div className="pb-0.5 text-th-fgd-3 text-xs">7d</div>
                      {getAverageStats(stats, 7, stat.name, 'borrowIndex')}
                    </div>
                    <div className="col-span-4 sm:col-span-3">
                      <div className="pb-0.5 text-th-fgd-3 text-xs">30d</div>
                      {getAverageStats(stats, 30, stat.name, 'borrowIndex')}
                    </div>
                  </div>
                </Row>
              ))
            : null}
        </>
      )}
    </>
  )
}
