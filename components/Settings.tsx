import { useEffect, useState } from 'react'
import { CogIcon } from '@heroicons/react/outline'
import SettingsModal from './SettingsModal'
import Tooltip from './Tooltip'
import { useTranslation } from 'next-i18next'

const Settings = () => {
  const { t } = useTranslation('common')
  const [mounted, setMounted] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  // When mounted on client, now we can show the UI
  useEffect(() => setMounted(true), [])

  return mounted ? (
    <>
      <Tooltip className="text-xs py-1" content={t('settings')}>
        <button
          className="bg-th-bkg-4 flex items-center justify-center rounded-full w-8 h-8 text-th-fgd-1 focus:outline-none hover:text-th-primary"
          onClick={() => setShowSettingsModal(true)}
        >
          <CogIcon className="h-5 w-5" />
        </button>
      </Tooltip>
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
