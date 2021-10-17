import useFees from '../hooks/useFees'
import { percentFormat } from '../utils'
import { useTranslation } from 'next-i18next'

export default function MarketFee() {
  const { t } = useTranslation('common')
  const { takerFee, makerFee } = useFees()

  return (
    <div className="flex text-xs text-th-fgd-4 px-6 mt-2.5">
      <div className="block sm:flex mx-auto text-center">
        <div>
          {t('maker-fee')}: {percentFormat.format(makerFee)}
        </div>
        <div className="hidden sm:block px-2">|</div>
        <div>
          {t('taker-fee')}: {percentFormat.format(takerFee)}
        </div>
      </div>
    </div>
  )
}
