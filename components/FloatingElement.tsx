import React, { FunctionComponent } from 'react'

type FloatingElementProps = {
  className?: string
}

const FloatingElement: FunctionComponent<FloatingElementProps> = ({
  className,
  children,
}) => {
  return (
    <div
      className={`p-2 h-full bg-th-bkg-2 rounded-lg overflow-hidden ${className}`}
    >
      <div className="h-full overflow-auto thin-scroll p-2">{children}</div>
    </div>
  )
}

export default FloatingElement
