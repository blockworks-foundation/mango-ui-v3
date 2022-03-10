import { useEffect, useState } from 'react'
import { CogIcon } from '@heroicons/react/outline'
import SettingsModal from './SettingsModal'

const Settings = () => {
  const [mounted, setMounted] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  // When mounted on client, now we can show the UI
  useEffect(() => setMounted(true), [])

  return mounted ? (
    <>
      <button
        className="default-transition flex h-8 w-8 items-center justify-center rounded-full bg-th-bkg-4 text-th-fgd-1 hover:text-th-primary focus:outline-none"
        onClick={() => setShowSettingsModal(true)}
      >
        <CogIcon className="h-5 w-5" />
      </button>
      {showSettingsModal ? (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
          isOpen={showSettingsModal}
        />
      ) : null}
    </>
  ) : (
    <div className="h-8 w-8 rounded-full bg-th-bkg-3" />
  )
}

export default Settings
