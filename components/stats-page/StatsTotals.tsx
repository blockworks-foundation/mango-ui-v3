import { Table, Thead, Tbody, Tr, Th, Td } from 'react-super-responsive-table'
import { I80F48 } from '@blockworks-foundation/mango-client'
import Chart from '../Chart'

function formatNumberString(x: string): string {
  return x.replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',')
}

export default function StatsTotals({ latestStats, stats }) {
  const startTimestamp = 1622905200000

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
      <div className="grid grid-flow-col grid-cols-1 grid-rows-2 md:grid-cols-2 md:grid-rows-1 gap-4 pb-8">
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
      <div className="md:flex md:flex-col min-w-full">
        <Table className="min-w-full divide-y divide-th-bkg-2">
          <Thead>
            <Tr className="text-th-fgd-3 text-xs">
              <Th scope="col" className="px-6 py-3 text-left font-normal">
                Asset
              </Th>
              <Th scope="col" className="px-6 py-3 text-left font-normal">
                Total Deposits
              </Th>
              <Th scope="col" className="px-6 py-3 text-left font-normal">
                Total Borrows
              </Th>
              <Th scope="col" className="px-6 py-3 text-left font-normal">
                Deposit Interest
              </Th>
              <Th scope="col" className="px-6 py-3 text-left font-normal">
                Borrow Interest
              </Th>
              <Th scope="col" className="px-6 py-3 text-left font-normal">
                Utilization
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {latestStats.map((stat, index) => (
              <Tr
                key={stat.name}
                className={`border-b border-th-bkg-2
                  ${index % 2 === 0 ? `bg-th-bkg-3` : `bg-th-bkg-2`}
                `}
              >
                <Td className="px-6 py-4 whitespace-nowrap text-sm text-th-fgd-1">
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
                <Td className="px-6 py-4 whitespace-nowrap text-sm text-th-fgd-1">
                  {formatNumberString(stat.totalDeposits)}
                </Td>
                <Td className="px-6 py-4 whitespace-nowrap text-sm text-th-fgd-1">
                  {formatNumberString(stat.totalBorrows)}
                </Td>
                <Td className="px-6 py-4 whitespace-nowrap text-sm text-th-fgd-1">
                  {formatNumberString(stat.depositInterest.toFixed(2))}%
                </Td>
                <Td className="px-6 py-4 whitespace-nowrap text-sm text-th-fgd-1">
                  {formatNumberString(stat.borrowInterest.toFixed(2))}%
                </Td>
                <Td className="px-6 py-4 whitespace-nowrap text-sm text-th-fgd-1">
                  {formatNumberString(
                    stat.utilization.mul(I80F48.fromNumber(100)).toFixed(2)
                  )}
                  %
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </div>
    </>
  )
}
