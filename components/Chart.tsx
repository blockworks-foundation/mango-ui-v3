import { FunctionComponent, useState, ReactNode } from 'react'
import { useTheme } from 'next-themes'
import dayjs from 'dayjs'
import { AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts'
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
              <div className="pb-1 text-xl text-th-fgd-1">
                {labelFormat(mouseData[yAxis])}
              </div>
              <div className="text-xs font-normal text-th-fgd-4">
                {new Date(mouseData[xAxis]).toDateString()}
              </div>
            </>
          ) : data.length > 0 ? (
            <>
              <div className="pb-1 text-xl text-th-fgd-1">
                {labelFormat(data[data.length - 1][yAxis])}
              </div>
              <div className="text-xs font-normal text-th-fgd-4">
                {new Date(data[data.length - 1][xAxis]).toDateString()}
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
              <stop offset="0%" stopColor="#FF9C24" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#FF9C24" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            isAnimationActive={false}
            type="monotone"
            dataKey={yAxis}
            stroke="#FF9C24"
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
                theme === 'Light' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.6)',
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
            tick={{
              fill:
                theme === 'Light' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.6)',
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
            <linearGradient id="gradientBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF9C24" stopOpacity={1} />
              <stop offset="100%" stopColor="#FF9C24" stopOpacity={0.5} />
            </linearGradient>
          </defs>
          <Bar
            isAnimationActive={false}
            type="monotone"
            dataKey={yAxis}
            fill="url(#gradientBar)"
          />
          <XAxis
            dataKey={xAxis}
            axisLine={false}
            hide={data.length > 0 ? false : true}
            dy={10}
            minTickGap={20}
            tick={{
              fill:
                theme === 'Light' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.6)',
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
                theme === 'Light' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.6)',
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
        </BarChart>
      ) : null}
    </div>
  )
}

export default Chart
