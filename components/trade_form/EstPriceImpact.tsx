import { InformationCircleIcon } from '@heroicons/react/outline'
import Tippy from '@tippyjs/react'
import 'tippy.js/animations/scale.css'

const priceImpact = {
  slippage: [10.1, 0.2],
  makerFee: [0.0, 0.0],
  takerFee: [2.3, 0.13],
}

const EstPriceImpact = () => {
  const priceImpactTotal = Object.values(priceImpact).reduce(
    (t, c) => t + c[0],
    0
  )
  const priceImpactPercent =
    Object.values(priceImpact).reduce((t, c) => t + c[1], 0) / 3
  return (
    <div
      className={`border-t border-th-bkg-4 flex items-center justify-center mt-2 pt-2 text-th-fgd-3 text-xs`}
    >
      Est. Price Impact:
      <span
        className={`font-bold ml-2 ${
          priceImpactPercent <= 0.5
            ? 'text-th-green'
            : priceImpactPercent > 0.5 && priceImpactPercent <= 2
            ? 'text-th-orange'
            : 'text-th-red'
        }`}
      >
        ${priceImpactTotal.toFixed(2)}
        <span className="mx-2 text-th-fgd-4">|</span>
        {priceImpactPercent.toFixed(2)}%
      </span>
      <Tippy
        animation="scale"
        placement="top"
        appendTo={() => document.body}
        maxWidth="20rem"
        interactive
        delay={0}
        content={
          <div
            className={`rounded p-4 text-xs bg-th-bkg-3 leading-4 shadow-md text-th-fgd-3 outline-none space-y-1.5 w-56 focus:outline-none`}
          >
            <div className="flex justify-between">
              Est. Slippage:
              <span className="text-th-fgd-1">
                ${priceImpact.slippage[0]}
                <span className="px-1 text-th-fgd-4">|</span>
                {priceImpact.slippage[1]}%
              </span>
            </div>
            <div className="flex justify-between">
              Maker Fee:
              <span className="text-th-fgd-1">
                ${priceImpact.makerFee[0]}
                <span className="px-1 text-th-fgd-4">|</span>
                {priceImpact.makerFee[1]}%
              </span>
            </div>
            <div className="flex justify-between">
              Taker Fee:
              <span className="text-th-fgd-1">
                ${priceImpact.takerFee[0]}
                <span className="px-1 text-th-fgd-4">|</span>
                {priceImpact.takerFee[1]}%
              </span>
            </div>
          </div>
        }
      >
        <div className="outline-none focus:outline-none">
          <InformationCircleIcon className="h-5 w-5 ml-2 text-th-primary" />
        </div>
      </Tippy>
    </div>
  )
}

export default EstPriceImpact
