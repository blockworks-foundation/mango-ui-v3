import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import isEmpty from 'lodash/isEmpty'
import { useTranslation } from 'next-i18next'
import { LineChart, XAxis, YAxis, Line, Tooltip, Legend } from 'recharts'
import { SaveIcon } from '@heroicons/react/outline'

import useMangoStore from '../../stores/useMangoStore'
import { numberCompactFormatter } from '../../utils/'
import { exportDataToCSV } from '../../utils/export'
import Button from '../Button'
import MultiSelectDropdown from 'components/MultiSelectDropdown'
import useDimensions from 'react-cool-dimensions'
import Select from 'components/Select'
import Checkbox from 'components/Checkbox'

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
const COLORS = [
  '#ff7c43',
  '#ffa600',
  '#8dd3c7',
  '#ffffb3',
  '#bebada',
  '#fb8072',
  '#80b1d3',
  '#fdb462',
  '#b3de69',
  '#fccde5',
  '#d9d9d9',
  '#bc80bd',
  '#ccebc5',
  '#ffed6f',
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

const DATA_CATEGORIES = [
  'account-value',
  'account-pnl',
  'perp-pnl',
  'perp-pnl-ex-rewards',
  'interest-cumulative',
  'interest-discrete',
  'funding-cumulative',
  'funding-discrete',
]

const AccountPerformance = () => {
  const { t } = useTranslation(['common', 'account-performance'])

  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const [hourlyPerformanceStats, setHourlyPerformanceStats] = useState<any>([])
  const [uniqueSymbols, setUniqueSymbols] = useState<string[]>([])
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedSymbols, setSelectedSymbols] = useState(['All'])
  const [chartToShow, setChartToShow] = useState('account-value')
  const [selectAll, setSelectAll] = useState(false)
  const { observe, width, height } = useDimensions()

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
      'account-value': (values) => {
        return (
          values['spot_value'] +
          values['perp_value'] +
          values['open_orders_value']
        )
      },
      'account-pnl': (values) => {
        return (
          values['spot_value'] +
          values['perp_value'] +
          values['open_orders_value'] -
          values['transfer_balance']
        )
      },
      'perp-pnl': (values) => {
        return (
          values['perp_value'] +
          values['perp_spot_transfers_balance'] +
          values['mngo_rewards_value']
        )
      },
      'perp-pnl-ex-rewards': (values) => {
        return values['perp_value'] + values['perp_spot_transfers_balance']
      },
      'interest-cumulative': (values) => {
        return (
          (values['deposit_interest_cumulative'] +
            values['borrow_interest_cumulative']) *
          values['price']
        )
      },
      'interest-discrete': (values) => {
        return (
          (values['deposit_interest'] + values['borrow_interest']) *
          values['price']
        )
      },
      'funding-cumulative': (values) => {
        return (
          values['long_funding_cumulative'] + values['short_funding_cumulative']
        )
      },
      'funding-discrete': (values) => {
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
        All: tokenObjects
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
            // ['Select All'],
            ['All'],
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

  const toggleOption = (v) => {
    selectedSymbols.includes(v)
      ? setSelectedSymbols(selectedSymbols.filter((item) => item !== v))
      : setSelectedSymbols([...selectedSymbols, v])
  }

  const handleSelectAll = () => {
    if (!selectAll) {
      setSelectedSymbols([...uniqueSymbols])
      setSelectAll(true)
    } else {
      setSelectedSymbols([])
      setSelectAll(false)
    }
  }

  const renderLegend = (props) => {
    const { payload } = props
    return (
      <div className="mt-4 flex w-full justify-center">
        <div className="flex w-full flex-wrap justify-center space-x-3">
          {payload.map((entry, index) => (
            <div className="mb-1.5 flex items-center" key={`item-${index}`}>
              <div
                className="mr-1 h-3 w-3 rounded-full border-2"
                style={{ borderColor: entry.color }}
              />
              <span style={{ color: entry.color }} className="text-xs">
                {entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderTooltip = (props) => {
    const { payload } = props
    return payload ? (
      <div className="space-y-1.5 rounded-md bg-th-bkg-1 p-3">
        <p className="text-xs">
          {dayjs(payload[0]?.payload.time).format('ddd D MMM YYYY')}
        </p>
        {payload.map((entry, index) => {
          return (
            <div
              className="flex w-32 items-center justify-between text-xs"
              key={`item-${index}`}
            >
              <p className="mb-0 text-xs" style={{ color: entry.color }}>
                {entry.name}
              </p>
              <p className="mb-0 text-xs" style={{ color: entry.color }}>
                {numberCompacter.format(entry.value)}
              </p>
            </div>
          )
        })}
      </div>
    ) : null
  }

  const numberCompacter = Intl.NumberFormat('en', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 2,
  })

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
      <div className="grid grid-cols-12 gap-4 lg:gap-6">
        <div className="col-span-12 lg:col-span-3">
          <Select
            value={chartToShow}
            onChange={(cat) => calculateChartData(cat)}
            className="lg:hidden"
          >
            {DATA_CATEGORIES.map((cat) => (
              <Select.Option key={cat} value={cat}>
                <div className="flex w-full items-center justify-between">
                  {t(cat)}
                </div>
              </Select.Option>
            ))}
          </Select>
          <div className="hidden space-y-2 lg:block">
            {DATA_CATEGORIES.map((cat) => (
              <button
                className={`default-transition block w-full rounded-md p-4 text-left font-bold hover:bg-th-bkg-4 ${
                  chartToShow === cat
                    ? 'bg-th-bkg-4 text-th-primary'
                    : 'bg-th-bkg-3 text-th-fgd-3'
                }`}
                onClick={() => calculateChartData(cat)}
                key={cat}
              >
                {t(`account-performance:${cat}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-9">
          {mangoAccount ? (
            <div
              className="h-[540px] w-full rounded-lg border border-th-bkg-4 p-6 pb-28 sm:pb-16"
              ref={observe}
            >
              <div className="flex flex-col pb-4 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="mb-4 sm:mb-0">{`${t(
                  `account-performance:${chartToShow}`
                )} ${t('account-performance:vs-time')}`}</h3>
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <div className="flex items-center">
                    <p className="mb-0 mr-2 hidden sm:block">{t('assets')}</p>
                    <MultiSelectDropdown
                      options={uniqueSymbols}
                      selected={selectedSymbols || []}
                      toggleOption={toggleOption}
                    />
                    <div className="ml-3">
                      <Checkbox
                        halfState={
                          selectedSymbols.length !== 0 &&
                          uniqueSymbols.length !== selectedSymbols.length
                        }
                        checked={selectAll}
                        onChange={handleSelectAll}
                      >
                        {t('select-all')}
                      </Checkbox>
                    </div>
                  </div>
                </div>
              </div>
              {!isEmpty(hourlyPerformanceStats) && !loading ? (
                chartData.length > 0 && selectedSymbols.length > 0 ? (
                  <LineChart
                    width={width}
                    height={height}
                    data={chartData}
                    margin={{ top: 5, left: 16, right: 8, bottom: 5 }}
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
                    <Tooltip content={renderTooltip} cursor={false} />
                    <Legend content={renderLegend} />
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
                ) : selectedSymbols.length === 0 ? (
                  <div className="w-full bg-th-bkg-3 p-4 text-center">
                    <p className="mb-0">
                      {t('account-performance:select-an-asset')}
                    </p>
                  </div>
                ) : null
              ) : loading ? (
                <div
                  style={{ height: height - 16 }}
                  className="w-full animate-pulse rounded-md bg-th-bkg-3"
                />
              ) : null}
            </div>
          ) : (
            <div>{t('connect-wallet')}</div>
          )}
        </div>
      </div>
    </>
  )
}

export default AccountPerformance
