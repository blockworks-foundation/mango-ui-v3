import { Popover } from 'antd'
import React, { useEffect, useState } from 'react'
import xw from 'xwind'
import { nativeToUi } from '@blockworks-foundation/mango-client/lib/utils'
import { groupBy } from '../utils'
import useTradeHistory from '../hooks/useTradeHistory'
import useConnection from '../hooks/useConnection'
import FloatingElement from './FloatingElement'
import useMarginAccount from '../hooks/useMarginAcccount'

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

  return total.toFixed(2)
}

export default function MarginInfo() {
  console.log('loading margin info')

  const { connection } = useConnection()
  const { marginAccount, mangoGroup } = useMarginAccount()
  const [mAccountInfo, setMAccountInfo] = useState<
    | {
        label: string
        value: string
        unit: string
        desc: string
        currency: string
      }[]
    | null
  >(null)
  const { tradeHistory } = useTradeHistory()

  useEffect(() => {
    if (mangoGroup) {
      mangoGroup.getPrices(connection).then((prices) => {
        const collateralRatio = marginAccount
          ? marginAccount.getCollateralRatio(mangoGroup, prices)
          : 200

        const accountEquity = marginAccount
          ? marginAccount.computeValue(mangoGroup, prices)
          : 0
        let leverage
        if (marginAccount) {
          leverage = accountEquity
            ? (
                1 /
                (marginAccount.getCollateralRatio(mangoGroup, prices) - 1)
              ).toFixed(2)
            : '∞'
        } else {
          leverage = '0'
        }

        setMAccountInfo([
          {
            label: 'Equity',
            value: accountEquity.toFixed(2),
            unit: '',
            currency: '$',
            desc: 'The value of the account',
          },
          {
            label: 'Leverage',
            value: leverage,
            unit: 'x',
            currency: '',
            desc: 'Total position size divided by account value',
          },
          {
            label: 'Total PNL',
            value: calculatePNL(tradeHistory, prices, mangoGroup),
            unit: '',
            currency: '$',
            desc:
              'Total PNL reflects trades placed after March 15th 2021 04:00 AM UTC. Visit the Learn link in the top menu for more information.',
          },
          {
            // TODO: Get collaterization ratio
            label: 'Collateral Ratio',
            value:
              collateralRatio > 2 ? '>200' : (100 * collateralRatio).toFixed(0),
            unit: '%',
            currency: '',
            desc: 'The current collateral ratio',
          },
          {
            label: 'Maint. Collateral Ratio',
            value: (mangoGroup.maintCollRatio * 100).toFixed(0),
            unit: '%',
            currency: '',
            desc:
              'The collateral ratio you must maintain to not get liquidated',
          },
          {
            label: 'Initial Collateral Ratio',
            value: (mangoGroup.initCollRatio * 100).toFixed(0),
            currency: '',
            unit: '%',
            desc: 'The collateral ratio required to open a new margin position',
          },
        ])
      })
    }
    // eslint-disable-next-line
  }, [marginAccount, mangoGroup])
  return (
    <FloatingElement>
      <React.Fragment>
        {mAccountInfo
          ? mAccountInfo.map((entry, i) => (
              <div css={xw`flex justify-between pt-2 pb-3`} key={i}>
                <Popover
                  content={entry.desc}
                  placement="topLeft"
                  trigger="hover"
                >
                  <div css={xw`cursor-help text-gray-300`}>{entry.label}</div>
                </Popover>
                <div css={xw`text-gray-300 font-light`}>
                  {entry.currency + entry.value}
                  {entry.unit}
                </div>
              </div>
            ))
          : null}
      </React.Fragment>
    </FloatingElement>
  )
}
