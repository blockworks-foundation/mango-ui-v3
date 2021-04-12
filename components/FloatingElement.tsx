import React from 'react'
import xw from 'xwind'

export default function FloatingElement({ shrink = false, children }) {
  return (
    <div
      css={[
        xw`m-1 p-4 bg-th-bkg-2 rounded-lg overflow-auto`,
        shrink ? null : xw`h-full`,
      ]}
    >
      {children}
    </div>
  )
}
