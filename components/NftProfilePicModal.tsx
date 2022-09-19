import { useState, useEffect } from 'react'
import { notify } from 'utils/notifications'
import useMangoStore from '../stores/useMangoStore'
import { useWallet } from '@solana/wallet-adapter-react'
import { PhotographIcon } from '@heroicons/react/solid'
import Modal from './Modal'
import { ElementTitle } from './styles'
import Button from './Button'
import { useTranslation } from 'next-i18next'
import { LinkButton } from 'components'
import bs58 from 'bs58'

const ImgWithLoader = (props) => {
  const [isLoading, setIsLoading] = useState(true)
  return (
    <div className="relative">
      {isLoading && (
        <PhotographIcon className="absolute left-1/2 top-1/2 z-10 h-1/4 w-1/4 -translate-x-1/2 -translate-y-1/2 transform animate-pulse text-th-fgd-4" />
      )}
      <img {...props} onLoad={() => setIsLoading(false)} />
    </div>
  )
}

const NftProfilePicModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation(['common', 'profile'])
  const { publicKey, signMessage } = useWallet()
  const nfts = useMangoStore((s) => s.wallet.nfts.data)
  const nftsLoading = useMangoStore((s) => s.wallet.nfts.loading)
  const [selectedProfile, setSelectedProfile] = useState<string>('')
  const actions = useMangoStore((s) => s.actions)
  const profile = useMangoStore((s) => s.profile.details)

  useEffect(() => {
    if (publicKey) {
      actions.fetchNfts(publicKey)
    }
  }, [publicKey])

  useEffect(() => {
    if (profile.profile_image_url) {
      setSelectedProfile(profile.profile_image_url)
    }
  }, [profile])

  const saveProfileImage = async () => {
    const name = profile.profile_name.toLowerCase()
    const traderCategory = profile.trader_category
    try {
      if (!publicKey) throw new Error('Wallet not connected!')
      if (!signMessage)
        throw new Error('Wallet does not support message signing!')

      const messageString = JSON.stringify({
        profile_name: name,
        trader_category: traderCategory,
        profile_image_url: selectedProfile,
      })
      const message = new TextEncoder().encode(messageString)
      const signature = await signMessage(message)

      const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_pk: publicKey.toString(),
          message: messageString,
          signature: bs58.encode(signature),
        }),
      }
      const response = await fetch(
        'https://mango-transaction-log.herokuapp.com/v3/user-data/profile-details',
        requestOptions
      )
      if (response.status === 200) {
        await actions.fetchProfileDetails(publicKey.toString())
        onClose()
        notify({
          type: 'success',
          title: t('profile:profile-pic-success'),
        })
      }
    } catch {
      notify({
        type: 'success',
        title: t('profile:profile:profile-pic-failure'),
      })
    }
  }

  const removeProfileImage = async () => {
    const name = profile.profile_name.toLowerCase()
    const traderCategory = profile.trader_category
    try {
      if (!publicKey) throw new Error('Wallet not connected!')
      if (!signMessage)
        throw new Error('Wallet does not support message signing!')

      const messageString = JSON.stringify({
        profile_name: name,
        trader_category: traderCategory,
        profile_image_url: '',
      })
      const message = new TextEncoder().encode(messageString)
      const signature = await signMessage(message)

      const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_pk: publicKey.toString(),
          message: messageString,
          signature: bs58.encode(signature),
        }),
      }
      const response = await fetch(
        'https://mango-transaction-log.herokuapp.com/v3/user-data/profile-details',
        requestOptions
      )
      if (response.status === 200) {
        await actions.fetchProfileDetails(publicKey.toString())
        onClose()
        notify({
          type: 'success',
          title: t('profile:profile-pic-remove-success'),
        })
      }
    } catch {
      notify({
        type: 'success',
        title: t('profile:profile-pic-remove-failure'),
      })
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header>
        <div className="mb-3 flex w-full flex-col items-center sm:mt-3 sm:flex-row sm:justify-between">
          <ElementTitle noMarginBottom>
            {t('profile:choose-profile')}
          </ElementTitle>
          <div className="mt-3 flex items-center space-x-4 sm:mt-0">
            <Button disabled={!selectedProfile} onClick={saveProfileImage}>
              {t('save')}
            </Button>
            {profile.profile_image_url ? (
              <LinkButton className="text-xs" onClick={removeProfileImage}>
                {t('profile:remove')}
              </LinkButton>
            ) : null}
          </div>
        </div>
      </Modal.Header>
      {nfts.length > 0 ? (
        <div className="flex flex-col items-center">
          <div className="mb-4 grid w-full grid-flow-row grid-cols-3 gap-4">
            {nfts.map((n) => (
              <button
                className={`default-transitions col-span-1 flex items-center justify-center rounded-md border bg-th-bkg-3 py-3 sm:py-4 md:hover:bg-th-bkg-4 ${
                  selectedProfile === n.image
                    ? 'border-th-primary'
                    : 'border-th-bkg-3'
                }`}
                key={n.image}
                onClick={() => setSelectedProfile(n.image)}
              >
                <ImgWithLoader
                  className="h-16 w-16 flex-shrink-0 rounded-full sm:h-20 sm:w-20"
                  src={n.image}
                />
              </button>
            ))}
          </div>
        </div>
      ) : nftsLoading ? (
        <div className="mb-4 grid w-full grid-flow-row grid-cols-3 gap-4">
          {[...Array(9)].map((i) => (
            <div
              className="col-span-1 h-[90px] animate-pulse rounded-md bg-th-bkg-3 sm:h-28"
              key={i}
            />
          ))}
        </div>
      ) : (
        <p className="text-center">{t('profile:no-nfts')}</p>
      )}
    </Modal>
  )
}

export default NftProfilePicModal
