import { RefreshIcon } from '@heroicons/react/outline'
import { defaultLayouts } from './TradePageGrid'
import useLocalStorageState from '../hooks/useLocalStorageState'

const ResetLayout = ({ className = '' }) => {
  const [, setSavedLayouts] = useLocalStorageState(
    'savedLayouts',
    defaultLayouts
  )

  return (
    <div className={`flex relative ${className}`}>
      <button
        onClick={() => setSavedLayouts(defaultLayouts)}
        className="flex items-center justify-center rounded-full bg-th-bkg-3 w-8 h-8 mr-4 hover:text-th-primary focus:outline-none"
      >
        <RefreshIcon className="w-5 h-5" />
      </button>
    </div>
  )
}

export default ResetLayout
