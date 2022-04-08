import { useTranslation } from 'next-i18next'
import React from 'react'
import { percentFormat } from 'utils'

export const Fees: React.FC<{ makerFee: number; takerFee: number }> = ({
  makerFee,
  takerFee,
}) => {
  const { t } = useTranslation('common')

  return (
    <div className="mt-2.5 flex flex-col items-center justify-center px-6 text-xs text-th-fgd-4 md:flex-row">
      <div>
        {t('maker-fee')}: {percentFormat.format(makerFee)}{' '}
      </div>
      <span className="hidden md:block md:px-1">|</span>
      <div>
        {' '}
        {t('taker-fee')}: {percentFormat.format(takerFee)}
      </div>
    </div>
  )
}
