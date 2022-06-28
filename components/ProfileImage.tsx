import useMangoStore from 'stores/useMangoStore'
import { ProfileIcon } from './icons'

const ProfileImage = ({
  thumbHeightClass,
  thumbWidthClass,
  placeholderHeightClass,
  placeholderWidthClass,
}) => {
  const pfp = useMangoStore((s) => s.wallet.pfp)
  const loadPfp = useMangoStore((s) => s.wallet.loadPfp)
  const loadingTransaction = useMangoStore(
    (s) => s.wallet.nfts.loadingTransaction
  )

  return pfp?.isAvailable ? (
    <img
      alt=""
      src={pfp.url}
      className={`default-transition rounded-full hover:opacity-60 ${thumbHeightClass} ${thumbWidthClass} ${
        loadingTransaction ? 'opacity-40' : ''
      }`}
    />
  ) : loadPfp ? (
    <div
      className={`animate-pulse rounded-full bg-th-bkg-3 ${thumbHeightClass} ${thumbWidthClass}`}
    />
  ) : (
    <ProfileIcon
      className={`text-th-fgd-3 ${placeholderHeightClass} ${placeholderWidthClass}`}
    />
  )
}

export default ProfileImage
