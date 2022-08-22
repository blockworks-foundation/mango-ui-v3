import { useTranslation } from 'next-i18next'
import { useTheme } from 'next-themes'
import { useMemo } from 'react'
import useDimensions from 'react-cool-dimensions'
import { Bar, BarChart, Tooltip, XAxis, YAxis } from 'recharts'
import { numberCompactFormatter } from 'utils'
import { CHART_COLORS } from './LongShortChart'

const AccountVolume = ({ data, loading }) => {
  const { t } = useTranslation('common')
  const { observe, width, height } = useDimensions()
  const { theme } = useTheme()

  const { makerVol, takerVol }: { makerVol: number; takerVol: number } =
    useMemo(() => {
      const makerVol: number = data.reduce((a, c) => {
        const makerVolume = Object.values(c).reduce(
          (a: number, c: { maker: number }) => a + c.maker,
          0
        )
        return a + makerVolume
      }, 0)
      const takerVol: number = data.reduce((a, c) => {
        const takerVolume = Object.values(c).reduce(
          (a: number, c: { taker: number }) => a + c.taker,
          0
        )
        return a + takerVolume
      }, 0)
      return { makerVol, takerVol }
    }, [data])

  const chartData: Array<{
    market: string
    maker: number
    taker: number
    total: number
  }> | void = useMemo(() => {
    if (data.length) {
      const forChart: Array<any> = []
      for (const d of data) {
        const values: any = Object.values(d)[0]
        const assetVol: any = {
          market: Object.keys(d)[0],
          maker: values.maker,
          taker: values.taker,
          total: values.maker + values.taker,
        }
        forChart.push(assetVol)
      }
      return forChart
    }
    return []
  }, [data])

  const renderTooltip = (props) => {
    const { payload } = props
    return payload ? (
      <div className="space-y-1.5 rounded-md bg-th-bkg-1 p-3">
        <p className="text-center text-xs">{t(payload[0]?.payload.market)}</p>
        {payload.map((entry, index) => {
          const { color, name, value } = entry
          return (
            <div
              className="flex w-36 items-center justify-between text-xs"
              key={`item-${index}`}
            >
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4" style={{ backgroundColor: color }} />
                <p className="mb-0 text-xs">{t(name)}</p>
              </div>
              <p className="mb-0 text-xs">
                ${numberCompactFormatter.format(value)}
              </p>
            </div>
          )
        })}
      </div>
    ) : null
  }

  return (
    <div>
      {!loading ? (
        <div className="mb-6 mt-4 rounded-md border border-th-bkg-3 p-4 text-center">
          <h2 className="mb-1 text-base font-normal">{t('lifetime-volume')}</h2>
          <span className="text-4xl font-bold">
            ${numberCompactFormatter.format(makerVol + takerVol)}
          </span>
          <div className="mt-1 flex justify-center space-x-2">
            <p className="mb-0">
              {t('maker')}: ${numberCompactFormatter.format(makerVol)}
            </p>
            <span className="text-th-fgd-4">|</span>
            <p className="mb-0">
              {t('taker')}: ${numberCompactFormatter.format(takerVol)}
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-6 mt-4 h-28 animate-pulse rounded-md bg-th-bkg-3" />
      )}
      {chartData.length ? (
        <>
          <h2 className="mb-4">{t('lifetime-volume-by-asset')}</h2>
          <div
            className="relative mb-6 w-full rounded-md border border-th-bkg-3 p-4"
            style={{
              height:
                chartData.length > 9 ? `${chartData.length * 50}px` : '500px',
            }}
            ref={observe}
          >
            <BarChart
              layout="vertical"
              width={width}
              height={height}
              data={chartData}
            >
              <Tooltip
                cursor={{
                  fill: '#fff',
                  opacity: 0.2,
                }}
                content={renderTooltip}
              />
              <XAxis
                axisLine={false}
                hide={data.length > 0 ? false : true}
                dy={10}
                tick={{
                  fill:
                    theme === 'Light'
                      ? 'rgba(0,0,0,0.4)'
                      : 'rgba(255,255,255,0.35)',
                  fontSize: 10,
                }}
                tickLine={false}
                tickFormatter={(v) => `$${numberCompactFormatter.format(v)}`}
                type="number"
              />
              <YAxis
                dataKey="market"
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
                type="category"
                width={80}
              />
              <Bar dataKey="maker" fill={CHART_COLORS(theme).SOL} />
              <Bar dataKey="taker" fill={CHART_COLORS(theme).SRM} />
              <Bar dataKey="total" fill={CHART_COLORS(theme).MNGO} />
            </BarChart>
          </div>
        </>
      ) : loading ? (
        <div className="mb-6 mt-4 h-[500px] animate-pulse rounded-md bg-th-bkg-3" />
      ) : null}
    </div>
  )
}

export default AccountVolume
