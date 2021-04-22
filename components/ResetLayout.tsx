import { useEffect, useState } from 'react'
import { RefreshIcon } from '@heroicons/react/outline'
import { defaultLayouts } from './TradePageGrid'
import useLocalStorageState from '../hooks/useLocalStorageState'
import Tooltip from './Tooltip'

const ResetLayout = ({ className = '' }) => {
  const [spin, setSpin] = useState(false)
  const [, setSavedLayouts] = useLocalStorageState(
    'savedLayouts',
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
    <div className={`flex relative ${className}`}>
      <Tooltip content="Reset layout">
        <button
          onClick={() => handleResetLayout()}
          className="flex items-center justify-center rounded-full bg-th-bkg-3 w-8 h-8 mr-4 hover:text-th-primary focus:outline-none"
        >
          <RefreshIcon className={`w-5 h-5 ${spin ? 'animate-spin' : null}`} />
        </button>
      </Tooltip>
    </div>
  )
}

export default ResetLayout
