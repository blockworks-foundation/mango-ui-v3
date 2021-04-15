import { LockClosedIcon, LockOpenIcon } from '@heroicons/react/outline'
import useMangoStore from '../stores/useMangoStore'

const UiLock = ({ className = '' }) => {
  const set = useMangoStore((s) => s.set)
  const uiLocked = useMangoStore((s) => s.settings.uiLocked)

  const handleClick = () => {
    set((state) => {
      state.settings.uiLocked = !uiLocked
    })
  }

  return (
    <div className={`flex relative ${className}`}>
      <button
        onClick={handleClick}
        className="w-10 h-10 flex items-center justify-center hover:text-th-primary rounded-mdbg-transparent rounded hover:text-th-primary focus:outline-none"
      >
        {uiLocked ? (
          <LockClosedIcon className="w-5 h-5" />
        ) : (
          <LockOpenIcon className="w-5 h-5" />
        )}
      </button>
    </div>
  )
}

export default UiLock
