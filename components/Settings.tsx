import { useEffect, useState } from 'react'
import { CogIcon } from '@heroicons/react/solid'
import SettingsModal from './SettingsModal'

const Settings = () => {
  const [mounted, setMounted] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  // When mounted on client, now we can show the UI
  useEffect(() => setMounted(true), [])

  return mounted ? (
    <>
      <button
        className="bg-th-bkg-4 flex items-center justify-center rounded-full w-8 h-8 text-th-fgd-1 focus:outline-none hover:text-th-primary"
        onClick={() => setShowSettingsModal(true)}
      >
        <CogIcon className="h-4 w-4" />
      </button>
      {showSettingsModal ? (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
          isOpen={showSettingsModal}
        />
      ) : null}
    </>
  ) : (
    <div className="bg-th-bkg-3 rounded-full w-8 h-8" />
  )
}

export default Settings
