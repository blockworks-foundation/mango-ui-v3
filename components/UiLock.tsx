import { LockClosedIcon, LockOpenIcon } from '@heroicons/react/outline'
import { Transition } from '@headlessui/react'
import useMangoStore from '../stores/useMangoStore'
import ResetLayout from './ResetLayout'
import Tooltip from './Tooltip'

const UiLock = ({ className = '' }) => {
  const set = useMangoStore((s) => s.set)
  const uiLocked = useMangoStore((s) => s.settings.uiLocked)

  const handleClick = () => {
    set((state) => {
      state.settings.uiLocked = !uiLocked
    })
  }

  return (
    <div className="flex">
      {!uiLocked ? (
        <Transition
          appear={true}
          show={!uiLocked}
          enter="transition-opacity duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          className="pr-2"
        >
          <ResetLayout />
        </Transition>
      ) : null}
      <div className={`${className} flex relative cursor-pointer`}>
        <Tooltip
          content={uiLocked ? 'Unlock Layout' : 'Lock Layout'}
          className="text-xs py-1"
        >
          <div
            onClick={handleClick}
            className="flex items-center justify-center rounded-full bg-th-bkg-3 w-8 h-8 default-transition hover:text-th-primary focus:outline-none"
          >
            {uiLocked ? (
              <LockClosedIcon className="w-4 h-4" />
            ) : (
              <LockOpenIcon className="w-4 h-4 animate-bounce" />
            )}
          </div>
        </Tooltip>
      </div>
    </div>
  )
}

export default UiLock
