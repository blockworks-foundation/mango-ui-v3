import { LinkButton } from 'components/Button'
import Tooltip from 'components/Tooltip'
import { useTranslation } from 'next-i18next'
import React from 'react'
import { InformationCircleIcon } from '@heroicons/react/outline'

export const PerpMarketMaxSlippage: React.FC<{
  show: boolean
  maxSlippage: string | null
  onClickEdit: () => void
}> = ({ maxSlippage, show, onClickEdit }) => {
  const { t } = useTranslation('common')

  if (!show) {
    return null
  }

  return (
    <div className="mb-1 flex justify-between text-xs text-th-fgd-3">
      <div className="flex items-center">
        {t('max-slippage')}
        <Tooltip content={t('tooltip-slippage')}>
          <div className="outline-none focus:outline-none">
            <InformationCircleIcon className="ml-1.5 h-4 w-4 text-th-fgd-3" />
          </div>
        </Tooltip>
      </div>
      <div className="flex">
        {maxSlippage ? (
          <span className="text-th-fgd-1">
            {(parseFloat(maxSlippage) * 100).toFixed(2)}%
          </span>
        ) : null}
        <LinkButton className="ml-2 text-xs" onClick={onClickEdit}>
          {t('edit')}
        </LinkButton>
      </div>
    </div>
  )
}
