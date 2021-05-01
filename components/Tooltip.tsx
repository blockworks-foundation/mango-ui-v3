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
      maxWidth="20rem"
      interactive
      content={
        <div
          className={`rounded p-3 text-xs bg-th-bkg-3 leading-5 shadow-md text-th-fgd-3 outline-none focus:outline-none ${className}`}
        >
          {content}
        </div>
      }
    >
      <div className="outline-none focus:outline-none">{children}</div>
    </Tippy>
  )
}

export default Tooltip
