import { useEffect, useState } from 'react'
import { RefreshClockwiseIcon } from './icons'
import { defaultLayouts, GRID_LAYOUT_KEY } from './TradePageGrid'
import useLocalStorageState from '../hooks/useLocalStorageState'
import Tooltip from './Tooltip'

const ResetLayout = ({ className = '' }) => {
  const [spin, setSpin] = useState(false)
  const [, setSavedLayouts] = useLocalStorageState(
    GRID_LAYOUT_KEY,
    defaultLayouts
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      setSpin(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [spin])

  const handleResetLayout = () => {
    setSavedLayouts(defaultLayouts)
    setSpin(true)
  }

  return (
    <div className={`inline-flex relative ${className}`}>
      <Tooltip content="Reset Layout" className="text-xs py-1">
        <button
          onClick={() => handleResetLayout()}
          className="flex items-center justify-center rounded-full bg-th-bkg-3 w-8 h-8 hover:text-th-primary focus:outline-none"
        >
          <RefreshClockwiseIcon
            className={`w-4 h-4 ${spin ? 'animate-spin' : null}`}
          />
        </button>
      </Tooltip>
    </div>
  )
}

export default ResetLayout
