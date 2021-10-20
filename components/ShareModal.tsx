import { FunctionComponent, useMemo } from 'react'
import Head from 'next/head'
import { getWeights } from '@blockworks-foundation/mango-client'
import useMangoStore from '../stores/useMangoStore'
import Modal from './Modal'

interface ShareModalProps {
  onClose: () => void
  isOpen: boolean
  position: any
}

const ShareModal: FunctionComponent<ShareModalProps> = ({
  isOpen,
  onClose,
  position,
}) => {
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)

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

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Head>
        <meta name="twitter:title" content={position.basePosition} />
        <meta
          name="twitter:image"
          content="https://og-image-saml33.vercel.app/gfy.png"
        />
      </Head>
      <div id="share-image">
        <div className="flex justify-center p-4 pt-0">
          <img
            className={`h-16 w-auto`}
            src="/assets/icons/logo.svg"
            alt="next"
          />
        </div>
        <div className="pb-4 text-lg text-th-fgd-1">
          <span
            className={`${
              position.basePosition > 0 ? 'text-th-green' : 'text-th-red'
            }`}
          >
            {side}
          </span>
          <span className="px-2 text-th-fgd-4">|</span>
          <span>{position.marketConfig.name}</span>
        </div>
        <div
          className={`border font-bold mb-6 p-4 py-6 rounded-lg text-[2.5rem] text-center ${
            positionPercentage > 0
              ? 'border-th-green text-th-green'
              : 'border-th-red text-th-red'
          }`}
        >
          {positionPercentage > 0
            ? `+${positionPercentage.toFixed(2)}`
            : positionPercentage.toFixed(2)}
          %
        </div>
        <div className="space-y-2 text-th-fgd-1">
          <div className="flex items-center justify-between">
            <span className="text-th-fgd-4">Avg Entry Price</span>
            <span>${position.avgEntryPrice}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-th-fgd-4">Mark Price</span>
            <span>${position.indexPrice.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-th-fgd-4">Leverage</span>
            <span>{initLeverage}x</span>
          </div>
        </div>
        <a
          className="bg-th-bkg-3 block mt-6 px-4 py-3 rounded-full text-center text-th-fgd-1 w-full"
          href={`https://twitter.com/intent/tweet?text=I'm ${side} %24${position.marketConfig.baseSymbol} perp on %40mangomarkets&url=https://trade.mango.markets/perp/BTC`}
          target="_blank"
          rel="noreferrer"
        >
          Tweet Position
        </a>
      </div>
    </Modal>
  )
}

export default ShareModal
