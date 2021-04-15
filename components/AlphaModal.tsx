import React from 'react'
import Modal from './Modal'
import Button from './Button'
import useLocalStorageState from '../hooks/useLocalStorageState'

const WithdrawModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose?: (x) => void
}) => {
  const [, setAlphaAccepted] = useLocalStorageState('mangoAlphaAccepted', false)

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header>
        <div
          className={`text-th-fgd-2 flex-grow text-center flex items-center justify-center`}
        >
          <span className="text-2xl">Mango Markets UI V2</span>
        </div>
      </Modal.Header>
      <div className={`pb-4 px-6 text-th-fgd-3`}>
        <div className={`mt-3 sm:mt-5 text-lg font-light`}>
          This is an unaudited alpha release of Mango Markets. The software is
          provided &apos;AS IS&apos; without warranty of any kind.
        </div>
        <div className={`mt-4 sm:mt-5 flex justify-end`}>
          <Button onClick={() => setAlphaAccepted(true)}>
            <div className={`flex items-center`}>Accept</div>
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default React.memo(WithdrawModal)
