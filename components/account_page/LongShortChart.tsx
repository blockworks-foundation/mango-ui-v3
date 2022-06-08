import { PieChart, Pie, Cell, Tooltip } from 'recharts'
import useMangoStore from 'stores/useMangoStore'
import { ZERO_BN } from '@blockworks-foundation/mango-client'
import { formatUsdValue, tokenPrecision } from 'utils'
import * as MonoIcons from '../icons'
import { QuestionMarkCircleIcon } from '@heroicons/react/outline'
import { useBalances } from 'hooks/useBalances'
import { useTranslation } from 'next-i18next'
import { useEffect, useMemo, useState } from 'react'
import useMangoAccount from 'hooks/useMangoAccount'

export const CHART_COLORS = {
  All: '#ff7c43',
  spacer: 'rgba(255,255,255,0.1)',
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

const DUST_THRESHOLD = 0.05

const LongShortChart = ({ type }: { type: string }) => {
  const { t } = useTranslation('common')
  const [chartData, setChartData] = useState<any>([])
  const { mangoAccount } = useMangoAccount()
  const balances = useBalances()
  const perpPositions = useMangoStore(
    (s) => s.selectedMangoAccount.perpAccounts
  )

  const netUnsettledPositionsValue = useMemo(() => {
    return perpPositions.reduce((a, c) => a + c.unsettledPnl, 0)
  }, [perpPositions])

  const getChartData = (type) => {
    const longData: any = []
    const shortData: any = []
    if (!balances.length) {
      return []
    }
    for (const { net, symbol, value } of balances) {
      let amount = Number(net)
      let totValue = Number(value)
      if (symbol === 'USDC') {
        amount += netUnsettledPositionsValue
        totValue += netUnsettledPositionsValue
      }
      if (totValue > DUST_THRESHOLD) {
        longData.push({
          asset: symbol,
          amount: amount,
          symbol: symbol,
          value: totValue,
        })
      }
      if (-totValue > DUST_THRESHOLD) {
        shortData.push({
          asset: symbol,
          amount: Math.abs(amount),
          symbol: symbol,
          value: Math.abs(totValue),
        })
      }
    }
    for (const {
      marketConfig,
      basePosition,
      notionalSize,
      perpAccount,
    } of perpPositions) {
      if (notionalSize < DUST_THRESHOLD) continue

      if (perpAccount.basePosition.gt(ZERO_BN)) {
        longData.push({
          asset: marketConfig.name,
          amount: basePosition,
          symbol: marketConfig.baseSymbol,
          value: notionalSize,
        })
      } else {
        shortData.push({
          asset: marketConfig.name,
          amount: Math.abs(basePosition),
          symbol: marketConfig.baseSymbol,
          value: notionalSize,
        })
      }
    }
    const totalLongValue = longData.reduce((a, c) => a + c.value, 0)
    const totalShortValue = shortData.reduce((a, c) => a + c.value, 0)
    const dif = totalLongValue - totalShortValue
    if (dif > 0) {
      shortData.push({ symbol: 'spacer', value: dif })
    }

    type === 'long' ? setChartData(longData) : setChartData(shortData)
  }

  const CustomToolTip = () => {
    const renderIcon = (symbol) => {
      const iconName = `${symbol.slice(0, 1)}${symbol
        .slice(1, 4)
        .toLowerCase()}MonoIcon`
      const SymbolIcon = MonoIcons[iconName] || QuestionMarkCircleIcon
      return (
        <div style={{ color: CHART_COLORS[symbol] }}>
          <SymbolIcon className={`mr-1.5 h-3.5 w-auto`} />
        </div>
      )
    }

    return chartData.length ? (
      <div className="space-y-1.5 rounded-md bg-th-bkg-2 p-3 pb-2 md:bg-th-bkg-1">
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
                    style={{ color: CHART_COLORS[symbol] }}
                  >
                    {asset}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className="mb-0 text-xs leading-none"
                    style={{ color: CHART_COLORS[symbol] }}
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

  useEffect(() => {
    if (mangoAccount && perpPositions) {
      type === 'long' ? getChartData('long') : getChartData('short')
    }
  }, [mangoAccount, perpPositions])

  return chartData.length ? (
    <div className="relative h-20 w-20">
      <PieChart width={80} height={80}>
        <Pie
          cursor="pointer"
          data={chartData}
          dataKey="value"
          cx="50%"
          cy="50%"
          outerRadius={40}
          innerRadius={28}
          minAngle={2}
          startAngle={90}
          endAngle={450}
        >
          {chartData
            .sort((a, b) => a.symbol.localeCompare(b.symbol))
            .map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CHART_COLORS[entry.symbol]}
                stroke="rgba(0,0,0,0.1)"
              />
            ))}
        </Pie>
        <Tooltip content={<CustomToolTip />} position={{ x: -220, y: 0 }} />
      </PieChart>
      <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 transform text-xs font-bold uppercase text-th-fgd-3">
        {type === 'long' ? t('long') : t('short')}
      </div>
    </div>
  ) : null
}

export default LongShortChart
