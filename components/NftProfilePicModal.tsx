import { useState, useEffect } from 'react'
import { PublicKey } from '@solana/web3.js'
import { notify } from 'utils/notifications'
import useMangoStore from '../stores/useMangoStore'
import { useWallet } from '@solana/wallet-adapter-react'
import { PhotographIcon } from '@heroicons/react/outline'
import Modal from './Modal'
import { ElementTitle } from './styles'
import {
  createRemoveProfilePictureTransaction,
  createSetProfilePictureTransaction,
} from '@solflare-wallet/pfp'
import Button from './Button'
import { useTranslation } from 'next-i18next'
import { connectionSelector } from '../stores/selectors'
import { LinkButton } from 'components'

interface SelectedNft {
  mint: PublicKey
  tokenAddress: PublicKey
}

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
  const connection = useMangoStore(connectionSelector)
  const { publicKey, wallet } = useWallet()
  const pfp = useMangoStore((s) => s.wallet.pfp)
  const nfts = useMangoStore((s) => s.wallet.nfts.data)
  const nftAccounts = useMangoStore((s) => s.wallet.nfts.accounts)
  const initialLoad = useMangoStore((s) => s.wallet.nfts.initialLoad)
  const nftsLoading = useMangoStore((s) => s.wallet.nfts.loading)
  const [selectedProfile, setSelectedProfile] = useState<SelectedNft | null>(
    null
  )
  const actions = useMangoStore((s) => s.actions)
  const mangoClient = useMangoStore.getState().connection.client
  const [offset, setOffset] = useState(0)
  const setMangoStore = useMangoStore((s) => s.set)

  useEffect(() => {
    if (publicKey) {
      actions.fetchNftAccounts(connection, publicKey)
    }
  }, [publicKey])

  useEffect(() => {
    if (!initialLoad && publicKey && nftAccounts.length > 0) {
      actions.fetchNfts(connection, publicKey)
    }
  }, [publicKey, initialLoad, nftAccounts])

  useEffect(() => {
    if (pfp?.isAvailable && pfp.mintAccount && pfp.tokenAccount) {
      setSelectedProfile({
        mint: pfp.mintAccount,
        tokenAddress: pfp.tokenAccount,
      })
    }
  }, [pfp])

  const handleSaveProfilePic = async () => {
    if (!publicKey || !selectedProfile || !wallet) {
      return
    }

    try {
      setMangoStore((state) => {
        state.wallet.nfts.loadingTransaction = true
      })
      onClose()
      const transaction = await createSetProfilePictureTransaction(
        publicKey,
        selectedProfile.mint,
        selectedProfile.tokenAddress
      )
      if (transaction) {
        const txid = await mangoClient.sendTransaction(
          transaction,
          wallet.adapter,
          []
        )
        if (txid) {
          notify({
            title: t('profile:profile-pic-success'),
            description: '',
            txid,
          })
        } else {
          notify({
            title: t('profile:profile-pic-failure'),
            description: t('transaction-failed'),
          })
        }
      } else {
        notify({
          title: t('profile:profile-pic-failure'),
          description: t('transaction-failed'),
        })
      }
    } catch (e) {
      notify({
        title: t('profile:profile-pic-failure'),
        description: e.message,
        txid: e.txid,
        type: 'error',
      })
    } finally {
      actions.fetchProfilePicture(wallet)
      setMangoStore((state) => {
        state.wallet.nfts.loadingTransaction = false
      })
    }
  }

  const handleRemoveProfilePic = async () => {
    if (!publicKey || !wallet) {
      return
    }

    try {
      setMangoStore((state) => {
        state.wallet.nfts.loadingTransaction = true
      })
      onClose()
      const transaction = await createRemoveProfilePictureTransaction(publicKey)
      if (transaction) {
        const txid = await mangoClient.sendTransaction(
          transaction,
          wallet.adapter,
          []
        )
        if (txid) {
          notify({
            title: t('profile:profile-pic-remove-success'),
            description: '',
            txid,
          })
        } else {
          notify({
            title: t('profile:profile-pic-remove-failure'),
            description: t('transaction-failed'),
          })
        }
      } else {
        notify({
          title: t('profile:profile-pic-remove-failure'),
          description: t('transaction-failed'),
        })
      }
    } catch (e) {
      notify({
        title: t('profile:profile-pic-remove-failure'),
        description: e.message,
        txid: e.txid,
        type: 'error',
      })
    } finally {
      actions.fetchProfilePicture(wallet)
      setMangoStore((state) => {
        state.wallet.nfts.loadingTransaction = false
      })
    }
  }

  const handleLoadMore = async () => {
    const offsetNfts = offset + 9
    await actions.fetchNfts(connection, publicKey, offsetNfts)
    setOffset(offsetNfts)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header>
        <div className="mb-3 flex w-full flex-col items-center sm:mt-3 sm:flex-row sm:justify-between">
          <ElementTitle noMarginBottom>
            {t('profile:choose-profile')}
          </ElementTitle>
          <div className="mt-3 flex items-center space-x-4 sm:mt-0">
            <Button
              disabled={!selectedProfile}
              onClick={() => handleSaveProfilePic()}
            >
              {t('save')}
            </Button>
            {pfp?.isAvailable ? (
              <LinkButton
                className="text-xs"
                onClick={() => handleRemoveProfilePic()}
              >
                {t('profile:remove')}
              </LinkButton>
            ) : null}
          </div>
        </div>
      </Modal.Header>
      {nftAccounts.length > 0 ? (
        <div className="flex flex-col items-center">
          <div className="mb-4 grid w-full grid-flow-row grid-cols-3 gap-4">
            {nfts.map((n) => {
              return (
                <button
                  className={`default-transitions col-span-1 flex items-center justify-center rounded-md border bg-th-bkg-3 py-3 hover:bg-th-bkg-4 sm:py-4 ${
                    selectedProfile?.tokenAddress.toString() === n.tokenAddress
                      ? 'border-th-primary'
                      : 'border-th-bkg-3'
                  }`}
                  key={n.tokenAddress}
                  onClick={() =>
                    setSelectedProfile({
                      mint: new PublicKey(n.mint),
                      tokenAddress: new PublicKey(n.tokenAddress),
                    })
                  }
                >
                  <ImgWithLoader
                    className="h-16 w-16 flex-shrink-0 rounded-full sm:h-20 sm:w-20"
                    src={n.val.image}
                  />
                </button>
              )
            })}
            {nftsLoading
              ? [
                  ...Array(
                    nftAccounts.length - nfts.length > 9
                      ? 9
                      : nftAccounts.length - nfts.length
                  ),
                ].map((i) => (
                  <div
                    className="col-span-1 h-[90px] animate-pulse rounded-md bg-th-bkg-3 sm:h-28"
                    key={i}
                  />
                ))
              : null}
          </div>
          {nftAccounts.length !== nfts.length ? (
            <LinkButton onClick={() => handleLoadMore()}>
              {t('show-more')}
            </LinkButton>
          ) : null}
        </div>
      ) : null}
    </Modal>
  )
}

export default NftProfilePicModal
