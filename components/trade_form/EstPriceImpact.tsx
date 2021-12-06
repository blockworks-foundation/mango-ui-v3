import { percentFormat } from '../../utils'
import { useTranslation } from 'next-i18next'

const EstPriceImpact = ({
  priceImpact,
}: {
  priceImpact?: { slippage: number[]; takerFee: number[] }
}) => {
  const { t } = useTranslation('common')
  const priceImpactAbs = priceImpact.slippage[0]
  const priceImpactRel = priceImpact.slippage[1]

  return (
    <div className={`text-th-fgd-3 text-xs`}>
      <div className="flex justify-between mb-1">
        {t('slippage')}
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
      </div>
      <div className="flex justify-between">
        {t('taker-fee')}
        <span className="text-th-fgd-1">
          ${priceImpact.takerFee[0].toFixed(2)}
          <span className="px-1 text-th-fgd-4">|</span>
          {percentFormat.format(priceImpact.takerFee[1])}
        </span>
      </div>
    </div>
  )
}

export default EstPriceImpact
