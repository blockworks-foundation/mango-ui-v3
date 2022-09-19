import useMangoStore from 'stores/useMangoStore'
import { ProfileIcon } from './icons'

const ProfileImage = ({
  imageSize,
  placeholderSize,
  imageUrl,
  isOwnerProfile,
}: {
  imageSize: string
  placeholderSize: string
  imageUrl?: string
  isOwnerProfile?: boolean
}) => {
  const profile = useMangoStore((s) => s.profile.details)

  return imageUrl || (isOwnerProfile && profile.profile_image_url) ? (
    <img
      alt=""
      src={imageUrl ? imageUrl : profile.profile_image_url}
      className={`default-transition rounded-full`}
      style={{ width: `${imageSize}px`, height: `${imageSize}px` }}
    />
  ) : (
    <div
      className={`flex flex-shrink-0 items-center justify-center rounded-full bg-th-bkg-4`}
      style={{ width: `${imageSize}px`, height: `${imageSize}px` }}
    >
      <div
        style={{
          width: `${placeholderSize}px`,
          height: `${placeholderSize}px`,
        }}
      >
        <ProfileIcon className={`h-full w-full text-th-fgd-3`} />
      </div>
    </div>
  )
}

export default ProfileImage
