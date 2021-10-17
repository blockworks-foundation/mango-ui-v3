import React from 'react'
import Modal from './Modal'
import Button from './Button'
import useLocalStorageState from '../hooks/useLocalStorageState'
import { useTranslation } from 'next-i18next'

export const ALPHA_MODAL_KEY = 'mangoAlphaAccepted-3.06'

const AlphaModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose?: (x) => void
}) => {
  const { t } = useTranslation('common')
  const [, setAlphaAccepted] = useLocalStorageState(ALPHA_MODAL_KEY, false)

  const handleAccept = () => {
    setAlphaAccepted(true)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} hideClose>
      <Modal.Header>
        <div className="flex flex-col items-center">
          <div className="flex space-x-8 items-center justify-center ">
            <img
              className={`h-12 w-auto`}
              src="/assets/icons/logo.svg"
              alt="next"
            />
          </div>
        </div>
      </Modal.Header>
      <div className={`text-th-fgd-2 text-center text-xl text-strong`}>
        {t('v3-welcome')}
      </div>
      <div className="text-th-fgd-2 text-center my-4">{t('v3-unaudited')}</div>
      <div className="text-th-fgd-2 text-center my-4">
        {t('v3-new')}{' '}
        <a
          href="https://v2.mango.markets"
          target="_blank"
          rel="noopener noreferrer"
        >
          https://v2.mango.markets
        </a>
      </div>
      <div className="text-th-fgd-2 text-center my-2">
        &#x1F642; &#129389;&#129309;
      </div>
      <div className={`text-th-fgd-2 text-center`}>
        <div className={`mt-4 flex justify-center`}>
          <Button onClick={handleAccept}>
            <div className={`flex items-center`}>{t('accept')}</div>
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default React.memo(AlphaModal)
