import React, { FunctionComponent } from 'react'

type SideBadgeProps = {
  side: string
}

const SideBadge: FunctionComponent<SideBadgeProps> = ({ side }) => {
  return (
    <div
      className={`rounded-md inline-block ${
        side === 'buy'
          ? 'border border-th-green text-th-green'
          : 'border border-th-red text-th-red'
      }
       px-2 py-1 text-xs`}
    >
      {side.toUpperCase()}
    </div>
  )
}

export default SideBadge
