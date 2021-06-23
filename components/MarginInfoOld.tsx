import { useEffect, useState, useMemo } from 'react'
// import { nativeToUi } from '@blockworks-foundation/mango-client/lib/utils'
import { groupBy } from '../utils'
import useTradeHistory from '../hooks/useTradeHistory'
import useMangoStore from '../stores/useMangoStore'
import FloatingElement from './FloatingElement'
import Tooltip from './Tooltip'
import Button from './Button'
import AlertsModal from './AlertsModal'

const calculatePNL = (tradeHistory, prices, mangoGroup) => {
  if (!tradeHistory.length) return '0.00'
  const profitAndLoss = {}
  const groupedTrades = groupBy(tradeHistory, (trade) => trade.marketName)
  if (!prices.length) return '-'

  const assetIndex = {
    'BTC/USDC': 0,
    'ETH/USDC': 1,
    'SOL/USDC': 2,
    'SRM/USDC': 3,
    USDC: 4,
  }

  groupedTrades.forEach((val, key) => {
    profitAndLoss[key] = val.reduce(
      (acc, current) =>
        (current.side === 'sell' ? current.size * -1 : current.size) + acc,
      0
    )
  })

  const totalNativeUSDC = tradeHistory.reduce((acc, current) => {
    const usdtAmount =
      current.side === 'sell'
        ? parseInt(current.nativeQuantityReleased)
        : parseInt(current.nativeQuantityPaid) * -1

    return usdtAmount + acc
  }, 0)

  profitAndLoss['USDC'] = nativeToUi(
    totalNativeUSDC,
    mangoGroup.mintDecimals[assetIndex['USDC']]
  )

  let total = 0
  for (const assetName in profitAndLoss) {
    total = total + profitAndLoss[assetName] * prices[assetIndex[assetName]]
  }

  return total.toFixed(2)
}

export default function MarginInfo() {
  const connection = useMangoStore((s) => s.connection.current)
  const connected = useMangoStore((s) => s.wallet.connected)
  const selectedMangoAccount = useMangoStore(
    (s) => s.selectedMangoAccount.current
  )
  const selectedMangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const tradeHistory = useTradeHistory()
  const tradeHistoryLength = useMemo(() => tradeHistory.length, [tradeHistory])
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
  const [openAlertModal, setOpenAlertModal] = useState(false)

  useEffect(() => {
    if (selectedMangoGroup) {
      selectedMangoGroup.getPrices(connection).then((prices) => {
        const collateralRatio = selectedMangoAccount
          ? selectedMangoAccount.getCollateralRatio(
              selectedMangoGroup,
              prices
            ) || 200
          : 200

        const accountEquity = selectedMangoAccount
          ? selectedMangoAccount.computeValue(selectedMangoGroup, prices)
          : 0
        let leverage
        if (selectedMangoAccount) {
          leverage = accountEquity
            ? (
                1 /
                (selectedMangoAccount.getCollateralRatio(
                  selectedMangoGroup,
                  prices
                ) -
                  1)
              ).toFixed(2)
            : '0'
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
            value: calculatePNL(tradeHistory, prices, selectedMangoGroup),
            unit: '',
            currency: '$',
            desc: 'Total PNL reflects trades placed after March 15th 2021 04:00 AM UTC. Visit the Learn link in the top menu for more information.',
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
            value: (selectedMangoGroup.maintCollRatio * 100).toFixed(0),
            unit: '%',
            currency: '',
            desc: 'The collateral ratio you must maintain to not get liquidated',
          },
          {
            label: 'Initial Collateral Ratio',
            value: (selectedMangoGroup.initCollRatio * 100).toFixed(0),
            currency: '',
            unit: '%',
            desc: 'The collateral ratio required to open a new margin position',
          },
        ])
      })
    }
  }, [selectedMangoAccount, selectedMangoGroup, tradeHistoryLength])

  return (
    <FloatingElement>
      <>
        {mAccountInfo
          ? mAccountInfo.map((entry, i) => (
              <div className={`flex justify-between pt-2 pb-2`} key={i}>
                <Tooltip content={entry.desc}>
                  <div
                    className={`cursor-help font-normal text-th-fgd-4 border-b border-th-fgd-4 border-dashed border-opacity-20 leading-4 default-transition hover:border-th-bkg-2 hover:text-th-fgd-3`}
                  >
                    {entry.label}
                  </div>
                </Tooltip>
                <div className={`text-th-fgd-1`}>
                  {entry.currency + entry.value}
                  {entry.unit}
                </div>
              </div>
            ))
          : null}
        <Button
          className="mt-4 w-full"
          disabled={!connected}
          onClick={() => setOpenAlertModal(true)}
        >
          Create Liquidation Alert
        </Button>
        {openAlertModal ? (
          <AlertsModal
            isOpen={openAlertModal}
            onClose={() => setOpenAlertModal(false)}
            mangoAccount={selectedMangoAccount}
          />
        ) : null}
      </>
    </FloatingElement>
  )
}
