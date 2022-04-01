import { ExclamationIcon } from '@heroicons/react/outline'
import { useTranslation } from 'next-i18next'
import React from 'react'

export const SlippageWarning: React.FC<{ show: boolean }> = ({ show }) => {
  const { t } = useTranslation('common')

  if (!show) {
    return null
  }

  return (
    <div className="mt-1 flex items-center text-th-red">
      <div>
        <ExclamationIcon className="mr-2 h-5 w-5" />
      </div>
      <div className="text-xs">{t('slippage-warning')}</div>
    </div>
  )
}
