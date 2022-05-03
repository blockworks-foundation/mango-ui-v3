import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import isEmpty from 'lodash/isEmpty'
import { useTranslation } from 'next-i18next'
import { LineChart, XAxis, YAxis, Line, Tooltip, Legend } from 'recharts'
import { SaveIcon } from '@heroicons/react/outline'

import useMangoStore from '../../stores/useMangoStore'
import { numberCompactFormatter } from '../../utils/'
import ButtonGroup from '../ButtonGroup'
import { numberCompacter } from '../SwapTokenInfo'
import { exportDataToCSV } from '../../utils/export'
import Button from '../Button'

const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

export const handleDustTicks = (v) => {
  return v < 0.000001
    ? v === 0
      ? 0
      : v.toExponential()
    : numberCompactFormatter.format(v)
}

// Each line added to the graph will use one of these colors in sequence
// TODO: These colors are not great
const COLORS = [
  'maroon',
  'red',
  'purple',
  'fuchsia',
  'green',
  'lime',
  'olive',
  'yellow',
  'navy',
  'blue',
  'teal',
  'aqua',
  'chartreuse',
  'chocolate',
  'darkcyan',
  'darkgreen',
]

const HEADERS = [
  'time',
  'symbol',
  'spot_value',
  'perp_value',
  'open_orders_value',
  'transfer_balance',
  'perp_spot_transfers_balance',
  'mngo_rewards_value',
  'mngo_rewards_quantity',
  'long_funding',
  'short_funding',
  'long_funding_cumulative',
  'short_funding_cumulative',
  'deposit_interest',
  'borrow_interest',
  'deposit_interest_cumulative',
  'borrow_interest_cumulative',
  'price',
]

const AccountPerformance = () => {
  const { t } = useTranslation('common')

  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const [hourlyPerformanceStats, setHourlyPerformanceStats] = useState<any>([])
  const [uniqueSymbols, setUniqueSymbols] = useState<string[]>([])
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedSymbols, setSelectedSymbols] = useState(['ALL'])
  const [chartToShow, setChartToShow] = useState('value')

  const mangoAccountPk = useMemo(() => {
    if (mangoAccount) {
      return mangoAccount.publicKey.toString()
    }
  }, [mangoAccount])

  const exportPerformanceDataToCSV = () => {
    const dataToExport = hourlyPerformanceStats
      .map(([time, tokenObjects]) => {
        return tokenObjects.map(([token, values]) => {
          return { time: time, symbol: token, ...values }
        })
      })
      .flat()

    const title = `${
      mangoAccount?.name || mangoAccount?.publicKey
    }-Performance-${new Date().toLocaleDateString()}`

    exportDataToCSV(dataToExport, title, HEADERS, t)
  }

  const calculateChartData = (chartToShow) => {
    const metrics = {
      value: (values) => {
        return (
          values['spot_value'] +
          values['perp_value'] +
          values['open_orders_value']
        )
      },
      pnl: (values) => {
        return (
          values['spot_value'] +
          values['perp_value'] +
          values['open_orders_value'] -
          values['transfer_balance']
        )
      },
      'perp pnl': (values) => {
        return (
          values['perp_value'] +
          values['perp_spot_transfers_balance'] +
          values['mngo_rewards_value']
        )
      },
      'perp pnl ex rewards': (values) => {
        return values['perp_value'] + values['perp_spot_transfers_balance']
      },
      'interest cumulative (in USDC)': (values) => {
        return (
          (values['deposit_interest_cumulative'] +
            values['borrow_interest_cumulative']) *
          values['price']
        )
      },
      'interest discrete (in USDC)': (values) => {
        return (
          (values['deposit_interest'] + values['borrow_interest']) *
          values['price']
        )
      },
      'funding cumulative': (values) => {
        return (
          values['long_funding_cumulative'] + values['short_funding_cumulative']
        )
      },
      'funding discrete': (values) => {
        return values['long_funding'] + values['short_funding']
      },
    }

    const metric: (values: []) => void = metrics[chartToShow]

    const stats = hourlyPerformanceStats.map(([time, tokenObjects]) => {
      return {
        time: time,
        ...Object.fromEntries(
          tokenObjects.map(([token, values]) => [token, metric(values)])
        ),
        ALL: tokenObjects
          .map(([_, values]) => metric(values))
          .reduce((a, b) => a + b, 0),
      }
    })

    setChartData(stats)
    setChartToShow(chartToShow)
  }

  useEffect(() => {
    const fetchHourlyPerformanceStats = async () => {
      setLoading(true)

      // TODO: this should be dynamic
      const range = 30
      const response = await fetch(
        `https://mango-transaction-log.herokuapp.com/v3/stats/account-performance-per-token?mango-account=${mangoAccountPk}&start-date=${dayjs()
          .subtract(range, 'day')
          .format('YYYY-MM-DD')}`
      )
      const parsedResponse = await response.json()
      let entries: any = Object.entries(parsedResponse)
      entries = entries
        .map(([key, value]) => [key, Object.entries(value)])
        .reverse()

      setUniqueSymbols([
        ...new Set(
          ([] as string[]).concat(
            ['ALL'],
            ...entries.map(([_, tokens]) => tokens.map(([token, _]) => token))
          )
        ),
      ])

      setHourlyPerformanceStats(entries)

      setLoading(false)
    }

    fetchHourlyPerformanceStats()
  }, [mangoAccountPk])

  useEffect(() => {
    calculateChartData(chartToShow)
  }, [hourlyPerformanceStats])

  return (
    <>
      <div className="flex items-center justify-between pb-4">
        <h2>{t('account-performance')}</h2>
        <div className="flex items-center">
          <Button
            className={`float-right h-8 pt-0 pb-0 pl-3 pr-3 text-xs`}
            onClick={exportPerformanceDataToCSV}
          >
            <div className={`flex items-center whitespace-nowrap`}>
              <SaveIcon className={`mr-1.5 h-4 w-4`} />
              {t('export-data')}
            </div>
          </Button>
        </div>
      </div>

      <div>
        <ButtonGroup
          activeValue={chartToShow}
          className="pb-2 pt-2 text-sm"
          onChange={(v) => {
            calculateChartData(v)
          }}
          values={[
            'value',
            'pnl',
            'perp pnl',
            'perp pnl ex rewards',
            'interest cumulative (in USDC)',
            'interest discrete (in USDC)',
            'funding cumulative',
            'funding discrete',
          ]}
        />
      </div>

      <div>
        {uniqueSymbols.map((v, i) => (
          <Button
            className={`${
              selectedSymbols.includes(v)
                ? `text-th-primary`
                : `text-th-fgd-2 hover:text-th-primary`
            }
                    `}
            key={`${v}${i}`}
            onClick={() =>
              selectedSymbols.includes(v)
                ? setSelectedSymbols(
                    selectedSymbols.filter((item) => item !== v)
                  )
                : setSelectedSymbols([...selectedSymbols, v])
            }
          >
            {`${v}`}
          </Button>
        ))}
      </div>

      {mangoAccount ? (
        <div>
          <>
            {!isEmpty(hourlyPerformanceStats) && !loading ? (
              <>
                {chartData.length > 0 ? (
                  <LineChart
                    width={1000}
                    height={600}
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis
                      dataKey="time"
                      axisLine={false}
                      hide={chartData.length > 0 ? false : true}
                      dy={10}
                      minTickGap={20}
                      tick={{
                        fill: 'rgba(255,255,255,0.35)',
                        fontSize: 10,
                      }}
                      tickLine={false}
                      tickFormatter={(v) => dayjs(v).format('D MMM')}
                    />
                    <YAxis
                      // dataKey={chartToShow}
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      axisLine={false}
                      dx={-10}
                      tick={{
                        fill: 'rgba(255,255,255,0.35)',
                        fontSize: 10,
                      }}
                      tickLine={false}
                      tickFormatter={(v) => numberCompacter.format(v)}
                    />
                    <Tooltip />
                    <Legend />
                    {selectedSymbols.map((v, i) => (
                      <Line
                        key={`${v}${i}`}
                        type="monotone"
                        dataKey={`${v}`}
                        stroke={`${COLORS[i]}`}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                ) : null}
              </>
            ) : loading ? (
              <div className="space-y-2 pt-8">
                <div className="h-12 w-full animate-pulse rounded-md bg-th-bkg-3" />
                <div className="h-12 w-full animate-pulse rounded-md bg-th-bkg-3" />
                <div className="h-12 w-full animate-pulse rounded-md bg-th-bkg-3" />
              </div>
            ) : null}
          </>
        </div>
      ) : (
        <div>{t('connect-wallet')}</div>
      )}
    </>
  )
}

export default AccountPerformance
