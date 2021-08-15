import { useCallback, useMemo, useState } from 'react'
import FloatingElement from './FloatingElement'
import { ElementTitle } from './styles'
import useMangoStore, { mangoClient } from '../stores/useMangoStore'
import { i80f48ToPercent, tokenPrecision, formatUsdValue } from '../utils/index'
import DepositModal from './DepositModal'
import WithdrawModal from './WithdrawModal'
import Button from './Button'
import Tooltip from './Tooltip'
import SideBadge from './SideBadge'
import {
  getMarketIndexBySymbol,
  nativeI80F48ToUi,
  PerpAccount,
  PerpMarket,
  QUOTE_INDEX,
  ZERO_BN,
} from '@blockworks-foundation/mango-client'
import useTradeHistory from '../hooks/useTradeHistory'
import { getAvgEntryPrice, getBreakEvenPrice } from './PositionsTable'
import { notify } from '../utils/notifications'

const handleSettlePnl = async (
  perpMarket: PerpMarket,
  perpAccount: PerpAccount
) => {
  const mangoAccount = useMangoStore.getState().selectedMangoAccount.current
  const mangoGroup = useMangoStore.getState().selectedMangoGroup.current
  const mangoCache = useMangoStore.getState().selectedMangoGroup.cache
  const wallet = useMangoStore.getState().wallet.current
  const actions = useMangoStore.getState().actions
  const marketIndex = mangoGroup.getPerpMarketIndex(perpMarket.publicKey)

  try {
    const txid = await mangoClient.settlePnl(
      mangoGroup,
      mangoAccount,
      perpMarket,
      mangoGroup.rootBankAccounts[QUOTE_INDEX],
      mangoCache.priceCache[marketIndex].price,
      wallet
    )
    actions.fetchMangoAccounts()
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

export default function MarketPosition() {
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoGroupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const mangoGroupCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const selectedMarket = useMangoStore((s) => s.selectedMarket.current)
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const connected = useMangoStore((s) => s.wallet.connected)
  const baseSymbol = marketConfig.baseSymbol
  const marketName = marketConfig.name
  const tradeHistory = useTradeHistory()
  const perpTradeHistory = tradeHistory?.filter(
    (t) => t.marketName === marketName
  )

  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)

  const marketIndex = useMemo(() => {
    return getMarketIndexBySymbol(mangoGroupConfig, baseSymbol)
  }, [mangoGroupConfig, baseSymbol])

  const perpAccount = useMemo(() => {
    if (marketName.includes('PERP') && mangoAccount) {
      return mangoAccount.perpAccounts[marketIndex]
    }
  }, [marketName, mangoAccount, marketIndex])

  const handleCloseDeposit = useCallback(() => {
    setShowDepositModal(false)
  }, [])

  const handleCloseWithdraw = useCallback(() => {
    setShowWithdrawModal(false)
  }, [])

  return selectedMarket instanceof PerpMarket ? (
    <FloatingElement showConnect>
      <div className={!connected ? 'filter blur-sm' : null}>
        <ElementTitle>Position</ElementTitle>
        <div className={`flex items-center justify-between pt-1 pb-2`}>
          <div className="font-normal text-th-fgd-3 leading-4">Side</div>
          {perpAccount && !perpAccount.basePosition.eq(ZERO_BN) ? (
            <SideBadge
              side={perpAccount.basePosition.gt(ZERO_BN) ? 'long' : 'short'}
            />
          ) : (
            '--'
          )}
        </div>
        <div className={`flex justify-between pt-2 pb-2`}>
          <div className="font-normal text-th-fgd-3 leading-4">
            Position size
          </div>
          <div className={`text-th-fgd-1`}>
            {perpAccount
              ? selectedMarket.baseLotsToNumber(perpAccount.basePosition)
              : 0}{' '}
            {baseSymbol}
          </div>
        </div>
        <div className={`flex justify-between pt-2 pb-2`}>
          <div className="font-normal text-th-fgd-3 leading-4">
            Notional size
          </div>
          <div className={`text-th-fgd-1`}>
            {perpAccount
              ? formatUsdValue(
                  selectedMarket.baseLotsToNumber(perpAccount.basePosition) *
                    mangoGroup.getPrice(marketIndex, mangoGroupCache).toNumber()
                )
              : 0}
          </div>
        </div>
        <div className={`flex justify-between pt-2 pb-2`}>
          <div className="font-normal text-th-fgd-3 leading-4">
            Avg entry price
          </div>
          <div className={`text-th-fgd-1`}>
            {perpAccount
              ? getAvgEntryPrice(
                  mangoAccount,
                  perpAccount,
                  selectedMarket,
                  perpTradeHistory
                )
              : 0}
          </div>
        </div>
        <div className={`flex justify-between pt-2 pb-2`}>
          <div className="font-normal text-th-fgd-3 leading-4">
            Break-even price
          </div>
          <div className={`text-th-fgd-1`}>
            {perpAccount
              ? getBreakEvenPrice(
                  mangoAccount,
                  perpAccount,
                  selectedMarket,
                  perpTradeHistory
                )
              : 0}
          </div>
        </div>
        <div className={`flex justify-between pt-2 pb-2`}>
          <div className="font-normal text-th-fgd-3 leading-4">
            Unsettled PnL
          </div>
          <div className={`text-th-fgd-1`}>
            {perpAccount
              ? formatUsdValue(
                  +nativeI80F48ToUi(
                    perpAccount.getPnl(
                      mangoGroup.perpMarkets[marketIndex],
                      mangoGroupCache.priceCache[marketIndex].price
                    ),
                    marketConfig.quoteDecimals
                  )
                )
              : '0'}
          </div>
        </div>
        <div className="flex">
          {perpAccount ? (
            <Button
              className="mt-4 w-full"
              disabled={!connected}
              onClick={() => handleSettlePnl(selectedMarket, perpAccount)}
            >
              Settle PNL
            </Button>
          ) : null}
        </div>
      </div>
    </FloatingElement>
  ) : (
    <>
      <FloatingElement showConnect>
        <div className={!connected ? 'filter blur' : null}>
          <ElementTitle>Balances</ElementTitle>
          {mangoGroup ? (
            <div className="grid grid-cols-2 grid-rows-1 gap-4 pt-2">
              {mangoGroupConfig.tokens
                .filter((t) => t.symbol === baseSymbol || t.symbol === 'USDC')
                .reverse()
                .map(({ symbol, mintKey }) => {
                  const tokenIndex = mangoGroup.getTokenIndex(mintKey)
                  return (
                    <div
                      className="border border-th-bkg-4 mb-4 p-3 rounded-md"
                      key={mintKey.toString()}
                    >
                      <div className="border-b border-th-bkg-4 flex items-center justify-between mb-3 pb-3">
                        <div className="flex items-center">
                          <img
                            alt=""
                            src={`/assets/icons/${symbol.toLowerCase()}.svg`}
                            className={`h-5 mr-2.5 w-auto`}
                          />
                          <span className="text-th-fgd-2">{symbol}</span>
                        </div>
                      </div>
                      <div className="pb-3">
                        <div className="pb-0.5 text-th-fgd-3 text-xs">
                          Deposits
                        </div>
                        <div className={`text-th-fgd-1`}>
                          {mangoAccount
                            ? mangoAccount
                                .getUiDeposit(
                                  mangoGroupCache.rootBankCache[tokenIndex],
                                  mangoGroup,
                                  tokenIndex
                                )
                                .toFixed(tokenPrecision[symbol])
                            : (0).toFixed(tokenPrecision[symbol])}
                        </div>
                      </div>
                      <div className="pb-3">
                        <div className="pb-0.5 text-th-fgd-3 text-xs">
                          Borrows
                        </div>
                        <div className={`text-th-fgd-1`}>
                          {mangoAccount
                            ? mangoAccount
                                .getUiBorrow(
                                  mangoGroupCache.rootBankCache[tokenIndex],
                                  mangoGroup,
                                  tokenIndex
                                )
                                .toFixed(tokenPrecision[symbol])
                            : (0).toFixed(tokenPrecision[symbol])}
                        </div>
                      </div>
                      <div>
                        <Tooltip content="Deposit APY and Borrow APR">
                          <div
                            className={`cursor-help font-normal pb-0.5 text-th-fgd-3 text-xs default-transition hover:border-th-bkg-2 hover:text-th-fgd-3`}
                          >
                            Interest Rates
                          </div>
                        </Tooltip>
                        <div className={`text-th-fgd-1`}>
                          <span className={`text-th-green`}>
                            {i80f48ToPercent(
                              mangoGroup.getDepositRate(tokenIndex)
                            ).toFixed(2)}
                            %
                          </span>
                          <span className={`text-th-fgd-4`}>{'  /  '}</span>
                          <span className={`text-th-red`}>
                            {i80f48ToPercent(
                              mangoGroup.getBorrowRate(tokenIndex)
                            ).toFixed(2)}
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          ) : null}
          <div className={`grid grid-cols-2 grid-rows-1 gap-4 pt-2`}>
            <Button
              onClick={() => setShowDepositModal(true)}
              className="w-full"
              disabled={!connected}
            >
              <span>Deposit</span>
            </Button>
            <Button
              onClick={() => setShowWithdrawModal(true)}
              className="w-full"
              disabled={!connected}
            >
              <span>Withdraw</span>
            </Button>
          </div>
        </div>
      </FloatingElement>
      {showDepositModal && (
        <DepositModal isOpen={showDepositModal} onClose={handleCloseDeposit} />
      )}
      {showWithdrawModal && (
        <WithdrawModal
          isOpen={showWithdrawModal}
          onClose={handleCloseWithdraw}
        />
      )}
    </>
  )
}
