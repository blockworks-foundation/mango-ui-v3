import useFees from '../hooks/useFees'
import { percentFormat } from '../utils'
import { useTranslation } from 'next-i18next'

export default function MarketFee() {
  const { t } = useTranslation('common')
  const { takerFee, makerFee } = useFees()

  return (
    <div className="mt-2.5 flex px-6 text-xs text-th-fgd-4">
      <div className="mx-auto block text-center sm:flex">
        <div>
          {t('maker-fee')}: {percentFormat.format(makerFee)}
        </div>
        <div className="hidden px-2 sm:block">|</div>
        <div>
          {t('taker-fee')}: {percentFormat.format(takerFee)}
        </div>
      </div>
    </div>
  )
}
