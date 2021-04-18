import React from 'react'
import Modal from './Modal'
import Button from './Button'
import { ElementTitle } from './styles'
import useLocalStorageState from '../hooks/useLocalStorageState'

const AlphaModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose?: (x) => void
}) => {
  const [, setAlphaAccepted] = useLocalStorageState('mangoAlphaAccepted', false)

  return (
    <Modal isOpen={isOpen} onClose={onClose} hideClose>
      <Modal.Header>
        <div className="flex flex-col items-center">
          <img
            className={`h-8 w-auto mb-2`}
            src="/assets/icons/logo.svg"
            alt="next"
          />
          <ElementTitle noMarignBottom>Mango Markets UI V2</ElementTitle>
        </div>
      </Modal.Header>
      <div className={`pb-4 px-6 text-th-fgd-2 text-center`}>
        This is an unaudited alpha release of Mango Markets. The software is
        provided &apos;AS IS&apos; without warranty of any kind.
        <div className={`mt-4 flex justify-center`}>
          <Button onClick={() => setAlphaAccepted(true)}>
            <div className={`flex items-center`}>Accept</div>
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default React.memo(AlphaModal)
