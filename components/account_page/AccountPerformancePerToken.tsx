import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { useTranslation } from 'next-i18next'
import { LineChart, XAxis, YAxis, Line, Tooltip } from 'recharts'
import useMangoStore from '../../stores/useMangoStore'
import { numberCompactFormatter } from '../../utils/'
import { exportDataToCSV } from '../../utils/export'
import Button from '../Button'
import useDimensions from 'react-cool-dimensions'
import Select from 'components/Select'
import Checkbox from 'components/Checkbox'
import ButtonGroup from 'components/ButtonGroup'
import * as MonoIcons from '../icons'
import { SaveIcon, QuestionMarkCircleIcon } from '@heroicons/react/solid'
import { useTheme } from 'next-themes'
import { CHART_COLORS } from './LongShortChart'

const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

export const handleDustTicks = (v) => {
  return v < 0.000001
    ? v === 0
      ? 0
      : v.toExponential()
    : numberCompactFormatter.format(v)
}

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
  // 'deposit_interest',
  // 'borrow_interest',
  // 'deposit_interest_cumulative',
  // 'borrow_interest_cumulative',
  // 'price',
]

const DATA_CATEGORIES = [
  'account-value',
  'account-pnl',
  'perp-pnl',
  'maker-volume',
  'taker-volume',
  // 'interest-cumulative',
  'funding-cumulative',
  'mngo-rewards',
]

const performanceRangePresets = [
  { label: '24h', value: '1' },
  { label: '7d', value: '7' },
  { label: '30d', value: '30' },
  { label: '3m', value: '90' },
]
const performanceRangePresetLabels = performanceRangePresets.map((x) => x.label)
const performanceRangePresetValues = performanceRangePresets.map((x) => x.value)

const AccountPerformance = () => {
  const { t } = useTranslation(['common', 'account-performance'])

  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const [hourlyPerformanceStats, setHourlyPerformanceStats] = useState<any>([])
  const [uniqueSymbols, setUniqueSymbols] = useState<string[]>([])
  const [filteredSymbols, setFilteredSymbols] = useState<string[]>([])
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedSymbols, setSelectedSymbols] = useState(['All'])
  const [chartToShow, setChartToShow] = useState('account-value')
  const [selectAll, setSelectAll] = useState(false)
  const [performanceRange, setPerformanceRange] = useState('30')
  const [volumeData, setVolumeData] = useState<any>([])
  const [volumeSymbols, setVolumeSymbols] = useState<string[]>([])
  const { observe, width, height } = useDimensions()
  const { theme } = useTheme()

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
      // 'interest-cumulative': (values) => {
      //   return (
      //     (values['deposit_interest_cumulative'] +
      //       values['borrow_interest_cumulative']) *
      //     values['price']
      //   )
      // },
      'funding-cumulative': (values) => {
        return (
          values['long_funding_cumulative'] + values['short_funding_cumulative']
        )
      },
      'mngo-rewards': (values) => {
        return values['mngo_rewards_value']
      },
      'maker-volume': (values) => {
        return values['maker_cumulative']
      },
      'taker-volume': (values) => {
        return values['taker_cumulative']
      },
    }

    const metric: (values: []) => void = metrics[chartToShow]

    let stats

    if (chartToShow !== 'maker-volume' && chartToShow !== 'taker-volume') {
      stats = hourlyPerformanceStats.map(([time, tokenObjects]) => {
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
    } else {
      stats = volumeData.map(([time, tokenObjects]) => {
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
    }

    // Normalise chart to start from 0 (except for account value)
    if (parseInt(performanceRange) !== 90 && chartToShow !== 'account-value') {
      const startValues = Object.assign({}, stats[0])
      // Initialize symbol not present at the start to 0
      uniqueSymbols
        .filter((e) => !(e in startValues))
        .map((f) => (startValues[f] = 0))
      for (let i = 0; i < stats.length; i++) {
        for (const key in stats[i]) {
          if (key !== 'time') {
            stats[i][key] = stats[i][key] - startValues[key]
          }
        }
      }
    }

    setChartData(stats)
    setChartToShow(chartToShow)
  }

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)

      const promises = [
        fetch(
          `https://mango-transaction-log.herokuapp.com/v3/stats/account-performance-per-token?mango-account=${mangoAccountPk}&start-date=${dayjs()
            .subtract(parseInt(performanceRange), 'day')
            .format('YYYY-MM-DD')}`
        ),
        fetch(
          `https://mango-transaction-log.herokuapp.com/v3/stats/volumes-by-mango-account?mango-account=${mangoAccountPk}&start-date=${dayjs()
            .subtract(parseInt(performanceRange), 'day')
            .format('YYYY-MM-DD')}`
        ),
      ]

      const data = await Promise.all(promises)
      const performanceData = await data[0].json()
      const volumeData = await data[1].json()

      let performanceEntries: any = Object.entries(performanceData)
      performanceEntries = performanceEntries
        .map(([key, value]) => [key, Object.entries(value)])
        .reverse()

      let volumeEntries: any = Object.entries(volumeData)
      volumeEntries = volumeEntries.map(([key, value]) => [
        key,
        Object.entries(value),
      ])

      const uniqueSymbols = [
        ...new Set(
          ([] as string[]).concat(
            ['All'],
            ...performanceEntries.map(([_, tokens]) =>
              tokens.map(([token, _]) => token)
            )
          )
        ),
      ]

      const uniqueVolumeSymbols = [
        ...new Set(
          ([] as string[]).concat(
            ['All'],
            ...volumeEntries.map(([_, tokens]) =>
              tokens.map(([token, _]) => token)
            )
          )
        ),
      ]

      setUniqueSymbols(uniqueSymbols)
      setFilteredSymbols(uniqueSymbols)
      setVolumeSymbols(uniqueVolumeSymbols)

      setHourlyPerformanceStats(performanceEntries)
      setVolumeData(volumeEntries)

      setLoading(false)
    }

    fetchStats()
  }, [mangoAccountPk, performanceRange])

  useEffect(() => {
    calculateChartData(chartToShow)
  }, [hourlyPerformanceStats, volumeData])

  useEffect(() => {
    if (
      ['perp-pnl', 'mngo-rewards', 'funding-cumulative'].includes(chartToShow)
    ) {
      setFilteredSymbols(uniqueSymbols.filter((s) => s !== 'USDC'))
      if (selectedSymbols.includes('USDC')) {
        setSelectedSymbols(selectedSymbols.filter((s) => s !== 'USDC'))
      }
    } else {
      if (selectAll) {
        setSelectedSymbols(uniqueSymbols)
      }
      setFilteredSymbols(uniqueSymbols)
    }
  }, [chartToShow, selectedSymbols, hourlyPerformanceStats])

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

  const renderSymbolIcon = (s) => {
    if (s === 'All') return
    if (chartToShow !== 'maker-volume' && chartToShow !== 'taker-volume') {
      const iconName = `${s.slice(0, 1)}${s.slice(1, 4).toLowerCase()}MonoIcon`
      const SymbolIcon = MonoIcons[iconName] || QuestionMarkCircleIcon
      return <SymbolIcon className="mr-1.5 h-3.5 w-auto" />
    } else {
      const iconName = `${s.slice(0, 1)}${s.slice(1, -5).toLowerCase()}MonoIcon`
      const SymbolIcon = MonoIcons[iconName] || QuestionMarkCircleIcon
      return <SymbolIcon className="mr-1.5 h-3.5 w-auto" />
    }
  }

  const symbols = useMemo(() => {
    if (chartToShow !== 'maker-volume' && chartToShow !== 'taker-volume') {
      return filteredSymbols
    }
    return volumeSymbols
  }, [chartToShow])

  return (
    <>
      <div className="flex items-center justify-between pb-4">
        <h2>{t('account-performance')}</h2>
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
      <div className="hidden pb-3 sm:block">
        <ButtonGroup
          activeValue={chartToShow}
          className="min-h-[32px]"
          onChange={(cat) => calculateChartData(cat)}
          values={DATA_CATEGORIES}
          names={DATA_CATEGORIES.map((val) => t(`account-performance:${val}`))}
        />
      </div>
      <Select
        value={t(`account-performance:${chartToShow}`)}
        onChange={(cat) => calculateChartData(cat)}
        className="mb-3 sm:hidden"
      >
        {DATA_CATEGORIES.map((cat) => (
          <Select.Option key={cat} value={cat}>
            <div className="flex w-full items-center justify-between">
              {t(`account-performance:${cat}`)}
            </div>
          </Select.Option>
        ))}
      </Select>
      {mangoAccount ? (
        <>
          <div
            className="h-[540px] w-full rounded-lg rounded-b-none border border-th-bkg-3 p-6 pb-24 sm:pb-16"
            ref={observe}
          >
            <div className="flex flex-col pb-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="mb-4 sm:mb-0">{`${t(
                `account-performance:${chartToShow}`
              )}`}</h3>
              <div className="w-full sm:ml-auto sm:w-56">
                <ButtonGroup
                  activeValue={performanceRange}
                  className="h-8"
                  onChange={(p) => setPerformanceRange(p)}
                  values={performanceRangePresetValues}
                  names={performanceRangePresetLabels}
                />
              </div>
            </div>
            {!loading ? (
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
                      fill:
                        theme === 'Light'
                          ? 'rgba(0,0,0,0.4)'
                          : 'rgba(255,255,255,0.35)',
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
                      fill:
                        theme === 'Light'
                          ? 'rgba(0,0,0,0.4)'
                          : 'rgba(255,255,255,0.35)',
                      fontSize: 10,
                    }}
                    tickLine={false}
                    tickFormatter={(v) => numberCompacter.format(v)}
                  />
                  <Tooltip content={renderTooltip} cursor={false} />
                  {selectedSymbols.map((v, i) => {
                    const symbol =
                      v.includes('/') || v.includes('-') ? v.slice(0, -5) : v
                    return (
                      <Line
                        key={`${v}${i}`}
                        type="monotone"
                        dataKey={`${v}`}
                        stroke={`${CHART_COLORS(theme)[symbol]}`}
                        dot={false}
                      />
                    )
                  })}
                </LineChart>
              ) : selectedSymbols.length === 0 ? (
                <div className="flex h-full w-full items-center justify-center p-4">
                  <p className="mb-0">
                    {t('account-performance:select-an-asset')}
                  </p>
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center p-4">
                  <p className="mb-0">{t('account-performance:no-data')}</p>
                </div>
              )
            ) : loading ? (
              <div
                style={{ height: height - 16 }}
                className="w-full animate-pulse rounded-md bg-th-bkg-3"
              />
            ) : null}
          </div>
          <div className="-mt-[1px] rounded-b-lg border border-th-bkg-3 py-3 px-6">
            <div className="mb-2 flex items-center justify-between">
              <p className="mb-0 font-bold">{t('assets')}</p>
              <Checkbox
                halfState={
                  selectedSymbols.length !== 0 &&
                  filteredSymbols.length !== selectedSymbols.length
                }
                checked={selectAll}
                onChange={handleSelectAll}
              >
                {t('select-all')}
              </Checkbox>
            </div>
            <div className="-ml-1 flex flex-wrap">
              {symbols.map((s) => {
                const symbol =
                  s.includes('/') || s.includes('-') ? s.slice(0, -5) : s
                return (
                  <button
                    className={`default-transition m-1 flex items-center rounded-full border py-1 px-2 text-xs font-bold ${
                      selectedSymbols.includes(s)
                        ? ''
                        : 'border-th-fgd-4 text-th-fgd-4 focus:border-th-fgd-3 focus:text-th-fgd-3 focus:outline-none md:hover:border-th-fgd-3 md:hover:text-th-fgd-3'
                    }`}
                    onClick={() => toggleOption(s)}
                    style={
                      selectedSymbols.includes(s)
                        ? {
                            borderColor: CHART_COLORS(theme)[symbol],
                            color: CHART_COLORS(theme)[symbol],
                          }
                        : {}
                    }
                    key={s}
                  >
                    {renderSymbolIcon(s)}
                    {s == 'All' ? t(`account-performance:all`) : s}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      ) : (
        <div>{t('connect-wallet')}</div>
      )}
    </>
  )
}

export default AccountPerformance
