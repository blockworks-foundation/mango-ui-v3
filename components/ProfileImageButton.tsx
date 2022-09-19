import { PencilIcon } from '@heroicons/react/outline'
import { useCallback, useState } from 'react'
import useMangoStore from 'stores/useMangoStore'
import NftProfilePicModal from './NftProfilePicModal'
import ProfileImage from './ProfileImage'

const ProfileImageButton = ({
  disabled,
  imageSize,
  placeholderSize,
  imageUrl,
}: {
  disabled: boolean
  imageSize: string
  placeholderSize: string
  imageUrl?: string
}) => {
  const [showProfilePicModal, setShowProfilePicModal] = useState(false)
  const profile = useMangoStore((s) => s.profile.details)

  const handleCloseProfilePicModal = useCallback(() => {
    setShowProfilePicModal(false)
  }, [])

  return (
    <>
      <button
        disabled={disabled}
        className="relative mb-2 mr-4 flex items-center justify-center rounded-full sm:mb-0"
        onClick={() => setShowProfilePicModal(true)}
        style={{ width: `${imageSize}px`, height: `${imageSize}px` }}
      >
        <ProfileImage
          imageSize={imageSize}
          placeholderSize={placeholderSize}
          imageUrl={(imageUrl !== profile.profile_image_url && imageUrl) || ''}
          isOwnerProfile={imageUrl === profile.profile_image_url}
        />
        {!disabled ? (
          <div className="default-transition absolute bottom-0 top-0 left-0 right-0 flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-[rgba(0,0,0,0.6)] opacity-0 hover:opacity-100">
            <PencilIcon className="h-5 w-5 text-th-fgd-1" />
          </div>
        ) : null}
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
