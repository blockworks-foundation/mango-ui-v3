import React, { useEffect, useState } from 'react'
import { FunctionComponent } from 'react'
import Modal from './Modal'
import { ElementTitle } from './styles'
import { Responsive, WidthProvider } from 'react-grid-layout'
import _ from 'lodash'
import Button from './Button'
import useMangoStore from '../stores/useMangoStore'
import { notify } from '../utils/notifications'
import { NFT } from '../utils/metaplex/models'
import { useTranslation } from 'next-i18next'
import {
  IPFS_DEFAULT_GATEWAY,
  MANGO_HEROES_IPFS_GATEWAY,
} from '../utils/metaplex/types'

const ResponsiveGridLayout = WidthProvider(Responsive)

interface ChangeAvatarModalProps {
  isOpen: boolean
  onClose: () => void
  currentAvatar: NFT
}

const ChangeAvatarModal: FunctionComponent<ChangeAvatarModalProps> = ({
  isOpen,
  onClose,
  currentAvatar,
}) => {
  const { t } = useTranslation('common')
  const nfts = [...useMangoStore((s) => s.settings.nfts)]
  const currentIndex = nfts.indexOf(currentAvatar)
  if (currentIndex != -1) nfts.splice(currentIndex, 1)

  const listOfNFTs = [currentAvatar, ...nfts]
  const [selectedIndex, setSelectedIndex] = useState(0)
  const set = useMangoStore((state) => state.set)
  const [layouts] = useState(
    listOfNFTs.map((nft, key) => {
      return {
        i: String(key),
        x: key % 3,
        y: Math.floor(key / 3),
        w: 1,
        h: 1,
        nft: nft,
      }
    })
  )

  // Save selected profile picture
  const saveSelection = () => {
    const nftMintAddress = listOfNFTs[selectedIndex].mintAddress.toBase58()

    set((state) => {
      state.settings.avatar = nftMintAddress
    })
    localStorage.setItem('profilePic', nftMintAddress)

    notify({
      title: t('avatar-success'),
    })

    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header>
        <ElementTitle noMarignBottom>{t('change-avatar')}</ElementTitle>
      </Modal.Header>
      <div
        className="border border-th-bkg-4 bg-th-bkg-1"
        style={{ height: 300, width: '100%', overflowY: 'auto' }}
      >
        <ResponsiveGridLayout
          className="layout"
          cols={{ xl: 3, lg: 3, md: 3, sm: 3, xs: 1, xxs: 1 }}
          breakpoints={{ lg: 1200 }}
          rowHeight={120}
          isDraggable={false}
          isResizable={false}
        >
          {_.map(layouts, (layout) => {
            return (
              <div
                key={layout.i}
                data-grid={layout}
                className="hover:cursor-pointer"
                onClick={() => setSelectedIndex(+layout.i)}
              >
                <NFTDisplay
                  nft={layout.nft}
                  selected={selectedIndex === +layout.i}
                />
              </div>
            )
          })}
        </ResponsiveGridLayout>
      </div>
      <div className="align-middle flex justify-center">
        <Button
          disabled={selectedIndex === 0}
          className="mt-4"
          onClick={saveSelection}
        >
          <div className="flex items-center justify-center">{t('okay')}</div>
        </Button>
      </div>
    </Modal>
  )
}

const NFTDisplay = ({ nft, selected }) => {
  const [imageUri, setImageUri] = useState()

  useEffect(() => {
    if (nft.imageUri) {
      setImageUri(nft.imageUri)
    } else {
      try {
        fetch(nft.metadataUri).then(async (_) => {
          try {
            const data = await _.json()
            nft.imageUri = data['image'].replace(
              IPFS_DEFAULT_GATEWAY,
              MANGO_HEROES_IPFS_GATEWAY
            )
            setImageUri(nft.imageUri)
          } catch (ex) {
            console.error('Error trying to parse JSON: ' + ex)
          }
        })
      } catch (ex) {
        console.error('Error trying to fetch metadata: ' + ex)
      }
    }
  }, [imageUri])

  return (
    <div
      className={`hover:scale-110 ${
        nft.imageUri == undefined
          ? 'bg-th-bkg-4 h-full w-full rounded-lg animate-pulse'
          : ''
      }`}
    >
      <img
        className={`border ${
          selected ? 'border-th-primary' : 'border-th-bkg-4'
        } h-full w-full rounded-lg`}
        src={nft.imageUri}
      ></img>
    </div>
  )
}

export default React.memo(ChangeAvatarModal)
