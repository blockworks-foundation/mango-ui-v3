import { useWallet } from '@solana/wallet-adapter-react'
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
  const [loadUnownedPfp, setLoadUnownedPfp] = useState<boolean>(false)
  const { connected } = useWallet()

  useEffect(() => {
    if (publicKey) {
      setLoadUnownedPfp(true)
      const getProfilePic = async () => {
        const pfp = await getProfilePicture(
          connection,
          new PublicKey(publicKey)
        )
        setUnownedPfp(pfp)
        setLoadUnownedPfp(false)
      }
      getProfilePic()
    }
  }, [publicKey])

  const isLoading =
    (connected && loadingTransaction && !publicKey) ||
    (connected && loadPfp && !publicKey) ||
    loadUnownedPfp

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
        isLoading ? 'animate-pulse bg-th-bkg-4' : 'bg-th-bkg-4'
      }`}
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
