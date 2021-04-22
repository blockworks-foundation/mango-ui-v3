import { LockClosedIcon, LockOpenIcon } from '@heroicons/react/outline'
import { Transition } from '@headlessui/react'
import useMangoStore from '../stores/useMangoStore'
import ResetLayout from './ResetLayout'

const UiLock = ({ className = '' }) => {
  const set = useMangoStore((s) => s.set)
  const uiLocked = useMangoStore((s) => s.settings.uiLocked)

  const handleClick = () => {
    set((state) => {
      state.settings.uiLocked = !uiLocked
    })
  }

  return (
    <>
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
        >
          <ResetLayout />
        </Transition>
      ) : null}
      <div className={`${className} flex relative`}>
        <button
          onClick={handleClick}
          className="flex items-center justify-center rounded-full bg-th-bkg-3 w-8 h-8 mr-4 hover:text-th-primary focus:outline-none"
        >
          {uiLocked ? (
            <LockClosedIcon className="w-5 h-5" />
          ) : (
            <LockOpenIcon className="w-5 h-5 animate-bounce" />
          )}
        </button>
      </div>
    </>
  )
}

export default UiLock
