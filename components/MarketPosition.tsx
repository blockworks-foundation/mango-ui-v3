import { useCallback, useMemo, useState } from 'react'
import { ElementTitle } from './styles'
import useMangoStore from '../stores/useMangoStore'
import { formatUsdValue, getPrecisionDigits, roundPerpSize } from '../utils'
import Button, { LinkButton } from './Button'
import Tooltip from './Tooltip'
import PerpSideBadge from './PerpSideBadge'
import {
  getMarketIndexBySymbol,
  MangoAccount,
  PerpAccount,
  PerpMarket,
  QUOTE_INDEX,
} from '@blockworks-foundation/mango-client'
import { notify } from '../utils/notifications'
import MarketCloseModal from './MarketCloseModal'
import PnlText from './PnlText'
import Loading from './Loading'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from './TradePageGrid'
import { useTranslation } from 'next-i18next'
import useMangoAccount from '../hooks/useMangoAccount'
import { useWallet, Wallet } from '@solana/wallet-adapter-react'

export const settlePosPnl = async (
  perpMarkets: PerpMarket[],
  perpAccount: PerpAccount,
  t,
  mangoAccounts: MangoAccount[] | undefined,
  wallet: Wallet
) => {
  const mangoAccount = useMangoStore.getState().selectedMangoAccount.current
  const mangoGroup = useMangoStore.getState().selectedMangoGroup.current
  const mangoCache = useMangoStore.getState().selectedMangoGroup.cache
  const actions = useMangoStore.getState().actions
  const mangoClient = useMangoStore.getState().connection.client

  const rootBankAccount = mangoGroup?.rootBankAccounts[QUOTE_INDEX]

  if (!mangoGroup || !mangoCache || !mangoAccount || !rootBankAccount) return

  try {
    const txids = await mangoClient.settlePosPnl(
      mangoGroup,
      mangoCache,
      mangoAccount,
      perpMarkets,
      rootBankAccount,
      wallet?.adapter,
      mangoAccounts
    )
    actions.reloadMangoAccount()
    // FIXME: Remove filter when settlePosPnl return type is undefined or string[]
    const filteredTxids = txids?.filter(
      (x) => typeof x === 'string'
    ) as string[]
    if (filteredTxids) {
      for (const txid of filteredTxids) {
        notify({
          title: t('pnl-success'),
          description: '',
          txid,
        })
      }
    } else {
      notify({
        title: t('pnl-error'),
        description: 'Transaction failed',
        type: 'error',
      })
    }
  } catch (e) {
    console.log('Error settling PNL: ', `${e}`, `${perpAccount}`)
    notify({
      title: t('pnl-error'),
      description: e.message,
      txid: e.txid,
      type: 'error',
    })
  }
}

export const settlePnl = async (
  perpMarket: PerpMarket,
  perpAccount: PerpAccount,
  t,
  mangoAccounts: MangoAccount[] | undefined,
  wallet: Wallet
) => {
  const mangoAccount = useMangoStore.getState().selectedMangoAccount.current
  const mangoGroup = useMangoStore.getState().selectedMangoGroup.current
  const mangoCache = useMangoStore.getState().selectedMangoGroup.cache
  const actions = useMangoStore.getState().actions
  const marketIndex = mangoGroup?.getPerpMarketIndex(perpMarket.publicKey)
  const mangoClient = useMangoStore.getState().connection.client
  const rootBank = mangoGroup?.rootBankAccounts[QUOTE_INDEX]

  if (
    !rootBank ||
    !mangoGroup ||
    !mangoCache ||
    !mangoAccount ||
    typeof marketIndex !== 'number'
  )
    return

  try {
    const txid = await mangoClient.settlePnl(
      mangoGroup,
      mangoCache,
      mangoAccount,
      perpMarket,
      rootBank,
      mangoCache.priceCache[marketIndex].price,
      wallet?.adapter,
      mangoAccounts
    )
    actions.reloadMangoAccount()
    if (txid) {
      notify({
        title: t('pnl-success'),
        description: '',
        txid,
      })
    } else {
      notify({
        title: t('pnl-error'),
        description: 'Transaction failed',
        type: 'error',
      })
    }
  } catch (e) {
    console.log('Error settling PNL: ', `${e}`, `${perpAccount}`)
    notify({
      title: t('pnl-error'),
      description: e.message,
      txid: e.txid,
      type: 'error',
    })
  }
}

export default function MarketPosition() {
  const { t } = useTranslation('common')
  const { wallet, connected } = useWallet()
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoGroupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const { mangoAccount, initialLoad } = useMangoAccount()
  const selectedMarket = useMangoStore((s) => s.selectedMarket.current)
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const setMangoStore = useMangoStore((s) => s.set)
  const price = useMangoStore((s) => s.tradeForm.price)
  const perpAccounts = useMangoStore((s) => s.selectedMangoAccount.perpAccounts)
  const baseSymbol = marketConfig.baseSymbol
  const marketName = marketConfig.name

  const [showMarketCloseModal, setShowMarketCloseModal] = useState(false)
  const [settling, setSettling] = useState(false)
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false

  const marketIndex = useMemo(() => {
    return getMarketIndexBySymbol(mangoGroupConfig, baseSymbol)
  }, [mangoGroupConfig, baseSymbol])

  let perpAccount
  if (marketName.includes('PERP') && mangoAccount) {
    perpAccount = mangoAccount.perpAccounts[marketIndex]
  }

  const handleSizeClick = (size) => {
    if (!mangoGroup || !mangoCache || !selectedMarket) return
    const sizePrecisionDigits = getPrecisionDigits(selectedMarket.minOrderSize)
    const priceOrDefault = price
      ? price
      : mangoGroup.getPriceUi(marketIndex, mangoCache)
    const roundedSize = parseFloat(Math.abs(size).toFixed(sizePrecisionDigits))
    const quoteSize = parseFloat((roundedSize * priceOrDefault).toFixed(2))
    setMangoStore((state) => {
      state.tradeForm.baseSize = roundedSize
      state.tradeForm.quoteSize = quoteSize
      state.tradeForm.side = size > 0 ? 'sell' : 'buy'
    })
  }

  const handleCloseWarning = useCallback(() => {
    setShowMarketCloseModal(false)
  }, [])

  const handleSettlePnl = (perpMarket, perpAccount) => {
    if (wallet) {
      setSettling(true)
      settlePnl(perpMarket, perpAccount, t, undefined, wallet).then(() => {
        setSettling(false)
      })
    }
  }

  if (!mangoGroup || !selectedMarket || !(selectedMarket instanceof PerpMarket))
    return null

  const {
    basePosition = 0,
    avgEntryPrice = 0,
    breakEvenPrice = 0,
    notionalSize = 0,
    unsettledPnl = 0,
  } = perpAccounts.length
    ? perpAccounts.find((pa) =>
        pa.perpMarket.publicKey.equals(selectedMarket.publicKey)
      )
    : {}

  function SettlePnlTooltip() {
    return (
      <div>
        {t('pnl-help')}{' '}
        <a
          href="https://docs.mango.markets/mango/settle-pnl"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('learn-more')}
        </a>
      </div>
    )
  }

  return (
    <>
      <div
        className={!connected && !isMobile ? 'blur-sm filter' : ''}
        id="perp-positions-tip"
      >
        {!isMobile ? (
          <ElementTitle>
            {marketConfig.name} {t('position')}
          </ElementTitle>
        ) : null}
        <div className="flex items-center justify-between pb-2">
          <div className="font-normal leading-4 text-th-fgd-3">{t('side')}</div>
          {initialLoad ? (
            <DataLoader />
          ) : (
            <PerpSideBadge perpAccount={perpAccount}></PerpSideBadge>
          )}
        </div>
        <div className="flex justify-between pb-2">
          <div className="font-normal leading-4 text-th-fgd-3">
            {t('position-size')}
          </div>
          <div className="text-th-fgd-1">
            {initialLoad ? (
              <DataLoader />
            ) : basePosition ? (
              <span
                className="cursor-pointer underline hover:no-underline"
                onClick={() => handleSizeClick(basePosition)}
              >
                {`${roundPerpSize(basePosition, baseSymbol)} ${baseSymbol}`}
              </span>
            ) : (
              `0 ${baseSymbol}`
            )}
          </div>
        </div>
        <div className="flex justify-between pb-2">
          <div className="font-normal leading-4 text-th-fgd-3">
            {t('notional-size')}
          </div>
          <div className="text-th-fgd-1">
            {initialLoad ? (
              <DataLoader />
            ) : notionalSize ? (
              formatUsdValue(Math.abs(notionalSize))
            ) : (
              '$0'
            )}
          </div>
        </div>
        <div className="flex justify-between pb-2">
          <div className="font-normal leading-4 text-th-fgd-3">
            {t('average-entry')}
          </div>
          <div className="text-th-fgd-1">
            {initialLoad ? (
              <DataLoader />
            ) : avgEntryPrice ? (
              formatUsdValue(avgEntryPrice)
            ) : (
              '$0'
            )}
          </div>
        </div>
        <div className="flex justify-between pb-2">
          <div className="font-normal leading-4 text-th-fgd-3">
            {t('break-even')}
          </div>
          <div className="text-th-fgd-1">
            {initialLoad ? (
              <DataLoader />
            ) : breakEvenPrice ? (
              formatUsdValue(breakEvenPrice)
            ) : (
              '$0'
            )}
          </div>
        </div>
        <div className="flex justify-between pb-2">
          <Tooltip content={<SettlePnlTooltip />}>
            <Tooltip.Content className="font-normal leading-4 text-th-fgd-3">
              {t('unsettled-balance')}
            </Tooltip.Content>
          </Tooltip>
          <div className="flex items-center">
            {initialLoad ? <DataLoader /> : <PnlText pnl={unsettledPnl} />}
            {settling ? (
              <Loading className="ml-2" />
            ) : (
              <LinkButton
                onClick={() => handleSettlePnl(selectedMarket, perpAccount)}
                className="ml-2 text-xs text-th-primary disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:underline"
                disabled={unsettledPnl === 0}
              >
                {t('redeem-pnl')}
              </LinkButton>
            )}
          </div>
        </div>
        {basePosition ? (
          <Button
            onClick={() => setShowMarketCloseModal(true)}
            className="mt-2.5 w-full"
          >
            <span>{t('market-close')}</span>
          </Button>
        ) : null}
      </div>
      {showMarketCloseModal ? (
        <MarketCloseModal
          isOpen={showMarketCloseModal}
          onClose={handleCloseWarning}
          market={selectedMarket}
          marketIndex={marketIndex}
        />
      ) : null}
    </>
  )
}

export const DataLoader = () => (
  <div className="h-5 w-10 animate-pulse rounded-sm bg-th-bkg-3" />
)
