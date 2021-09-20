import { useCallback, useMemo, useState } from 'react'
import { ElementTitle } from './styles'
import useMangoStore from '../stores/useMangoStore'
import { formatUsdValue } from '../utils/index'
import Button, { LinkButton } from './Button'
import Tooltip from './Tooltip'
import SideBadge from './SideBadge'
import {
  getMarketIndexBySymbol,
  nativeI80F48ToUi,
  PerpAccount,
  PerpMarket,
  QUOTE_INDEX,
  ZERO_BN,
  ZERO_I80F48,
} from '@blockworks-foundation/mango-client'
import useTradeHistory from '../hooks/useTradeHistory'
import { getAvgEntryPrice, getBreakEvenPrice } from './PerpPositionsTable'
import { notify } from '../utils/notifications'
import MarketCloseModal from './MarketCloseModal'
import Loading from './Loading'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from './TradePageGrid'

const settlePnl = async (perpMarket: PerpMarket, perpAccount: PerpAccount) => {
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
  const mangoGroupCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const selectedMarket = useMangoStore((s) => s.selectedMarket.current)
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const connected = useMangoStore((s) => s.wallet.connected)
  const isLoading = useMangoStore((s) => s.selectedMangoAccount.initialLoad)
  const setMangoStore = useMangoStore((s) => s.set)
  const baseSymbol = marketConfig.baseSymbol
  const marketName = marketConfig.name
  const tradeHistory = useTradeHistory()
  const perpTradeHistory = tradeHistory?.filter(
    (t) => t.marketName === marketName
  )
  const [showMarketCloseModal, setShowMarketCloseModal] = useState(false)
  const [settling, setSettling] = useState(false)
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false

  const marketIndex = useMemo(() => {
    return getMarketIndexBySymbol(mangoGroupConfig, baseSymbol)
  }, [mangoGroupConfig, baseSymbol])

  let perpAccount, perpPnl
  if (marketName.includes('PERP') && mangoAccount) {
    perpAccount = mangoAccount.perpAccounts[marketIndex]
    perpPnl = perpAccount.getPnl(
      mangoGroup.perpMarkets[marketIndex],
      mangoGroupCache.perpMarketCache[marketIndex],
      mangoGroupCache.priceCache[marketIndex].price
    )
  }

  const handleSizeClick = (size) => {
    setMangoStore((state) => {
      state.tradeForm.baseSize = size
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

  if (!mangoGroup || !selectedMarket) return null

  return selectedMarket instanceof PerpMarket ? (
    <>
      <div className={!connected && !isMobile ? 'filter blur-sm' : null}>
        {!isMobile ? (
          <ElementTitle>Position: {marketConfig.name} </ElementTitle>
        ) : null}
        <div className={`flex items-center justify-between pb-3`}>
          <div className="font-normal text-th-fgd-3 leading-4">Side</div>
          {isLoading ? (
            <DataLoader />
          ) : perpAccount && !perpAccount.basePosition.eq(ZERO_BN) ? (
            <SideBadge
              side={perpAccount.basePosition.gt(ZERO_BN) ? 'long' : 'short'}
            />
          ) : (
            '--'
          )}
        </div>
        <div className={`flex justify-between pb-3`}>
          <div className="font-normal text-th-fgd-3 leading-4">
            Position size
          </div>
          <div className={`text-th-fgd-1`}>
            {isLoading ? (
              <DataLoader />
            ) : perpAccount &&
              Math.abs(
                selectedMarket.baseLotsToNumber(perpAccount.basePosition)
              ) > 0 ? (
              <span
                className="cursor-pointer underline hover:no-underline"
                onClick={() =>
                  handleSizeClick(
                    Math.abs(
                      selectedMarket.baseLotsToNumber(perpAccount.basePosition)
                    )
                  )
                }
              >
                {`${Math.abs(
                  selectedMarket.baseLotsToNumber(perpAccount.basePosition)
                )} ${baseSymbol}`}
              </span>
            ) : (
              `0 ${baseSymbol}`
            )}
          </div>
        </div>
        <div className={`flex justify-between pb-3`}>
          <div className="font-normal text-th-fgd-3 leading-4">
            Notional size
          </div>
          <div className={`text-th-fgd-1`}>
            {isLoading ? (
              <DataLoader />
            ) : perpAccount ? (
              formatUsdValue(
                Math.abs(
                  selectedMarket.baseLotsToNumber(perpAccount.basePosition) *
                    mangoGroup.getPrice(marketIndex, mangoGroupCache).toNumber()
                )
              )
            ) : (
              0
            )}
          </div>
        </div>
        <div className={`flex justify-between pb-3`}>
          <div className="font-normal text-th-fgd-3 leading-4">
            Avg entry price
          </div>
          <div className={`text-th-fgd-1`}>
            {isLoading ? (
              <DataLoader />
            ) : perpAccount ? (
              getAvgEntryPrice(
                mangoAccount,
                perpAccount,
                selectedMarket,
                perpTradeHistory
              )
            ) : (
              0
            )}
          </div>
        </div>
        <div className={`flex justify-between pb-3`}>
          <div className="font-normal text-th-fgd-3 leading-4">
            Break-even price
          </div>
          <div className={`text-th-fgd-1`}>
            {isLoading ? (
              <DataLoader />
            ) : perpAccount ? (
              getBreakEvenPrice(
                mangoAccount,
                perpAccount,
                selectedMarket,
                perpTradeHistory
              )
            ) : (
              0
            )}
          </div>
        </div>
        <div className={`flex justify-between pb-3`}>
          <Tooltip content={<SettlePnlTooltip />}>
            <Tooltip.Content className="font-normal text-th-fgd-3 leading-4">
              Unsettled PnL
            </Tooltip.Content>
          </Tooltip>
          <div
            className={`flex items-center ${
              perpPnl?.gt(ZERO_I80F48)
                ? 'text-th-green'
                : perpPnl?.lt(ZERO_I80F48)
                ? 'text-th-red'
                : 'text-th-fgd-1'
            }`}
          >
            {isLoading ? (
              <DataLoader />
            ) : perpAccount ? (
              formatUsdValue(
                +nativeI80F48ToUi(perpPnl, marketConfig.quoteDecimals)
              )
            ) : (
              '0'
            )}
            {settling ? (
              <Loading className="ml-2" />
            ) : (
              <LinkButton
                onClick={() => handleSettlePnl(selectedMarket, perpAccount)}
                className="ml-2 text-th-primary text-xs disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:underline"
                disabled={perpAccount ? perpPnl.eq(ZERO_I80F48) : true}
              >
                Settle
              </LinkButton>
            )}
          </div>
        </div>
        {perpAccount &&
        Math.abs(selectedMarket.baseLotsToNumber(perpAccount.basePosition)) >
          0 ? (
          <Button
            onClick={() => setShowMarketCloseModal(true)}
            className="mt-3 w-full"
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
  ) : null
}

export const DataLoader = () => (
  <div className="animate-pulse bg-th-bkg-3 h-5 w-10 rounded-sm" />
)
