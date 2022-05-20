import { PublicKey } from '@solana/web3.js'
import { getProfilePicture } from '@solflare-wallet/pfp'
import { useEffect, useState } from 'react'
import useMangoStore from 'stores/useMangoStore'
import { ProfileIcon } from './icons'

const ProfileImage = ({
  imageSize,
  placeholderSize,
  publicKey,
}: {
  imageSize: string
  placeholderSize: string
  publicKey?: string
}) => {
  const pfp = useMangoStore((s) => s.wallet.pfp)
  const loadingTransaction = useMangoStore(
    (s) => s.wallet.nfts.loadingTransaction
  )
  const connection = useMangoStore((s) => s.connection.current)
  const [unownedPfp, setUnownedPfp] = useState<any>(null)

  useEffect(() => {
    if (publicKey) {
      const getProfilePic = async () => {
        const pfp = await getProfilePicture(
          connection,
          new PublicKey(publicKey)
        )
        setUnownedPfp(pfp)
      }
      getProfilePic()
    }
  }, [publicKey])

  return (pfp?.isAvailable && !publicKey) || unownedPfp?.isAvailable ? (
    <img
      alt=""
      src={publicKey ? unownedPfp?.url : pfp?.url}
      className={`default-transition rounded-full hover:opacity-60 h-${imageSize} w-${imageSize} ${
        loadingTransaction ? 'opacity-40' : ''
      }`}
    />
  ) : (
    <div
      className={`flex items-center justify-center h-${imageSize} w-${imageSize} rounded-full ${
        loadingTransaction ? 'animate-pulse bg-th-bkg-4' : 'bg-th-bkg-button'
      }`}
    >
      <ProfileIcon
        className={`text-th-fgd-3 h-${placeholderSize} w-${placeholderSize}`}
      />
    </div>
  )
}

export default ProfileImage
