import React, { FunctionComponent } from 'react'
import { useTranslation } from 'next-i18next'

type SideBadgeProps = {
  side: string
}

const SideBadge: FunctionComponent<SideBadgeProps> = ({ side }) => {
  const { t } = useTranslation('common')

  return (
    <div
      className={`rounded inline-block ${
        side === 'buy' || side === 'long'
          ? 'border border-th-green text-th-green'
          : 'border border-th-red text-th-red'
      }
       px-2 py-1 text-xs`}
    >
      {t(side)?.toUpperCase()}
    </div>
  )
}

export default SideBadge
