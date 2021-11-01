import React, { useEffect, useState } from 'react'
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
import { LANGS } from './LanguageSwitch'
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
  const router = useRouter()
  const { pathname, asPath, query } = router
  const { width } = useViewport()
  const hideTips = width ? width < breakpoints.md : false

  useEffect(() => {
    savedLanguage
      ? router.push({ pathname, query }, asPath, { locale: savedLanguage })
      : null
  }, [savedLanguage])

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
          <div className="flex space-x-8 items-center justify-center">
            <img
              className={`h-12 w-auto`}
              src="/assets/icons/logo.svg"
              alt="next"
            />
          </div>
        </div>
      </Modal.Header>
      <h1 className="m-auto mb-4 relative w-max">
        {t('v3-welcome')}
        <span className="absolute bg-th-primary font-bold px-1.5 py-0.5 -right-8 rounded-full text-black text-xs -top-1 w-max">
          V3
        </span>
      </h1>
      {savedLanguage ? (
        <>
          <div className="bg-th-bkg-3 p-4 space-y-3 rounded-md">
            <div className="flex items-center text-th-fgd-1">
              <CheckCircleIcon className="flex-shrink-0 h-5 mr-2 text-th-green w-5" />
              Cross‑collateralized leverage trading
            </div>
            <div className="flex items-center text-th-fgd-1">
              <CheckCircleIcon className="flex-shrink-0 h-5 mr-2 text-th-green w-5" />
              All assets count as collateral to trade or borrow
            </div>
            <div className="flex items-center text-th-fgd-1">
              <CheckCircleIcon className="flex-shrink-0 h-5 mr-2 text-th-green w-5" />
              Deposit any asset and earn interest automatically
            </div>
            <div className="flex items-center text-th-fgd-1">
              <CheckCircleIcon className="flex-shrink-0 h-5 mr-2 text-th-green w-5" />
              Borrow against your assets for other DeFi activities
            </div>
          </div>
          <div className="px-6 text-th-fgd-3 text-center mt-4">
            {t('v3-unaudited')}
          </div>
          <div className="border border-th-fgd-4 mt-4 p-3 rounded-md">
            <Checkbox
              checked={acceptRisks}
              onChange={(e) => setAcceptRisks(e.target.checked)}
            >
              I understand and accept the risks
            </Checkbox>
          </div>
          <div className={`mt-6 flex justify-center space-x-4`}>
            <Button
              className="w-40"
              disabled={!acceptRisks}
              onClick={handleGetStarted}
            >
              Get Started
            </Button>
            {!hideTips ? (
              <Button
                className="w-40"
                disabled={!acceptRisks}
                onClick={handleTakeTour}
              >
                Show Tips
              </Button>
            ) : null}
          </div>
        </>
      ) : (
        <div className="pt-2">
          <RadioGroup value={savedLanguage} onChange={setSavedLanguage}>
            {LANGS.map((l) => (
              <RadioGroup.Option
                className="border border-th-fgd-4 cursor-pointer default-transition mb-2 p-3 rounded-md text-th-fgd-1 hover:border-th-primary"
                key={l.locale}
                value={l.locale}
              >
                {({ checked }) => (
                  <div className="flex items-center">
                    <CheckCircleIcon
                      className={`h-5 mr-2 w-5 ${
                        checked ? 'text-th-green' : 'text-th-fgd-4'
                      }`}
                    />
                    <span>{t(l.name.toLowerCase())}</span>
                  </div>
                )}
              </RadioGroup.Option>
            ))}
          </RadioGroup>
        </div>
      )}
    </Modal>
  )
}

export default React.memo(AlphaModal)
