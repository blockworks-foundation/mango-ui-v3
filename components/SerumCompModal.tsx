import React from 'react'
import { CheckCircleIcon, XIcon } from '@heroicons/react/solid'
import Modal from './Modal'
import Button from './Button'
import useLocalStorageState from '../hooks/useLocalStorageState'
import { useRouter } from 'next/router'

export const SEEN_SERUM_COMP_KEY = 'seenSerumCompInfo'

const SerumCompModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose?: (x) => void
}) => {
  const [, setSeenSerumCompInfo] = useLocalStorageState(SEEN_SERUM_COMP_KEY)
  const router = useRouter()

  const handleFindOutMore = () => {
    setSeenSerumCompInfo(true)
    router.push('/win-srm')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header>
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center space-x-4">
            <img
              className={`h-10 w-auto`}
              src="/assets/icons/srm.svg"
              alt="next"
            />
            <XIcon className="h-5 w-5 text-th-primary" />
            <img
              className={`h-12 w-auto`}
              src="/assets/icons/logo.svg"
              alt="next"
            />
          </div>
        </div>
      </Modal.Header>
      <h1 className="relative m-auto mb-2 w-max">Win a Share in 400k SRM</h1>
      <p className="text-center">
        50k SRM are up for grabs every week until 12 Sep
      </p>
      <div className="mt-4 space-y-2 border-t border-th-bkg-4 pt-4">
        <div className="flex items-center text-th-fgd-1">
          <CheckCircleIcon className="mr-1.5 h-6 w-6 flex-shrink-0 text-th-green" />
          <p className="mb-0 text-th-fgd-1">
            40k SRM distributed proportionally to everyone who contributes at
            least 1% of total spot volume for both maker and taker
          </p>
        </div>
        <div className="flex items-center text-th-fgd-1">
          <CheckCircleIcon className="mr-1.5 h-6 w-6 flex-shrink-0 text-th-green" />
          <p className="mb-0 text-th-fgd-1">
            10k SRM for the top 10 traders by spot PnL
          </p>
        </div>
      </div>
      <Button className="mt-6 w-full" onClick={() => handleFindOutMore()}>
        Find Out More
      </Button>
    </Modal>
  )
}

export default SerumCompModal
