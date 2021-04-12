import React from 'react'

export default function FloatingElement({ shrink = false, children }) {
  return (
    <div
      className={`m-1 p-4 bg-th-bkg-2 rounded-lg overflow-auto ${
        shrink ? null : `h-full`
      }`}
    >
      {children}
    </div>
  )
}
