import { ReactNode, useEffect, useMemo, useState } from 'react'
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  ChartPieIcon,
  ScaleIcon,
} from '@heroicons/react/outline'
import { nativeToUi } from '@blockworks-foundation/mango-client/lib/utils'
import { groupBy } from '../utils'
import useMangoStore from '../stores/useMangoStore'
import useTradeHistory from '../hooks/useTradeHistory'

const calculatePNL = (tradeHistory, prices, mangoGroup) => {
  if (!tradeHistory.length) return '0.00'
  const profitAndLoss = {}
  const groupedTrades = groupBy(tradeHistory, (trade) => trade.marketName)
  if (!prices.length) return '-'

  const assetIndex = {
    'BTC/USDT': 0,
    'BTC/WUSDT': 0,
    'ETH/USDT': 1,
    'ETH/WUSDT': 1,
    'SOL/USDT': 2,
    'SOL/WUSDT': 2,
    'SRM/USDT': 3,
    'SRM/WUSDT': 3,
    USDT: 2,
    WUSDT: 2,
  }

  groupedTrades.forEach((val, key) => {
    profitAndLoss[key] = val.reduce(
      (acc, current) =>
        (current.side === 'sell' ? current.size * -1 : current.size) + acc,
      0
    )
  })

  const totalNativeUsdt = tradeHistory.reduce((acc, current) => {
    const usdtAmount =
      current.side === 'sell'
        ? parseInt(current.nativeQuantityReleased)
        : parseInt(current.nativeQuantityPaid) * -1

    return usdtAmount + acc
  }, 0)

  profitAndLoss['USDT'] = nativeToUi(
    totalNativeUsdt,
    mangoGroup.mintDecimals[2]
  )

  let total = 0
  for (const assetName in profitAndLoss) {
    total = total + profitAndLoss[assetName] * prices[assetIndex[assetName]]
  }

  return isNaN(total) ? 0 : total.toFixed(2)
}

const useMarginInfo = () => {
  const connection = useMangoStore((s) => s.connection.current)
  const selectedMangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const selectedMarginAccount = useMangoStore(
    (s) => s.selectedMarginAccount.current
  )
  const tradeHistory = useTradeHistory()
  const tradeHistoryLength = useMemo(() => tradeHistory.length, [tradeHistory])
  const [mAccountInfo, setMAccountInfo] =
    useState<
      | {
          label: string
          value: string
          unit: string
          desc: string
          currency: string
          icon: ReactNode
        }[]
      | null
    >(null)
  useEffect(() => {
    if (selectedMangoGroup) {
      selectedMangoGroup.getPrices(connection).then((prices) => {
        const collateralRatio = selectedMarginAccount
          ? selectedMarginAccount.getCollateralRatio(selectedMangoGroup, prices)
          : 200

        const accountEquity = selectedMarginAccount
          ? selectedMarginAccount.computeValue(selectedMangoGroup, prices)
          : 0
        let leverage
        if (selectedMarginAccount) {
          leverage = accountEquity
            ? (
                1 /
                (selectedMarginAccount.getCollateralRatio(
                  selectedMangoGroup,
                  prices
                ) -
                  1)
              ).toFixed(2)
            : '∞'
        } else {
          leverage = '0'
        }

        setMAccountInfo([
          {
            label: 'Account Value',
            value: accountEquity.toFixed(2),
            unit: '',
            currency: '$',
            desc: 'The value of the account',
            icon: (
              <CurrencyDollarIcon className="flex-shrink-0 h-5 w-5 mr-2 text-th-primary" />
            ),
          },
          {
            label: 'Total PNL',
            value: calculatePNL(tradeHistory, prices, selectedMangoGroup),
            unit: '',
            currency: '$',
            desc: 'Total PNL reflects trades placed after March 15th 2021 04:00 AM UTC. Visit the Learn link in the top menu for more information.',
            icon: (
              <ChartBarIcon className="flex-shrink-0 h-5 w-5 mr-2 text-th-primary" />
            ),
          },
          {
            label: 'Leverage',
            value: leverage,
            unit: 'x',
            currency: '',
            desc: 'Total position size divided by account value',
            icon: (
              <ScaleIcon className="flex-shrink-0 h-5 w-5 mr-2 text-th-primary" />
            ),
          },
          {
            // TODO: Get collaterization ratio
            label: 'Collateral Ratio',
            value:
              collateralRatio > 2 ? '>200' : (100 * collateralRatio).toFixed(0),
            unit: '%',
            currency: '',
            desc: 'The current collateral ratio',
            icon: (
              <ChartPieIcon className="flex-shrink-0 h-5 w-5 mr-2 text-th-primary" />
            ),
          },
        ])
      })
    }
  }, [selectedMarginAccount, selectedMangoGroup, tradeHistoryLength])

  return mAccountInfo
}

export default useMarginInfo
