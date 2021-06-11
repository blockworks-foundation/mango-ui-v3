import { Table, Thead, Tbody, Tr, Th, Td } from 'react-super-responsive-table'
import { formatBalanceDisplay, tokenPrecision } from '../../utils/index'
import useMangoStore from '../../stores/useMangoStore'
import useMangoStats from '../../hooks/useMangoStats'
import useMarketList from '../../hooks/useMarketList'
import Chart from '../Chart'

const icons = {
  BTC: '/assets/icons/btc.svg',
  ETH: '/assets/icons/eth.svg',
  SOL: '/assets/icons/sol.svg',
  SRM: '/assets/icons/srm.svg',
  USDT: '/assets/icons/usdt.svg',
  USDC: '/assets/icons/usdc.svg',
  WUSDT: '/assets/icons/usdt.svg',
}

export default function StatsTotals() {
  const { latestStats, stats } = useMangoStats()
  const { getTokenIndex, symbols } = useMarketList()
  const prices = useMangoStore((s) => s.selectedMangoGroup.prices)

  // get deposit and borrow values from stats
  let depositValues = []
  let borrowValues = []
  for (let i = 0; i < stats.length; i++) {
    depositValues.push({
      symbol: stats[i].symbol,
      value:
        stats[i].totalDeposits *
        prices[getTokenIndex(symbols[stats[i].symbol])],
      time: stats[i].hourly,
    })
    borrowValues.push({
      symbol: stats[i].symbol,
      value:
        stats[i].totalBorrows * prices[getTokenIndex(symbols[stats[i].symbol])],
      time: stats[i].hourly,
    })
  }

  const formatValues = (values) => {
    // get value for each symbol every hour
    const hours = values.reduce((acc, d) => {
      const found = acc.find((a) => a.time === d.time && a.symbol === d.symbol)
      const value = {
        value: d.value,
        symbol: d.symbol,
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
    let holder = {}

    hours.forEach(function (d) {
      if (holder.hasOwnProperty(d.time)) {
        holder[d.time] = holder[d.time] + d.value
      } else {
        holder[d.time] = d.value
      }
    })

    let points = []

    for (let prop in holder) {
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
            labelFormat={(x) => x && '$' + x.toLocaleString()}
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
            labelFormat={(x) => x && '$' + x.toLocaleString()}
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
                key={stat.symbol}
                className={`border-b border-th-bkg-2
                  ${index % 2 === 0 ? `bg-th-bkg-3` : `bg-th-bkg-2`}
                `}
              >
                <Td className="px-6 py-4 whitespace-nowrap text-sm text-th-fgd-1">
                  <div className="flex items-center">
                    <img
                      src={icons[stat.symbol]}
                      alt={icons[stat.symbol]}
                      width="20"
                      height="20"
                      className="mr-2.5"
                    />
                    {stat.symbol}
                  </div>
                </Td>
                <Td className="px-6 py-4 whitespace-nowrap text-sm text-th-fgd-1">
                  {formatBalanceDisplay(
                    stat.totalDeposits,
                    tokenPrecision[stat.symbol]
                  ).toLocaleString(undefined, {
                    maximumFractionDigits: tokenPrecision[stat.symbol],
                  })}
                </Td>
                <Td className="px-6 py-4 whitespace-nowrap text-sm text-th-fgd-1">
                  {formatBalanceDisplay(
                    stat.totalBorrows,
                    tokenPrecision[stat.symbol]
                  ).toLocaleString(undefined, {
                    maximumFractionDigits: tokenPrecision[stat.symbol],
                  })}
                </Td>
                <Td className="px-6 py-4 whitespace-nowrap text-sm text-th-fgd-1">
                  {stat.depositInterest.toFixed(2)}%
                </Td>
                <Td className="px-6 py-4 whitespace-nowrap text-sm text-th-fgd-1">
                  {stat.borrowInterest.toFixed(2)}%
                </Td>
                <Td className="px-6 py-4 whitespace-nowrap text-sm text-th-fgd-1">
                  {(parseFloat(stat.utilization) * 100).toFixed(2)}%
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </div>
    </>
  )
}
