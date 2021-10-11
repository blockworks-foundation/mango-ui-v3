import { InformationCircleIcon } from '@heroicons/react/outline'
import Tippy from '@tippyjs/react'
import 'tippy.js/animations/scale.css'
import { percentFormat } from '../../utils'

const EstPriceImpact = ({
  priceImpact,
}: {
  priceImpact?: { slippage: number[]; takerFee: number[] }
}) => {
  const priceImpactAbs = priceImpact.slippage[0]
  const priceImpactRel = priceImpact.slippage[1]

  return (
    <div
      className={`border-t border-th-bkg-4 flex items-center justify-center mt-2 pt-2 text-th-fgd-4 text-xs`}
    >
      Est. Price Impact:
      <span
        className={`font-bold opacity-80 ml-2 ${
          priceImpactRel <= 0.005
            ? 'text-th-green'
            : priceImpactRel > 0.005 && priceImpactRel <= 0.01
            ? 'text-th-orange'
            : 'text-th-red'
        }`}
      >
        ${priceImpactAbs.toFixed(2)}
        <span className="mx-1 text-th-fgd-4">|</span>
        {percentFormat.format(priceImpactRel)}
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
                ${priceImpact.slippage[0].toFixed(2)}
                <span className="px-1 text-th-fgd-4">|</span>
                {percentFormat.format(priceImpact.slippage[1])}
              </span>
            </div>
            {/* <div className="flex justify-between">
              Maker Fee:
              <span className="text-th-fgd-1">
                ${priceImpact.makerFee[0]}
                <span className="px-1 text-th-fgd-4">|</span>
                {priceImpact.makerFee[1].toFixed(2)}%
              </span>
            </div> */}
            <div className="flex justify-between">
              Taker Fee:
              <span className="text-th-fgd-1">
                ${priceImpact.takerFee[0].toFixed(2)}
                <span className="px-1 text-th-fgd-4">|</span>
                {percentFormat.format(priceImpact.takerFee[1])}
              </span>
            </div>
          </div>
        }
      >
        <div className="outline-none focus:outline-none">
          <InformationCircleIcon className="h-5 w-5 ml-2 text-th-primary opacity-70" />
        </div>
      </Tippy>
    </div>
  )
}

export default EstPriceImpact
