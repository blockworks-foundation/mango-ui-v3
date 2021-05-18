import { TemplateIcon } from '@heroicons/react/outline'
import { defaultLayouts, GRID_LAYOUT_KEY } from './TradePageGrid'
import useLocalStorageState from '../hooks/useLocalStorageState'
import Tooltip from './Tooltip'

const ResetLayout = ({ className = '' }) => {
  const [, setSavedLayouts] = useLocalStorageState(
    GRID_LAYOUT_KEY,
    defaultLayouts
  )

  const handleResetLayout = () => {
    setSavedLayouts(defaultLayouts)
  }

  return (
    <div className={`inline-flex relative ${className}`}>
      <Tooltip content="Reset Layout" className="text-xs py-1">
        <button
          onClick={() => handleResetLayout()}
          className="flex items-center justify-center rounded-full bg-th-bkg-3 w-8 h-8 hover:text-th-primary focus:outline-none"
        >
          <TemplateIcon className="w-4 h-4" />
        </button>
      </Tooltip>
    </div>
  )
}

export default ResetLayout
