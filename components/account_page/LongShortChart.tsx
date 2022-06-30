import { PieChart, Pie, Cell, Tooltip } from 'recharts'
import { formatUsdValue, tokenPrecision } from 'utils'
import * as MonoIcons from '../icons'
import { QuestionMarkCircleIcon } from '@heroicons/react/outline'
import { useTheme } from 'next-themes'

export const CHART_COLORS = (theme) => {
  return {
    All: '#ff7c43',
    spacer: theme === 'Light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
    ADA: '#335CBE',
    AVAX: '#E84142',
    BNB: '#F3BA2F',
    BTC: '#F7931A',
    COPE: '#EEEEEE',
    ETH: '#627EEA',
    FTT: '#02A6C2',
    GMT: '#CBA74A',
    LUNA: '#FFD83D',
    MNGO: '#FBB31F',
    MSOL: '#8562CF',
    RAY: '#4CA2DA',
    SOL: '#916CE0',
    SRM: '#58D4E3',
    USDC: '#2775CA',
    USDT: '#50AF95',
  }
}

const LongShortChart = ({ chartData }: { chartData: any[] }) => {
  const { theme } = useTheme()
  const CustomToolTip = () => {
    const renderIcon = (symbol) => {
      const iconName = `${symbol.slice(0, 1)}${symbol
        .slice(1, 4)
        .toLowerCase()}MonoIcon`
      const SymbolIcon = MonoIcons[iconName] || QuestionMarkCircleIcon
      return (
        <div style={{ color: CHART_COLORS(theme)[symbol] }}>
          <SymbolIcon className={`mr-1.5 h-3.5 w-auto`} />
        </div>
      )
    }

    const showTooltip = chartData.find((d) => d.symbol !== 'spacer')

    return chartData.length && showTooltip ? (
      <div className="space-y-1.5 rounded-md bg-th-bkg-2 p-3 pb-2">
        {chartData
          .filter((d) => d.symbol !== 'spacer')
          .sort((a, b) => b.value - a.value)
          .map((entry, index) => {
            const { amount, asset, symbol, value } = entry
            return (
              <div
                className="flex w-48 items-center justify-between border-b border-th-bkg-4 pb-1 text-xs last:border-b-0 last:pb-0"
                key={`item-${index}-${symbol}`}
              >
                <div className="mb-0.5 flex items-center">
                  {renderIcon(symbol)}
                  <p
                    className="mb-0 text-xs leading-none"
                    style={{ color: CHART_COLORS(theme)[symbol] }}
                  >
                    {asset}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className="mb-0 text-xs leading-none"
                    style={{ color: CHART_COLORS(theme)[symbol] }}
                  >
                    {amount.toLocaleString(undefined, {
                      maximumFractionDigits: tokenPrecision[symbol],
                    })}
                  </p>
                  <p className="mb-0 text-xxs text-th-fgd-4">
                    {formatUsdValue(value)}
                  </p>
                </div>
              </div>
            )
          })}
      </div>
    ) : null
  }

  return chartData.length ? (
    <PieChart width={40} height={40}>
      <Pie
        cursor="pointer"
        data={chartData}
        dataKey="value"
        cx="50%"
        cy="50%"
        outerRadius={20}
        innerRadius={10}
        minAngle={2}
        startAngle={90}
        endAngle={450}
      >
        {chartData
          .sort((a, b) => a.symbol.localeCompare(b.symbol))
          .map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={CHART_COLORS(theme)[entry.symbol]}
              stroke="rgba(0,0,0,0.1)"
            />
          ))}
      </Pie>
      <Tooltip
        content={<CustomToolTip />}
        position={{ x: 48, y: 0 }}
        wrapperStyle={{ zIndex: 10 }}
      />
    </PieChart>
  ) : null
}

export default LongShortChart
