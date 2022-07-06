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
  const loadPfp = useMangoStore((s) => s.wallet.loadPfp)
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
      className={`default-transition rounded-full ${
        loadingTransaction ? 'opacity-40' : ''
      }`}
      style={{ width: `${imageSize}px`, height: `${imageSize}px` }}
    />
  ) : (
    <div
      className={`flex flex-shrink-0 items-center justify-center rounded-full ${
        loadingTransaction || loadPfp
          ? 'animate-pulse bg-th-bkg-4'
          : 'bg-th-bkg-4'
      }`}
      style={{ width: `${imageSize}px`, height: `${imageSize}px` }}
    >
      <div
        style={{
          width: `${placeholderSize}px`,
          height: `${placeholderSize}px`,
        }}
      >
        {!loadPfp ? (
          <ProfileIcon className={`h-full w-full text-th-fgd-3`} />
        ) : null}
      </div>
    </div>
  )
}

export default ProfileImage
