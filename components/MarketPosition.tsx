import { useCallback, useMemo, useState } from 'react'
import { ElementTitle } from './styles'
import useMangoStore from '../stores/useMangoStore'
import { formatUsdValue } from '../utils/index'
import Button, { LinkButton } from './Button'
import Tooltip from './Tooltip'
import PerpSideBadge from './PerpSideBadge'
import {
  getMarketIndexBySymbol,
  PerpAccount,
  PerpMarket,
  QUOTE_INDEX,
} from '@blockworks-foundation/mango-client'
import useTradeHistory from '../hooks/useTradeHistory'
import { notify } from '../utils/notifications'
import MarketCloseModal from './MarketCloseModal'
import PnlText from './PnlText'
import Loading from './Loading'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from './TradePageGrid'
import { collectPerpPosition } from '../hooks/usePerpPositions'

export const settlePnl = async (
  perpMarket: PerpMarket,
  perpAccount: PerpAccount
) => {
  const mangoAccount = useMangoStore.getState().selectedMangoAccount.current
  const mangoGroup = useMangoStore.getState().selectedMangoGroup.current
  const mangoCache = useMangoStore.getState().selectedMangoGroup.cache
  const wallet = useMangoStore.getState().wallet.current
  const actions = useMangoStore.getState().actions
  const marketIndex = mangoGroup.getPerpMarketIndex(perpMarket.publicKey)
  const mangoClient = useMangoStore.getState().connection.client

  try {
    const txid = await mangoClient.settlePnl(
      mangoGroup,
      mangoCache,
      mangoAccount,
      perpMarket,
      mangoGroup.rootBankAccounts[QUOTE_INDEX],
      mangoCache.priceCache[marketIndex].price,
      wallet
    )
    actions.reloadMangoAccount()
    notify({
      title: 'Successfully settled PNL',
      description: '',
      txid,
    })
  } catch (e) {
    console.log('Error settling PNL: ', `${e}`, `${perpAccount}`)
    notify({
      title: 'Error settling PNL',
      description: e.message,
      txid: e.txid,
      type: 'error',
    })
  }
}

export function SettlePnlTooltip() {
  return (
    <div>
      Settling will update your USDC balance to reflect the unsettled PnL
      amount.{' '}
      <a
        href="https://docs.mango.markets/mango-v3/overview#settle-pnl"
        target="_blank"
        rel="noopener noreferrer"
      >
        Learn more
      </a>
    </div>
  )
}

export default function MarketPosition() {
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoGroupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const selectedMarket = useMangoStore((s) => s.selectedMarket.current)
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const connected = useMangoStore((s) => s.wallet.connected)
  const isLoading = useMangoStore((s) => s.selectedMangoAccount.initialLoad)
  const setMangoStore = useMangoStore((s) => s.set)
  const price = useMangoStore((s) => s.tradeForm.price)
  const baseSymbol = marketConfig.baseSymbol
  const marketName = marketConfig.name
  const tradeHistory = useTradeHistory()

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

  const handleSizeClick = (size, side) => {
    const step = selectedMarket.minOrderSize

    const priceOrDefault = price
      ? price
      : mangoGroup.getPrice(marketIndex, mangoCache).toNumber()
    const roundedSize = Math.round(size / step) * step
    const quoteSize = roundedSize * priceOrDefault
    setMangoStore((state) => {
      state.tradeForm.baseSize = roundedSize
      state.tradeForm.quoteSize = quoteSize.toFixed(2)
      state.tradeForm.side = side === 'buy' ? 'sell' : 'buy'
    })
  }

  const handleCloseWarning = useCallback(() => {
    setShowMarketCloseModal(false)
  }, [])

  const handleSettlePnl = (perpMarket, perpAccount) => {
    setSettling(true)
    settlePnl(perpMarket, perpAccount).then(() => {
      setSettling(false)
    })
  }

  if (!mangoGroup || !selectedMarket || !(selectedMarket instanceof PerpMarket))
    return null

  const {
    basePosition,
    avgEntryPrice,
    breakEvenPrice,
    notionalSize,
    unsettledPnl,
  } = collectPerpPosition(
    mangoAccount,
    mangoGroup,
    mangoCache,
    marketConfig,
    selectedMarket,
    tradeHistory
  )

  return (
    <>
      <div className={!connected && !isMobile ? 'filter blur-sm' : null}>
        {!isMobile ? (
          <ElementTitle>{marketConfig.name} Position</ElementTitle>
        ) : null}
        <div className="flex items-center justify-between pb-3">
          <div className="font-normal text-th-fgd-3 leading-4">Side</div>
          {isLoading ? (
            <DataLoader />
          ) : (
            <PerpSideBadge perpAccount={perpAccount}></PerpSideBadge>
          )}
        </div>
        <div className="flex justify-between pb-3">
          <div className="font-normal text-th-fgd-3 leading-4">
            Position size
          </div>
          <div className="text-th-fgd-1">
            {isLoading ? (
              <DataLoader />
            ) : basePosition ? (
              <span
                className="cursor-pointer underline hover:no-underline"
                onClick={() =>
                  handleSizeClick(
                    Math.abs(basePosition),
                    basePosition > 0 ? 'buy' : 'sell'
                  )
                }
              >
                {`${Math.abs(basePosition)} ${baseSymbol}`}
              </span>
            ) : (
              `0 ${baseSymbol}`
            )}
          </div>
        </div>
        <div className="flex justify-between pb-3">
          <div className="font-normal text-th-fgd-3 leading-4">
            Notional size
          </div>
          <div className="text-th-fgd-1">
            {isLoading ? (
              <DataLoader />
            ) : (
              formatUsdValue(Math.abs(notionalSize))
            )}
          </div>
        </div>
        <div className="flex justify-between pb-3">
          <div className="font-normal text-th-fgd-3 leading-4">
            Avg entry price
          </div>
          <div className="text-th-fgd-1">
            {isLoading ? <DataLoader /> : formatUsdValue(avgEntryPrice)}
          </div>
        </div>
        <div className="flex justify-between pb-3">
          <div className="font-normal text-th-fgd-3 leading-4">
            Break-even price
          </div>
          <div className="text-th-fgd-1">
            {isLoading ? <DataLoader /> : formatUsdValue(breakEvenPrice)}
          </div>
        </div>
        <div className="flex justify-between pb-3">
          <Tooltip content={<SettlePnlTooltip />}>
            <Tooltip.Content className="font-normal text-th-fgd-3 leading-4">
              Unsettled Balance
            </Tooltip.Content>
          </Tooltip>
          <div className="flex items-center">
            {isLoading ? <DataLoader /> : <PnlText pnl={unsettledPnl} />}
            {settling ? (
              <Loading className="ml-2" />
            ) : (
              <LinkButton
                onClick={() => handleSettlePnl(selectedMarket, perpAccount)}
                className="ml-2 text-th-primary text-xs disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:underline"
                disabled={unsettledPnl === 0}
              >
                Settle
              </LinkButton>
            )}
          </div>
        </div>
        {basePosition ? (
          <Button
            onClick={() => setShowMarketCloseModal(true)}
            className="mt-2.5 w-full"
          >
            <span>Market Close</span>
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
  <div className="animate-pulse bg-th-bkg-3 h-5 w-10 rounded-sm" />
)
