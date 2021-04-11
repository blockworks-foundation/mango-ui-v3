import React from 'react'
import xw from 'xwind'

export default function FloatingElement({ shrink = false, children }) {
  return (
    <div
      css={[
        xw`m-1 p-4 border border-mango-grey-light dark:border-0 bg-white dark:bg-mango-grey-dark rounded-lg overflow-auto`,
        shrink ? null : xw`h-full`,
      ]}
    >
      {children}
    </div>
  )
}
