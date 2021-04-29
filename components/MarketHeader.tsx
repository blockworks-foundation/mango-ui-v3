import React from 'react'
import useMangoStore from '../stores/useMangoStore'
import useMarkPrice from '../hooks/useMarkPrice'
import usePrevious from '../hooks/usePrevious'
import { isEqual } from '../utils/'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/solid'
import UiLock from './UiLock'

const MarketHeader = () => {
  const selectedMarketName = useMangoStore((s) => s.selectedMarket.name)
  const markPrice = useMarkPrice()

  return (
    <div className={`flex items-center justify-between pt-4 px-4 sm:px-10`}>
      <div className="flex items-center">
        <img
          alt=""
          width="32"
          height="32"
          src={`/assets/icons/${selectedMarketName
            .split('/')[0]
            .toLowerCase()}.svg`}
          className={`mr-3`}
        />
        <div className={`font-semibold text-lg pr-4`}>{selectedMarketName}</div>
        <div className={`text-lg pr-4`}>{markPrice}</div>
        <ChangePercentage change={markPrice} />
      </div>
      <div className="flex items-center justify-center rounded-full bg-th-bkg-3 w-8 h-8">
        <UiLock />
      </div>
    </div>
  )
}

export default MarketHeader

const ChangePercentage = React.memo<{ change: number }>(
  ({ change }) => {
    const previousChange: number = usePrevious(change)

    return (
      <div
        className={`flex justify-center items-center font-semibold mt-1 ${
          change > previousChange
            ? `text-th-green`
            : change < previousChange
            ? `text-th-red`
            : `text-th-fgd-1`
        }`}
      >
        {change > previousChange && (
          <ArrowUpIcon className={`h-4 w-4 mr-1 text-th-green`} />
        )}
        {change < previousChange && (
          <ArrowDownIcon className={`h-4 w-4 mr-1 text-th-red`} />
        )}
        {change === previousChange && <div className={`h-4 w-4 mr-1`} />}
        {`${change}%` || '--'}
      </div>
    )
  },
  (prevProps, nextProps) => isEqual(prevProps, nextProps, ['change'])
)
