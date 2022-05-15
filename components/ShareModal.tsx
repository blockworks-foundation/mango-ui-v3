import {
  FunctionComponent,
  useCallback,
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
import QRCode from 'react-qr-code'
import { useTranslation } from 'next-i18next'
import useMangoAccount from '../hooks/useMangoAccount'
import {
  mangoCacheSelector,
  mangoGroupConfigSelector,
  mangoGroupSelector,
} from '../stores/selectors'
import {
  getMarketIndexBySymbol,
  ReferrerIdRecord,
} from '@blockworks-foundation/mango-client'
import Button from './Button'
import Switch from './Switch'
import { roundPerpSize } from 'utils'

const calculatePositionPercentage = (position, maxLeverage) => {
  if (position.basePosition > 0) {
    const returnsPercentage =
      (position.indexPrice / position.avgEntryPrice - 1) * 100
    return returnsPercentage * maxLeverage
  } else {
    const returnsPercentage =
      (position.indexPrice / position.avgEntryPrice - 1) * -100
    return returnsPercentage * maxLeverage
  }
}

interface ShareModalProps {
  onClose: () => void
  isOpen: boolean
  position: {
    indexPrice: number
    avgEntryPrice: number
    basePosition: number
    marketConfig: MarketConfig
    notionalSize: number
  }
}

const ShareModal: FunctionComponent<ShareModalProps> = ({
  isOpen,
  onClose,
  position,
}) => {
  const { t } = useTranslation(['common', 'share-modal'])
  const ref = createRef()
  const [copied, setCopied] = useState(false)
  const [showButton, setShowButton] = useState(true)
  const [image, takeScreenshot] = useScreenshot()
  const { mangoAccount } = useMangoAccount()
  const mangoCache = useMangoStore(mangoCacheSelector)
  const groupConfig = useMangoStore(mangoGroupConfigSelector)
  const client = useMangoStore.getState().connection.client
  const mangoGroup = useMangoStore(mangoGroupSelector)
  const [customRefLinks, setCustomRefLinks] = useState<ReferrerIdRecord[]>([])
  const [showSize, setShowSize] = useState(true)
  const [showReferral, setShowReferral] = useState(false)
  const [hasRequiredMngo, setHasRequiredMngo] = useState(false)
  const marketConfig = position.marketConfig

  const maxLeverage = useMemo(() => {
    if (!mangoGroup) return 1

    const ws = getWeights(mangoGroup, marketConfig.marketIndex, 'Init')
    return Math.round((100 * -1) / (ws.perpAssetWeight.toNumber() - 1)) / 100
  }, [mangoGroup, marketConfig])

  const positionPercentage = calculatePositionPercentage(position, maxLeverage)

  const side = position.basePosition > 0 ? 'long' : 'short'

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
    if (mangoCache) {
      const mngoIndex = getMarketIndexBySymbol(groupConfig, 'MNGO')

      const hasRequiredMngo =
        mangoGroup && mangoAccount
          ? mangoAccount
              .getUiDeposit(
                mangoCache.rootBankCache[mngoIndex],
                mangoGroup,
                mngoIndex
              )
              .toNumber() >= 10000
          : false

      if (hasRequiredMngo) {
        setHasRequiredMngo(true)
      }
    }
  }, [mangoAccount, mangoGroup, mangoCache])

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
      takeScreenshot(ref.current as HTMLElement)
    }
  }, [showButton])

  const handleCopyToClipboard = () => {
    setShowButton(false)
  }

  const fetchCustomReferralLinks = useCallback(async () => {
    // setLoading(true)
    const referrerIds = await client.getReferrerIdsForMangoAccount(
      mangoAccount!
    )

    setCustomRefLinks(referrerIds)
    // setLoading(false)
  }, [mangoAccount])

  useEffect(() => {
    if (mangoAccount) {
      fetchCustomReferralLinks()
    }
  }, [mangoAccount])

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
      className={`-mt-40 ${
        side === 'long'
          ? isProfit
            ? 'bg-long-profit'
            : 'bg-long-loss'
          : isProfit
          ? 'bg-short-profit'
          : 'bg-short-loss'
      } h-[337.5px] w-[600px] bg-contain leading-[0.5] sm:max-w-7xl`}
      noPadding
      hideClose
      ref={ref}
    >
      <div
        id="share-image"
        className="relative z-20 flex h-full flex-col items-center justify-center space-y-4 drop-shadow-lg"
      >
        {hasRequiredMngo && showReferral ? (
          <div className="absolute right-4 top-4">
            <QRCode
              size={64}
              value={
                customRefLinks.length > 0
                  ? `https://trade.mango.markets?ref=${customRefLinks[0].referrerId}`
                  : `https://trade.mango.markets?ref=${mangoAccount?.publicKey.toString()}`
              }
            />
          </div>
        ) : null}
        <div className="flex items-center text-lg text-th-fgd-3">
          <SymbolIcon className="mr-2 h-6 w-auto" />
          <span
            className={`mr-2 ${
              !showButton ? 'inline-block h-full align-top leading-none' : ''
            }`}
          >
            {position.marketConfig.name}
          </span>
          <span
            className={`h-full rounded border px-1 ${
              position.basePosition > 0
                ? 'border-th-green text-th-green'
                : 'border-th-red text-th-red'
            }`}
          >
            <span
              className={`${
                !showButton ? 'inline-block h-full align-top leading-none' : ''
              }`}
            >
              {t(side).toLocaleUpperCase()}
            </span>
          </span>
        </div>
        <div
          className={`text-center text-6xl font-bold ${
            isProfit ? 'text-th-green' : 'text-th-red'
          }`}
        >
          {positionPercentage > 0 ? '+' : null}
          {positionPercentage.toFixed(2)}%
        </div>
        <div className="w-1/2 space-y-1 pt-2 text-base text-th-fgd-1">
          {showSize ? (
            <div className="flex items-center justify-between">
              <span className="text-th-fgd-2">{t('size')}</span>
              <span className="font-bold">
                {roundPerpSize(
                  position.basePosition,
                  position.marketConfig.baseSymbol
                )}
              </span>
            </div>
          ) : null}
          <div className="flex items-center justify-between">
            <span className="text-th-fgd-2">{t('average-entry')}</span>
            <span className="font-bold">
              $
              {position.avgEntryPrice.toLocaleString(undefined, {
                maximumFractionDigits: 2,
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-th-fgd-2">{t('share-modal:mark-price')}</span>
            <span className="font-bold">
              $
              {position.indexPrice.toLocaleString(undefined, {
                maximumFractionDigits: 2,
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-th-fgd-2">
              {t('share-modal:max-leverage')}
            </span>
            <span className="font-bold">{maxLeverage}x</span>
          </div>
        </div>
      </div>
      <div className="absolute left-1/2 mt-3 w-[600px] -translate-x-1/2 transform rounded-md bg-th-bkg-2 p-4">
        <div className="flex flex-col items-center">
          {!copied ? (
            <div className="flex space-x-4 pb-4">
              <div className="flex items-center">
                <label className="mr-1.5 text-th-fgd-2">
                  {t('share-modal:show-size')}
                </label>
                <Switch
                  checked={showSize}
                  onChange={(checked) => setShowSize(checked)}
                />
              </div>
              {hasRequiredMngo ? (
                <div className="flex items-center">
                  <label className="mr-1.5 text-th-fgd-2">
                    {t('share-modal:show-referral-qr')}
                  </label>
                  <Switch
                    checked={showReferral}
                    onChange={(checked) => setShowReferral(checked)}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
          {copied ? (
            <a
              className="block flex items-center justify-center rounded-full bg-th-bkg-button px-6 py-2 text-center font-bold text-th-fgd-1 hover:cursor-pointer hover:text-th-fgd-1 hover:brightness-[1.1]"
              href={`https://twitter.com/intent/tweet?text=I'm ${side.toUpperCase()} %24${
                position.marketConfig.baseSymbol
              } perp on %40mangomarkets%0A[PASTE IMAGE HERE]`}
              target="_blank"
              rel="noreferrer"
            >
              <TwitterIcon className="mr-1.5 h-4 w-4" />
              <div>{t('share-modal:tweet-position')}</div>
            </a>
          ) : (
            <div>
              <Button onClick={handleCopyToClipboard}>
                <div className="flex items-center">
                  <TwitterIcon className="mr-1.5 h-4 w-4" />
                  {t('share-modal:copy-and-share')}
                </div>
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default ShareModal
