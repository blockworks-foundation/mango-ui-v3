import {
  FunctionComponent,
  useEffect,
  useMemo,
  createRef,
  useState,
} from 'react'
import { getWeights, MarketConfig } from '@blockworks-foundation/mango-client'

import useMangoStore from '../stores/useMangoStore'
import Modal from './Modal'
import { useScreenshot } from '../hooks/useScreenshot'
import { ExternalLinkIcon } from '@heroicons/react/outline'

interface ShareModalProps {
  onClose: () => void
  isOpen: boolean
  position: {
    indexPrice: number
    avgEntryPrice: number
    basePosition: number
    marketConfig: MarketConfig
  }
}

const ShareModal: FunctionComponent<ShareModalProps> = ({
  isOpen,
  onClose,
  position,
}) => {
  const ref = createRef()
  const [copied, setCopied] = useState(false)
  const [showButton, setShowButton] = useState(true)
  const marketConfig = position.marketConfig
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const [image, takeScreenshot] = useScreenshot()

  const initLeverage = useMemo(() => {
    if (!mangoGroup || !marketConfig) return 1

    const ws = getWeights(mangoGroup, marketConfig.marketIndex, 'Init')
    return Math.round((100 * -1) / (ws.perpAssetWeight.toNumber() - 1)) / 100
  }, [mangoGroup, marketConfig])

  const positionPercentage =
    ((position.indexPrice - position.avgEntryPrice) / position.avgEntryPrice) *
    100 *
    initLeverage

  const side = position.basePosition > 0 ? 'LONG' : 'SHORT'

  async function copyToClipboard(image) {
    try {
      image.toBlob((blob) => {
        navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      }, 'image/png')
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (image) {
      copyToClipboard(image)
      setCopied(true)
      setShowButton(true)
    }
  }, [image])

  useEffect(() => {
    // if the button is hidden we are taking a screenshot
    if (!showButton) {
      takeScreenshot(ref.current)
    }
  }, [showButton])

  const handleCopyToClipboard = () => {
    setShowButton(false)
  }

  const isProfit = positionPercentage > 0

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="md:max-w-sm"
      noPadding
      hideClose
      ref={ref}
    >
      <div className="relative overflow-hidden px-8 pt-6 pb-6 rounded-lg">
        <div id="share-image" className="relative z-20">
          <div className="flex justify-center p-4 pt-0">
            <img
              className={`h-32 w-auto`}
              src="/assets/icons/logo.svg"
              alt="next"
            />
          </div>
          <div className="text-th-fgd-1 text-center text-xl">
            <span className="font-bold">Mango</span>
            <span className="font-extralight"> Markets</span>
          </div>
          <div className="pb-4 text-lg text-center">
            <span className="text-th-fgd-3">{position.marketConfig.name}</span>
            <span className="px-2 text-th-fgd-4">|</span>

            <span
              className={`${
                position.basePosition > 0 ? 'text-th-green' : 'text-th-red'
              }`}
            >
              {side}
            </span>
          </div>
          <div className="flex justify-center items-center">
            <div
              className={`border mb-6 px-4 ${
                !showButton ? 'pt-2' : 'py-2'
              } rounded-lg text-5xl text-center font-light ${
                isProfit
                  ? 'border-th-green text-th-green'
                  : 'border-th-red text-th-red'
              }`}
            >
              {isProfit
                ? `${positionPercentage.toFixed(2)}`
                : positionPercentage.toFixed(2)}
              %
            </div>
          </div>
          <div className="space-y-2 text-th-fgd-1">
            <div className="flex items-center justify-between">
              <span className="text-th-fgd-2">Avg Entry Price:</span>
              <span>${position.avgEntryPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-th-fgd-2">Mark Price:</span>
              <span>${position.indexPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-th-fgd-2">Max Leverage:</span>
              <span>{initLeverage}x</span>
            </div>
          </div>
          {copied ? (
            <a
              className="bg-th-bkg-3 hover:cursor-pointer block mt-6 px-4 py-3 rounded-full text-center text-th-fgd-1 w-full"
              href={`https://twitter.com/intent/tweet?text=I'm ${side} %24${position.marketConfig.baseSymbol} perp on %40mangomarkets%0A[PASTE IMAGE HERE]`}
              target="_blank"
              rel="noreferrer"
            >
              <div className="flex items-center justify-center">
                <div>Tweet</div>
                <ExternalLinkIcon className="ml-1 h-4 w-4" />
              </div>
            </a>
          ) : (
            <a
              className={`${
                !showButton ? 'hidden' : ''
              } bg-th-bkg-3 hover:cursor-pointer block mt-6 px-4 py-3 rounded-full text-center text-th-fgd-1 w-full`}
              onClick={handleCopyToClipboard}
            >
              Copy Image to Clipboard & Share
            </a>
          )}
          {!showButton ? <div className="mb-6">.</div> : null}
        </div>
        <div
          className={`absolute h-full w-full opacity-75 bottom-2/3 left-0 pointer-events-none bg-gradient-to-b ${
            isProfit ? 'from-th-green' : 'from-th-red'
          } to-th-bkg-2 z-10`}
        ></div>
      </div>
    </Modal>
  )
}

export default ShareModal
