import { I80F48 } from '@blockworks-foundation/mango-client'
import Chart from '../Chart'
import { tokenPrecision } from '../../utils'
import { useViewport } from '../../hooks/useViewport'
import { breakpoints } from '../TradePageGrid'
import { Table, Td, Th, TrBody, TrHead } from '../TableElements'
import { ExpandableRow, Row } from '../TableElements'

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
  const selectedStatsData = stats.filter((s) => s.name === symbol)
  const timeFilteredStats = selectedStatsData.filter(
    (d) =>
      new Date(d.time).getTime() >
      new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).getTime()
  )

  const oldestStat = timeFilteredStats[0]
  const latestStat = timeFilteredStats[timeFilteredStats.length - 1]
  const avg =
    Math.pow(latestStat[type] / oldestStat[type], 365 / daysAgo) * 100 - 100

  return avg.toFixed(4)
}

export default function StatsTotals({ latestStats, stats }) {
  console.log('latest stats', latestStats)

  const startTimestamp = 1622905200000
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false

  const trimmedStats = stats.filter(
    (stat) => new Date(stat.hourly).getTime() >= startTimestamp
  )

  // get deposit and borrow values from stats
  const depositValues = []
  const borrowValues = []

  for (let i = 0; i < trimmedStats.length; i++) {
    const depositValue =
      trimmedStats[i].name === 'USDC'
        ? trimmedStats[i].totalDeposits
        : trimmedStats[i].totalDeposits * trimmedStats[i].baseOraclePrice

    const borrowValue =
      trimmedStats[i].name === 'USDC'
        ? trimmedStats[i].totalBorrows
        : trimmedStats[i].totalBorrows * trimmedStats[i].baseOraclePrice

    depositValues.push({
      name: trimmedStats[i].name,
      value: depositValue,
      time: trimmedStats[i].hourly,
    })

    if (borrowValue) {
      borrowValues.push({
        name: trimmedStats[i].name,
        value: borrowValue,
        time: trimmedStats[i].hourly,
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
          className="border border-th-bkg-3 relative md:mb-0 p-4 rounded-md"
          style={{ height: '300px' }}
        >
          <Chart
            title="Total Deposit Value"
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
          style={{ height: '300px' }}
        >
          <Chart
            title="Total Borrow Value"
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
            <div className="pb-4 text-th-fgd-1 text-lg">Current Stats</div>
            {latestStats.length > 0 ? (
              <Table>
                <thead>
                  <TrHead>
                    <Th>Asset</Th>
                    <Th>Total Deposits</Th>
                    <Th>Total Borrows</Th>
                    <Th>Deposit Rate</Th>
                    <Th>Borrow Rate</Th>
                    <Th>Utilization</Th>
                  </TrHead>
                </thead>
                <tbody>
                  {latestStats.map((stat, index) => (
                    <TrBody key={stat.name} index={index}>
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
              Average Deposit Rates
            </div>
            {stats.length > 1 ? (
              <Table>
                <thead>
                  <TrHead>
                    <Th>Asset</Th>
                    <Th>24h</Th>
                    <Th>7d</Th>
                    <Th>30d</Th>
                  </TrHead>
                </thead>
                <tbody>
                  {latestStats.map((stat, index) => (
                    <TrBody key={stat.name} index={index}>
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
                        {getAverageStats(stats, 1, stat.name, 'depositIndex')}%
                      </Td>
                      <Td>
                        {getAverageStats(stats, 7, stat.name, 'depositIndex')}%
                      </Td>
                      <Td>
                        {getAverageStats(stats, 30, stat.name, 'depositIndex')}%
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
          <div className="pb-4 text-th-fgd-1 text-lg">Average Borrow Rates</div>
          {stats.length > 1 ? (
            <Table>
              <thead>
                <TrHead>
                  <Th>Asset</Th>
                  <Th>24h</Th>
                  <Th>7d</Th>
                  <Th>30d</Th>
                </TrHead>
              </thead>
              <tbody>
                {latestStats.map((stat, index) => (
                  <TrBody key={stat.name} index={index}>
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
                      {getAverageStats(stats, 1, stat.name, 'borrowIndex')}%
                    </Td>
                    <Td>
                      {getAverageStats(stats, 7, stat.name, 'borrowIndex')}%
                    </Td>
                    <Td>
                      {getAverageStats(stats, 30, stat.name, 'borrowIndex')}%
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
            <div className="pb-4 text-th-fgd-1 text-lg">Current Stats</div>
            {latestStats.map((stat, index) => (
              // latestStats.length > 0 ? (
              <ExpandableRow
                buttonTemplate={
                  <div className="col-span-11">
                    <div className="col-span-11 flex items-center pb-4 text-fgd-1">
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
                    <div className="grid grid-cols-11 grid-rows-1 gap-4">
                      <div className="col-span-6 text-left">
                        <div className="pb-0.5 text-th-fgd-3 text-xs">
                          Total Deposits
                        </div>
                        {formatNumberString(stat.totalDeposits, 0)}
                      </div>
                      <div className="col-span-5 text-left">
                        <div className="pb-0.5 text-th-fgd-3 text-xs">
                          Total Borrows
                        </div>
                        {formatNumberString(stat.totalBorrows, 0)}
                      </div>
                    </div>
                  </div>
                }
                key={stat.name}
                index={index}
                panelTemplate={
                  <>
                    <div className="col-span-1 text-left">
                      <div className="pb-0.5 text-th-fgd-3 text-xs">
                        Deposit Rate
                      </div>
                      <span className="text-th-green">
                        {formatNumberString(stat.depositInterest.toNumber(), 2)}
                        %
                      </span>
                    </div>
                    <div className="col-span-1 text-left">
                      <div className="pb-0.5 text-th-fgd-3 text-xs">
                        Borrow Rate
                      </div>
                      <span className="text-th-red">
                        {formatNumberString(stat.borrowInterest.toNumber(), 2)}%
                      </span>
                    </div>
                    <div className="col-span-1 text-left">
                      <div className="pb-0.5 text-th-fgd-3 text-xs">
                        Utilization
                      </div>
                      {formatNumberString(
                        stat.utilization.mul(I80F48.fromNumber(100)).toNumber(),
                        2
                      )}
                      %
                    </div>
                  </>
                }
              />
            ))}
          </div>
          <div className="pb-8">
            <div className="pb-4 text-th-fgd-1 text-lg">
              Average Deposit Rates
            </div>
            {latestStats.map((stat, index) => (
              // stats.length > 1 ? (
              <Row key={stat.name} index={index}>
                <div className="col-span-12">
                  <div className="col-span-12 flex items-center pb-4 text-fgd-1">
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
                  <div className="grid grid-cols-12 grid-rows-1 gap-4">
                    <div className="col-span-4 text-left">
                      <div className="pb-0.5 text-th-fgd-3 text-xs">24h</div>
                      {getAverageStats(
                        stats,
                        dailyStartTime,
                        stat.name,
                        'depositRate'
                      )}
                      %
                    </div>
                    <div className="col-span-4 text-left">
                      <div className="pb-0.5 text-th-fgd-3 text-xs">7d</div>
                      {getAverageStats(
                        stats,
                        weeklyStartTime,
                        stat.name,
                        'depositRate'
                      )}
                      %
                    </div>
                    <div className="col-span-4 text-left">
                      <div className="pb-0.5 text-th-fgd-3 text-xs">30d</div>
                      {getAverageStats(
                        stats,
                        monthlyStartTime,
                        stat.name,
                        'depositRate'
                      )}
                      %
                    </div>
                  </div>
                </div>
              </Row>
            ))}
          </div>
          <div className="pb-4 text-th-fgd-1 text-lg">Average Borrow Rates</div>
          {latestStats.map((stat, index) => (
            // stats.length > 1 ? (
            <Row key={stat.name} index={index}>
              <div className="col-span-12">
                <div className="col-span-12 flex items-center pb-4 text-fgd-1">
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
                <div className="grid grid-cols-12 grid-rows-1 gap-4">
                  <div className="col-span-4 text-left">
                    <div className="pb-0.5 text-th-fgd-3 text-xs">24h</div>
                    {getAverageStats(
                      stats,
                      dailyStartTime,
                      stat.name,
                      'borrowRate'
                    )}
                    %
                  </div>
                  <div className="col-span-4 text-left">
                    <div className="pb-0.5 text-th-fgd-3 text-xs">7d</div>
                    {getAverageStats(
                      stats,
                      weeklyStartTime,
                      stat.name,
                      'borrowRate'
                    )}
                    %
                  </div>
                  <div className="col-span-4 text-left">
                    <div className="pb-0.5 text-th-fgd-3 text-xs">30d</div>
                    {getAverageStats(
                      stats,
                      monthlyStartTime,
                      stat.name,
                      'borrowRate'
                    )}
                    %
                  </div>
                </div>
              </div>
            </Row>
          ))}
        </>
      )}
    </>
  )
}
