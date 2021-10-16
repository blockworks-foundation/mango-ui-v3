import React, { useEffect, useState } from 'react'
import { FunctionComponent } from 'react'
import Modal from './Modal'
import { ElementTitle } from './styles'
import { Responsive, WidthProvider } from 'react-grid-layout'
// import _ from "lodash";

const ResponsiveGridLayout = WidthProvider(Responsive)

interface ChangeAvatarModalProps {
  isOpen: boolean
  onClose: () => void
  url: string
}

const ChangeAvatarModal: FunctionComponent<ChangeAvatarModalProps> = ({
  isOpen,
  onClose,
  url,
}) => {
  const [items, setItems] = useState([])

  useEffect(() => {
    const testImageUrls = ['', '', '']

    const items = testImageUrls.map((_, key) => {
      return {
        i: key,
        x: (key % 3) * 3,
        y: key / 3,
        w: 3,
        h: 1,
      }
    })

    setItems(items)
  }, [items])

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header>
        <ElementTitle noMarignBottom>Change Avatar</ElementTitle>
      </Modal.Header>
      <div
        className="border border-th-bkg-4 bg-th-bkg-1"
        style={{ height: 300, width: '100%' }}
      >
        <ResponsiveGridLayout
          class="layout"
          cols={{ xl: 3, lg: 3, md: 3, sm: 3, xs: 1, xxs: 1 }}
          rowHeight={150}
          isDraggable={false}
          isResizable={false}
          useCssTransforms={false}
        >
          {/* {_.map(items, item => {
                        return (
                            <div key={item.i} className="hover:cursor-pointer">
                                <NFTDisplay url={url} selected={true}/>
                            </div>
                        )
                    })} */}
          <div key="1">
            <NFTDisplay url={url} selected={true} />
          </div>
        </ResponsiveGridLayout>
      </div>
    </Modal>
  )
}

const NFTDisplay = ({ url, selected }) => {
  return (
    <div>
      <img
        className={`border ${
          selected ? 'border-th-primary' : 'border-th-bkg-4'
        } h-2/6 w-2/6 rounded-lg`}
        src={url}
      ></img>
    </div>
  )
}

export default React.memo(ChangeAvatarModal)
