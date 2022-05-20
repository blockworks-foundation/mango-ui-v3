import { PencilIcon } from '@heroicons/react/outline'
import { useCallback, useState } from 'react'
import useMangoStore from 'stores/useMangoStore'
import NftProfilePicModal from './NftProfilePicModal'
import ProfileImage from './ProfileImage'

const ProfileImageButton = ({
  disabled,
  imageSize,
  placeholderSize,
}: {
  disabled: boolean
  imageSize: string
  placeholderSize: string
}) => {
  const [showProfilePicModal, setShowProfilePicModal] = useState(false)
  const loadingTransaction = useMangoStore(
    (s) => s.wallet.nfts.loadingTransaction
  )

  const handleCloseProfilePicModal = useCallback(() => {
    setShowProfilePicModal(false)
  }, [])

  return (
    <>
      <button
        disabled={disabled}
        className={`relative mb-2 mr-4 flex h-${imageSize} w-${imageSize} items-center justify-center rounded-full sm:mb-0 ${
          loadingTransaction ? 'animate-pulse bg-th-bkg-4' : 'bg-th-bkg-button'
        }`}
        onClick={() => setShowProfilePicModal(true)}
      >
        <ProfileImage imageSize={imageSize} placeholderSize={placeholderSize} />
        <div className="default-transition absolute bottom-0 top-0 left-0 right-0 flex h-full w-full items-center justify-center rounded-full bg-[rgba(0,0,0,0.6)] opacity-0 hover:opacity-100">
          <PencilIcon className="h-5 w-5 text-th-fgd-1" />
        </div>
      </button>
      {showProfilePicModal ? (
        <NftProfilePicModal
          isOpen={showProfilePicModal}
          onClose={handleCloseProfilePicModal}
        />
      ) : null}
    </>
  )
}

export default ProfileImageButton
