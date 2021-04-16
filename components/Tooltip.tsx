import React, {
  FunctionComponent,
  ReactNode,
  useState,
  useEffect,
  useRef,
} from 'react'
import Tippy from '@tippyjs/react'
import 'tippy.js/animations/scale.css'

type TooltipProps = {
  content: ReactNode
  selector?: string
}

const Tooltip: FunctionComponent<TooltipProps> = ({
  children,
  content,
  selector = '#tooltip',
}) => {
  const ref = useRef()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    ref.current = document.querySelector(selector)
    setMounted(true)
  }, [selector])
  console.log('selector', selector, mounted)

  return (
    <Tippy
      animation="scale"
      appendTo={document.body}
      maxWidth="none"
      interactive
      content={
        <div className="rounded p-3 text-sm bg-th-bkg-3 text-th-fgd-2 outline-none focus:outline-none">
          {content}
        </div>
      }
    >
      <button className="outline-none focus:outline-none">{children}</button>
    </Tippy>
  )
}

export default Tooltip
