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
import * as MonoIcons from './icons'
import { TwitterIcon } from './icons'

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
    position.basePosition > 0
      ? ((position.indexPrice - position.avgEntryPrice) /
          position.avgEntryPrice) *
        100 *
        initLeverage
      : ((position.avgEntryPrice - position.indexPrice) /
          position.avgEntryPrice) *
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

  const iconName = `${marketConfig.baseSymbol.slice(
    0,
    1
  )}${marketConfig.baseSymbol.slice(1, 4).toLowerCase()}MonoIcon`

  const SymbolIcon = MonoIcons[iconName]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className={`${
        side === 'LONG'
          ? isProfit
            ? 'bg-long-profit'
            : 'bg-long-loss'
          : isProfit
          ? 'bg-short-profit'
          : 'bg-short-loss'
      } bg-contain h-[337.5px] w-[600px] sm:max-w-7xl`}
      noPadding
      hideClose
      ref={ref}
    >
      <div
        id="share-image"
        className="drop-shadow-lg flex flex-col h-full items-center justify-center space-y-4 relative z-20"
      >
        <div className="flex items-center text-lg text-th-fgd-3 text-center">
          <SymbolIcon className="h-6 w-auto mr-2" />
          <span className="mr-2">{position.marketConfig.name}</span>
          <span
            className={`border px-1 rounded ${
              position.basePosition > 0
                ? 'border-th-green text-th-green'
                : 'border-th-red text-th-red'
            }`}
          >
            {side}
          </span>
        </div>
        <div
          className={`font-bold text-6xl text-center ${
            isProfit
              ? 'border-th-green text-th-green'
              : 'border-th-red text-th-red'
          }`}
        >
          {positionPercentage > 0 ? '+' : null}
          {positionPercentage.toFixed(2)}%
        </div>
        <div className="pt-2 space-y-1 text-base text-th-fgd-1 w-2/3">
          <div className="flex items-center justify-between">
            <span className="text-th-fgd-2">Avg Entry Price</span>
            <span className="font-bold">
              ${position.avgEntryPrice.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-th-fgd-2">Mark Price</span>
            <span className="font-bold">${position.indexPrice.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-th-fgd-2">Max Leverage</span>
            <span className="font-bold">{initLeverage}x</span>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
        {copied ? (
          <a
            className="bg-th-primary font-bold block mt-6 px-4 py-3 rounded-full text-center text-th-bkg-1 w-full hover:cursor-pointer hover:text-th-bkg-1 hover:brightness-[1.15]"
            href={`https://twitter.com/intent/tweet?text=I'm ${side} %24${position.marketConfig.baseSymbol} perp on %40mangomarkets%0A[PASTE IMAGE HERE]`}
            target="_blank"
            rel="noreferrer"
          >
            <div className="flex items-center justify-center">
              <TwitterIcon className="h-4 mr-1.5 w-4" />
              <div>Tweet Position</div>
            </div>
          </a>
        ) : (
          <a
            className={`bg-th-primary flex font-bold items-center mt-6 px-4 py-3 rounded-full text-center text-th-bkg-1 w-full hover:cursor-pointer hover:text-th-bkg-1 hover:brightness-[1.15]`}
            onClick={handleCopyToClipboard}
          >
            <TwitterIcon className="h-4 mr-1.5 w-4" />
            Copy Image and Share
          </a>
        )}
      </div>
    </Modal>
  )
}

export default ShareModal
