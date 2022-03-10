import React, { ReactNode } from 'react'
import Tippy from '@tippyjs/react'
import 'tippy.js/animations/scale.css'

type TooltipProps = {
  content: ReactNode
  placement?: any
  className?: string
  children?: ReactNode
  delay?: number
}

const Tooltip = ({
  children,
  content,
  className,
  placement = 'top',
  delay = 0,
}: TooltipProps) => {
  return (
    <Tippy
      animation="scale"
      placement={placement}
      appendTo={() => document.body}
      maxWidth="20rem"
      interactive
      delay={delay}
      content={
        content ? (
          <div
            className={`rounded bg-th-bkg-3 p-2.5 text-xs leading-4 text-th-fgd-3 shadow-md outline-none focus:outline-none ${className}`}
          >
            {content}
          </div>
        ) : null
      }
    >
      <div className="outline-none focus:outline-none">{children}</div>
    </Tippy>
  )
}

const Content = ({ className = '', children }) => {
  return (
    <div
      className={`default-transition inline-block cursor-help border-b border-dashed border-th-fgd-3 border-opacity-20 hover:border-th-bkg-2 ${className}`}
    >
      {children}
    </div>
  )
}

Tooltip.Content = Content

export default Tooltip
