import React from 'react'
import Modal from './Modal'
import Button from './Button'
import useLocalStorageState from '../hooks/useLocalStorageState'

const AlphaModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose?: (x) => void
}) => {
  const [, setAlphaAccepted] = useLocalStorageState(
    'mangoAlphaAccepted-2.0',
    false
  )

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
        Perps are now available!
      </div>
      <div className="text-th-fgd-2 text-center my-4">
        Welcome to V3 Alpha. Mango Markets is unaudited software, use at your
        own risk. Have fun, dont get liquidated, or do, we need to test that :)
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
