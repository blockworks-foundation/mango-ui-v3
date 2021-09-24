import { ElementTitle } from './styles'
import useMangoStore from '../stores/useMangoStore'
import { i80f48ToPercent, floorToDecimal } from '../utils/index'
import Tooltip from './Tooltip'
import {
  getTokenBySymbol,
  nativeI80F48ToUi,
} from '@blockworks-foundation/mango-client'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from './TradePageGrid'

export default function MarketBalances() {
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoGroupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const mangoGroupCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const selectedMarket = useMangoStore((s) => s.selectedMarket.current)
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const connected = useMangoStore((s) => s.wallet.connected)
  const isLoading = useMangoStore((s) => s.selectedMangoAccount.initialLoad)
  const baseSymbol = marketConfig.baseSymbol
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false

  if (!mangoGroup || !selectedMarket) return null

  return (
    <div className={!connected ? 'filter blur' : null}>
      {!isMobile ? <ElementTitle>Balances</ElementTitle> : null}
      {mangoGroup ? (
        <div className="grid grid-cols-2 grid-rows-1 gap-4 pt-2">
          {mangoGroupConfig.tokens
            .filter((t) => t.symbol === baseSymbol || t.symbol === 'USDC')
            .reverse()
            .map(({ symbol, mintKey }) => {
              const tokenIndex = mangoGroup.getTokenIndex(mintKey)
              const deposit = mangoAccount
                ? mangoAccount.getUiDeposit(
                    mangoGroupCache.rootBankCache[tokenIndex],
                    mangoGroup,
                    tokenIndex
                  )
                : null
              const borrow = mangoAccount
                ? mangoAccount.getUiBorrow(
                    mangoGroupCache.rootBankCache[tokenIndex],
                    mangoGroup,
                    tokenIndex
                  )
                : null
              return (
                <div
                  className="border border-th-bkg-4 p-4 rounded-md"
                  key={mintKey.toString()}
                >
                  <div className="flex items-center justify-between mb-4">
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
                    <div className="pb-0.5 text-th-fgd-3 text-xs">Balance</div>
                    <div className={`text-th-fgd-1`}>
                      {isLoading ? (
                        <DataLoader />
                      ) : mangoAccount ? (
                        deposit.gt(borrow) ? (
                          deposit.toFixed()
                        ) : (
                          `-${borrow.toFixed()}`
                        )
                      ) : (
                        0
                      )}
                    </div>
                  </div>
                  <div className="pb-3">
                    <Tooltip content="Available to withdraw after accounting for collateral and open orders">
                      <div className="pb-0.5 text-th-fgd-3 text-xs">
                        Available Balance
                      </div>
                    </Tooltip>
                    <div className={`text-th-fgd-1`}>
                      {isLoading ? (
                        <DataLoader />
                      ) : mangoAccount ? (
                        floorToDecimal(
                          nativeI80F48ToUi(
                            mangoAccount.getAvailableBalance(
                              mangoGroup,
                              mangoGroupCache,
                              tokenIndex
                            ),
                            mangoGroup.tokens[tokenIndex].decimals
                          ).toNumber(),
                          getTokenBySymbol(mangoGroupConfig, symbol).decimals
                        )
                      ) : (
                        0
                      )}
                    </div>
                  </div>
                  <div>
                    <Tooltip content="Deposit APY / Borrow APR">
                      <div
                        className={`cursor-help font-normal pb-0.5 text-th-fgd-3 default-transition text-xs hover:border-th-bkg-2 hover:text-th-fgd-3`}
                      >
                        Deposit/Borrow Rates
                      </div>
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
                    </Tooltip>
                  </div>
                </div>
              )
            })}
        </div>
      ) : null}
    </div>
  )
}

export const DataLoader = () => (
  <div className="animate-pulse bg-th-bkg-3 h-5 w-10 rounded-sm" />
)
