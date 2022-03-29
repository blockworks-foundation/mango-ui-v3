import React, { useState } from 'react'
import { CheckCircleIcon } from '@heroicons/react/outline'
import Modal from './Modal'
import Button from './Button'
import useLocalStorageState from '../hooks/useLocalStorageState'
import { useTranslation } from 'next-i18next'
import Checkbox from './Checkbox'
import { SHOW_TOUR_KEY } from './IntroTips'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from './TradePageGrid'
import { useRouter } from 'next/router'
import { LANGS } from './SettingsModal'
import { RadioGroup } from '@headlessui/react'

export const ALPHA_MODAL_KEY = 'mangoAlphaAccepted-3.06'

const AlphaModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose?: (x) => void
}) => {
  const { t } = useTranslation('common')
  const [acceptRisks, setAcceptRisks] = useState(false)
  const [, setAlphaAccepted] = useLocalStorageState(ALPHA_MODAL_KEY, false)
  const [, setShowTips] = useLocalStorageState(SHOW_TOUR_KEY, false)
  const [savedLanguage, setSavedLanguage] = useLocalStorageState('language', '')
  const [language, setLanguage] = useState('en')
  const router = useRouter()
  const { pathname, asPath, query } = router
  const { width } = useViewport()
  const hideTips = width ? width < breakpoints.md : false

  const handleLanguageSelect = () => {
    setSavedLanguage(language)
    router.push({ pathname, query }, asPath, { locale: language })
  }

  const handleGetStarted = () => {
    setAlphaAccepted(true)
  }

  const handleTakeTour = () => {
    setAlphaAccepted(true)
    setShowTips(true)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} hideClose>
      <Modal.Header>
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center space-x-8">
            <img
              className={`h-12 w-auto`}
              src="/assets/icons/logo.svg"
              alt="next"
            />
          </div>
        </div>
      </Modal.Header>
      <h1 className="relative m-auto mb-4 w-max">
        {t('v3-welcome')}
        <span className="absolute -right-8 -top-1 w-max rounded-full bg-th-primary px-1.5 py-0.5 text-xs font-bold text-black">
          V3
        </span>
      </h1>
      {savedLanguage ? (
        <>
          <div className="space-y-3 rounded-md bg-th-bkg-3 p-4">
            <div className="flex items-center text-th-fgd-1">
              <CheckCircleIcon className="mr-2 h-5 w-5 flex-shrink-0 text-th-green" />
              {t('intro-feature-1')}
            </div>
            <div className="flex items-center text-th-fgd-1">
              <CheckCircleIcon className="mr-2 h-5 w-5 flex-shrink-0 text-th-green" />
              {t('intro-feature-2')}
            </div>
            <div className="flex items-center text-th-fgd-1">
              <CheckCircleIcon className="mr-2 h-5 w-5 flex-shrink-0 text-th-green" />
              {t('intro-feature-3')}
            </div>
            <div className="flex items-center text-th-fgd-1">
              <CheckCircleIcon className="mr-2 h-5 w-5 flex-shrink-0 text-th-green" />
              {t('intro-feature-4')}
            </div>
          </div>
          <div className="mt-4 px-6 text-center text-th-fgd-3">
            {t('v3-unaudited')}
          </div>
          <div className="mt-4 rounded-md border border-th-fgd-4 p-3">
            <Checkbox
              checked={acceptRisks}
              onChange={(e) => setAcceptRisks(e.target.checked)}
            >
              {t('accept-terms')}
            </Checkbox>
          </div>
          <div className={`mt-6 flex justify-center space-x-4`}>
            <Button
              className="w-40"
              disabled={!acceptRisks}
              onClick={handleGetStarted}
            >
              {t('get-started')}
            </Button>
            {!hideTips ? (
              <Button
                className="w-40"
                disabled={!acceptRisks}
                onClick={handleTakeTour}
              >
                {t('show-tips')}
              </Button>
            ) : null}
          </div>
        </>
      ) : (
        <div className="pt-2">
          <RadioGroup value={language} onChange={setLanguage}>
            {LANGS.map((l) => (
              <RadioGroup.Option className="" key={l.locale} value={l.locale}>
                {({ checked }) => (
                  <div
                    className={`border ${
                      checked ? 'border-th-primary' : 'border-th-fgd-4'
                    } default-transition mb-2 flex cursor-pointer items-center rounded-md p-3 text-th-fgd-1 hover:border-th-primary`}
                  >
                    <CheckCircleIcon
                      className={`mr-2 h-5 w-5 ${
                        checked ? 'text-th-primary' : 'text-th-fgd-4'
                      }`}
                    />
                    <span>{t(l.name.toLowerCase())}</span>
                  </div>
                )}
              </RadioGroup.Option>
            ))}
          </RadioGroup>
          <div className="flex justify-center pt-4">
            <Button onClick={() => handleLanguageSelect()}>Save</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default React.memo(AlphaModal)
