import React, { FunctionComponent, ReactNode } from 'react'
import Tippy from '@tippyjs/react'
import 'tippy.js/animations/scale.css'

type TooltipProps = {
  content: ReactNode
  className?: string
}

const Tooltip: FunctionComponent<TooltipProps> = ({
  children,
  content,
  className,
}) => {
  return (
    <Tippy
      animation="scale"
      appendTo={() => document.body}
      maxWidth="30rem"
      interactive
      content={
        <div
          className={`rounded p-3 text-sm bg-th-bkg-3 shadow-md text-th-fgd-2 outline-none focus:outline-none ${className}`}
        >
          {content}
        </div>
      }
    >
      <button className="outline-none focus:outline-none">{children}</button>
    </Tippy>
  )
}

export default Tooltip
