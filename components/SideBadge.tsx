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
       px-1.5 py-0.5 -my-0.5 text-xs uppercase`}
    >
      {t(side)}
    </div>
  )
}

export default SideBadge
