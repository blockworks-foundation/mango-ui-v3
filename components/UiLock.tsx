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
        className="bg-transparent rounded w-5 h-5 hover:text-th-primary focus:outline-none"
      >
        {uiLocked ? <LockClosedIcon /> : <LockOpenIcon />}
      </button>
    </div>
  )
}

export default UiLock
