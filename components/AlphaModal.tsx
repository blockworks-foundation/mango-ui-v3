import React from 'react'
import Modal from './Modal'
import Button from './Button'
import useLocalStorageState from '../hooks/useLocalStorageState'

export const ALPHA_MODAL_KEY = 'mangoAlphaAccepted-3.03'

const AlphaModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose?: (x) => void
}) => {
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
        Welcome to Mango V3
      </div>
      <div className="text-th-fgd-2 text-center my-4">
        The v3 protocol is in public beta. This is unaudited software, use at
        your own risk.
      </div>
      <div className="text-th-fgd-2 text-center my-2">
        &#x1F642; &#129389;&#129309;
      </div>
      <div className={`text-th-fgd-2 text-center`}>
        <div className={`mt-4 flex justify-center`}>
          <Button onClick={handleAccept}>
            <div className={`flex items-center`}>Accept</div>
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default React.memo(AlphaModal)
