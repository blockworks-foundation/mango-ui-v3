import { FunctionComponent, useState, ReactNode } from 'react'
import { useTheme } from 'next-themes'
import dayjs from 'dayjs'
import {
  AreaChart,
  Area,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  ReferenceLine,
} from 'recharts'
import useDimensions from 'react-cool-dimensions'
import { numberCompactFormatter } from '../utils'

interface ChartProps {
  data: any
  daysRange?: number
  hideRangeFilters?: boolean
  title?: string
  xAxis: string
  yAxis: string
  yAxisWidth?: number
  type: string
  labelFormat: (x) => ReactNode
  tickFormat?: (x) => any
  showAll?: boolean
  titleValue?: number
  useMulticoloredBars?: boolean
  zeroLine?: boolean
}

const Chart: FunctionComponent<ChartProps> = ({
  title,
  xAxis,
  yAxis,
  data,
  daysRange,
  labelFormat,
  tickFormat,
  type,
  hideRangeFilters,
  yAxisWidth,
  showAll = false,
  titleValue,
  useMulticoloredBars,
  zeroLine,
}) => {
  const [mouseData, setMouseData] = useState<string | null>(null)
  const [daysToShow, setDaysToShow] = useState(daysRange || 30)
  const { observe, width, height } = useDimensions()
  const { theme } = useTheme()

  const handleMouseMove = (coords) => {
    if (coords.activePayload) {
      setMouseData(coords.activePayload[0].payload)
    }
  }

  const handleMouseLeave = () => {
    setMouseData(null)
  }

  const handleDaysToShow = (time) => {
    const startFrom = time
      ? new Date(Date.now() - time * 24 * 60 * 60 * 1000).getTime()
      : null

    return startFrom
      ? data.filter((d) => new Date(d.time).getTime() > startFrom)
      : data
  }

  const formatDateAxis = (date) => {
    if (daysToShow === 1) {
      return dayjs(date).format('h:mma')
    } else {
      return dayjs(date).format('D MMM')
    }
  }

  return (
    <div className="h-52 w-full" ref={observe}>
      <div className="flex items-start justify-between pb-6 w-full">
        <div className="pl-2">
          <div className="pb-0.5 text-xs text-th-fgd-3">{title}</div>
          {mouseData ? (
            <>
              <div className="font-bold pb-1 text-xl text-th-fgd-1">
                {labelFormat(mouseData[yAxis])}
              </div>
              <div className="text-xs font-normal text-th-fgd-4">
                {new Date(mouseData[xAxis]).toDateString()}
              </div>
            </>
          ) : data.length > 0 ? (
            <>
              <div className="font-bold pb-1 text-xl text-th-fgd-1">
                {titleValue
                  ? labelFormat(titleValue)
                  : labelFormat(data[data.length - 1][yAxis])}
              </div>
              <div className="text-xs font-normal h-4 text-th-fgd-4">
                {titleValue
                  ? ''
                  : new Date(data[data.length - 1][xAxis]).toDateString()}
              </div>
            </>
          ) : (
            <>
              <div className="animate-pulse bg-th-bkg-3 h-8 mt-1 rounded w-48" />
              <div className="animate-pulse bg-th-bkg-3 h-4 mt-1 rounded w-24" />
            </>
          )}
        </div>
        {!hideRangeFilters ? (
          <div className="flex h-5">
            <button
              className={`default-transition font-bold mx-3 text-th-fgd-1 text-xs hover:text-th-primary focus:outline-none ${
                daysToShow === 1 && 'text-th-primary'
              }`}
              onClick={() => setDaysToShow(1)}
            >
              24H
            </button>
            <button
              className={`default-transition font-bold mx-3 text-th-fgd-1 text-xs hover:text-th-primary focus:outline-none ${
                daysToShow === 7 && 'text-th-primary'
              }`}
              onClick={() => setDaysToShow(7)}
            >
              7D
            </button>
            <button
              className={`default-transition font-bold ml-3 text-th-fgd-1 text-xs hover:text-th-primary focus:outline-none ${
                daysToShow === 30 && 'text-th-primary'
              }`}
              onClick={() => setDaysToShow(30)}
            >
              30D
            </button>
            {showAll ? (
              <button
                className={`default-transition font-bold ml-3 text-th-fgd-1 text-xs hover:text-th-primary focus:outline-none ${
                  daysToShow === 1000 && 'text-th-primary'
                }`}
                onClick={() => setDaysToShow(1000)}
              >
                All
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      {width > 0 && type === 'area' ? (
        <AreaChart
          width={width}
          height={height}
          data={data ? handleDaysToShow(daysToShow) : null}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <Tooltip
            cursor={{
              strokeOpacity: 0,
            }}
            content={<></>}
          />
          <defs>
            <linearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffba24" stopOpacity={1} />
              <stop offset="100%" stopColor="#ffba24" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            isAnimationActive={false}
            type="monotone"
            dataKey={yAxis}
            stroke="#ffba24"
            fill="url(#gradientArea)"
          />
          <XAxis
            dataKey={xAxis}
            axisLine={false}
            hide={data.length > 0 ? false : true}
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
            tickFormatter={(v) => formatDateAxis(v)}
          />
          <YAxis
            dataKey={yAxis}
            axisLine={false}
            hide={data.length > 0 ? false : true}
            dx={-10}
            domain={['dataMin', 'dataMax']}
            tick={{
              fill:
                theme === 'Light'
                  ? 'rgba(0,0,0,0.4)'
                  : 'rgba(255,255,255,0.35)',
              fontSize: 10,
            }}
            tickLine={false}
            tickFormatter={
              tickFormat
                ? (v) => tickFormat(v)
                : (v) => numberCompactFormatter.format(v)
            }
            type="number"
            width={yAxisWidth || 50}
          />
          {zeroLine ? (
            <ReferenceLine
              y={0}
              stroke={
                theme === 'Light' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.35)'
              }
              strokeDasharray="3 3"
            />
          ) : null}
        </AreaChart>
      ) : null}
      {width > 0 && type === 'bar' ? (
        <BarChart
          width={width}
          height={height}
          data={
            data
              ? hideRangeFilters
                ? data
                : handleDaysToShow(daysToShow)
              : null
          }
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <Tooltip
            cursor={{
              fill: '#fff',
              opacity: 0.2,
            }}
            content={<></>}
          />
          <defs>
            <linearGradient id="defaultGradientBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffba24" stopOpacity={1} />
              <stop offset="100%" stopColor="#ffba24" stopOpacity={0.5} />
            </linearGradient>
            <linearGradient id="greenGradientBar" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={theme === 'Mango' ? '#AFD803' : '#5EBF4D'}
                stopOpacity={1}
              />
              <stop
                offset="100%"
                stopColor={theme === 'Mango' ? '#91B503' : '#4BA53B'}
                stopOpacity={1}
              />
            </linearGradient>
            <linearGradient id="redGradientBar" x1="0" y1="1" x2="0" y2="0">
              <stop
                offset="0%"
                stopColor={theme === 'Mango' ? '#F84638' : '#CC2929'}
                stopOpacity={1}
              />
              <stop
                offset="100%"
                stopColor={theme === 'Mango' ? '#EC1809' : '#BB2525'}
                stopOpacity={1}
              />
            </linearGradient>
          </defs>
          <Bar dataKey={yAxis}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  useMulticoloredBars
                    ? entry[yAxis] > 0
                      ? 'url(#greenGradientBar)'
                      : 'url(#redGradientBar)'
                    : 'url(#defaultGradientBar)'
                }
              />
            ))}
          </Bar>
          <XAxis
            dataKey={xAxis}
            axisLine={false}
            hide={data.length > 0 ? false : true}
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
            tickFormatter={(v) => formatDateAxis(v)}
          />
          <YAxis
            dataKey={yAxis}
            interval="preserveStartEnd"
            axisLine={false}
            hide={data.length > 0 ? false : true}
            dx={-10}
            tick={{
              fill:
                theme === 'Light'
                  ? 'rgba(0,0,0,0.4)'
                  : 'rgba(255,255,255,0.35)',
              fontSize: 10,
            }}
            tickLine={false}
            tickFormatter={
              tickFormat
                ? (v) => tickFormat(v)
                : (v) => numberCompactFormatter.format(v)
            }
            type="number"
            width={yAxisWidth || 50}
          />
          {zeroLine ? (
            <ReferenceLine
              y={0}
              stroke={
                theme === 'Light' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.2)'
              }
            />
          ) : null}
        </BarChart>
      ) : null}
    </div>
  )
}

export default Chart
