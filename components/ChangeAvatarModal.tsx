import React, { useState } from 'react'
import { FunctionComponent } from 'react'
import Modal from './Modal'
import { ElementTitle } from './styles'
import { Responsive, WidthProvider } from 'react-grid-layout'
import _ from 'lodash'
import Button from './Button'
import useMangoStore from '../stores/useMangoStore'
// import mango_hero from '../public/mango_heroes.jpg'
// import mango_hero1 from '../public/mango_heroes1.jpeg'
// import mango_hero2 from '../public/mango_heroes2.jpeg'
import { notify } from '../utils/notifications'
import { NFT } from '../utils/metaplex/models'

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
  const nfts = useMangoStore((s) => s.settings.nfts)
  const currentIndex = nfts.indexOf(currentAvatar)
  if (currentIndex != -1) nfts.splice(currentIndex, 1)

  const testImageUrls = [nfts]
  const [selectedIndex, setSelectedIndex] = useState(0)
  const set = useMangoStore((state) => state.set)
  const [layouts] = useState(
    testImageUrls.map((url, key) => {
      return {
        i: String(key),
        x: key % 3,
        y: Math.floor(key / 3),
        w: 1,
        h: 1,
        url: url,
      }
    })
  )

  const saveSelection = () => {
    set((state) => {
      state.settings.avatar = testImageUrls[selectedIndex]
    })

    notify({
      title: 'Avatar changed successfully',
    })

    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header>
        <ElementTitle noMarignBottom>Change Avatar</ElementTitle>
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
                  nft={layout.url}
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
          <div className="flex items-center justify-center">Okay</div>
        </Button>
      </div>
    </Modal>
  )
}

const NFTDisplay = ({ nft, selected }) => {
  return (
    <div className="hover:scale-110">
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
