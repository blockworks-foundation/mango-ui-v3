import React, { useEffect } from 'react'
import Modal from './Modal'
import Button from './Button'
import useLocalStorageState from '../hooks/useLocalStorageState'
import useMangoStore from '../stores/useMangoStore'

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
  const setMangoStore = useMangoStore((s) => s.set)

  useEffect(() => {
    setMangoStore((state) => {
      state.blurBackground = true
    })
  }, [])

  const handleAccept = () => {
    setAlphaAccepted(true)
    setMangoStore((state) => {
      state.blurBackground = false
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} hideClose>
      <Modal.Header>
        <div className="flex flex-col items-center">
          <div className="flex space-x-8 items-center justify-center ">
            <img
              className={`h-8 w-auto mb-2`}
              src="/assets/icons/sol.svg"
              alt="next"
            />
            <img
              className={`h-12 w-auto mb-2`}
              src="/assets/icons/logo.svg"
              alt="next"
            />
            <img
              className={`h-10 w-auto mb-2`}
              src="/assets/icons/srm.svg"
              alt="next"
            />
          </div>
        </div>
      </Modal.Header>
      <div className={`text-th-fgd-2 text-center`}>
        SOL and SRM now available with USDC!
      </div>
      <div className="text-th-fgd-2 text-center my-4">
        Visit{' '}
        <a
          href="https://usdt.mango.markets"
          target="_blank"
          rel="noopener noreferrer"
        >
          https://usdt.mango.markets
        </a>{' '}
        to access the USDT mango group.
      </div>
      <div className={`text-th-fgd-2 text-center`}>
        Mango Markets is unaudited software. Use at your own risk.
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
