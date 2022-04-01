import { ElementTitle } from './styles'
import useMangoStore from '../stores/useMangoStore'
import { getPrecisionDigits, i80f48ToPercent } from '../utils'
import Tooltip from './Tooltip'
import { nativeI80F48ToUi } from '@blockworks-foundation/mango-client'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from './TradePageGrid'
import { useTranslation } from 'next-i18next'
import { useWallet } from '@solana/wallet-adapter-react'

export default function MarketBalances() {
  const { t } = useTranslation('common')
  const { connected } = useWallet()
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoGroupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const mangoGroupCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const selectedMarket = useMangoStore((s) => s.selectedMarket.current)
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const setMangoStore = useMangoStore((s) => s.set)
  const price = useMangoStore((s) => s.tradeForm.price)
  const isLoading = useMangoStore((s) => s.selectedMangoAccount.initialLoad)
  const baseSymbol = marketConfig.baseSymbol
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false

  const handleSizeClick = (size, symbol) => {
    if (!selectedMarket || !mangoGroup || !mangoGroupCache) return
    const minOrderSize = selectedMarket.minOrderSize
    const sizePrecisionDigits = getPrecisionDigits(minOrderSize)
    const marketIndex = marketConfig.marketIndex

    const priceOrDefault = price
      ? price
      : mangoGroup.getPriceUi(marketIndex, mangoGroupCache)

    let roundedSize, side
    if (symbol === 'USDC') {
      roundedSize = parseFloat(
        (
          Math.abs(size) / priceOrDefault +
          (size < 0 ? minOrderSize / 2 : -minOrderSize / 2)
        ) // round up so neg USDC gets cleared
          .toFixed(sizePrecisionDigits)
      )
      side = size > 0 ? 'buy' : 'sell'
    } else {
      roundedSize = parseFloat(
        (
          Math.abs(size) + (size < 0 ? minOrderSize / 2 : -minOrderSize / 2)
        ).toFixed(sizePrecisionDigits)
      )
      side = size > 0 ? 'sell' : 'buy'
    }
    const quoteSize = parseFloat((roundedSize * priceOrDefault).toFixed(2))
    setMangoStore((state) => {
      state.tradeForm.baseSize = roundedSize
      state.tradeForm.quoteSize = quoteSize
      state.tradeForm.side = side
    })
  }

  if (!mangoGroup || !selectedMarket || !mangoGroupCache) return null

  return (
    <div className={!connected ? 'blur filter' : ''}>
      {!isMobile ? (
        <ElementTitle className="hidden 2xl:flex">{t('balances')}</ElementTitle>
      ) : null}
      {mangoGroup ? (
        <div className="grid grid-cols-2 grid-rows-1 gap-4 md:pt-2">
          {mangoGroupConfig.tokens
            .filter((t) => t.symbol === baseSymbol || t.symbol === 'USDC')
            .reverse()
            .map(({ decimals, symbol, mintKey }) => {
              const tokenIndex = mangoGroup.getTokenIndex(mintKey)
              const balance = mangoAccount
                ? nativeI80F48ToUi(
                    mangoAccount.getNet(
                      mangoGroupCache.rootBankCache[tokenIndex],
                      tokenIndex
                    ),
                    decimals
                  )
                : 0
              const availableBalance = mangoAccount
                ? nativeI80F48ToUi(
                    mangoAccount.getAvailableBalance(
                      mangoGroup,
                      mangoGroupCache,
                      tokenIndex
                    ),
                    decimals
                  )
                : 0

              return (
                <div
                  className="rounded-md border border-th-bkg-4 p-4"
                  key={mintKey.toString()}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <img
                        alt=""
                        src={`/assets/icons/${symbol.toLowerCase()}.svg`}
                        className={`mr-2.5 h-5 w-auto`}
                      />
                      <span className="text-th-fgd-2">{symbol}</span>
                    </div>
                  </div>
                  <div className="pb-3">
                    <div className="pb-0.5 text-xs text-th-fgd-3">
                      {t('balance')}
                    </div>
                    <div
                      className={`text-th-fgd-1 ${
                        balance != 0
                          ? 'cursor-pointer underline hover:no-underline'
                          : ''
                      }`}
                      onClick={() => handleSizeClick(balance, symbol)}
                    >
                      {isLoading ? (
                        <DataLoader />
                      ) : (
                        balance.toLocaleString(undefined, {
                          maximumFractionDigits: decimals,
                        })
                      )}
                    </div>
                  </div>
                  <div className="pb-3">
                    <Tooltip content={t('tooltip-available-after')}>
                      <div className="pb-0.5 text-xs text-th-fgd-3">
                        {t('available-balance')}
                      </div>
                    </Tooltip>
                    <div
                      className={`text-th-fgd-1 ${
                        availableBalance > selectedMarket.minOrderSize
                          ? 'cursor-pointer underline hover:no-underline'
                          : ''
                      }`}
                      onClick={() => handleSizeClick(availableBalance, symbol)}
                    >
                      {isLoading ? (
                        <DataLoader />
                      ) : (
                        availableBalance.toLocaleString(undefined, {
                          maximumFractionDigits: decimals,
                        })
                      )}
                    </div>
                  </div>
                  <div>
                    <Tooltip content={t('tooltip-apy-apr')}>
                      <div
                        className={`default-transition cursor-help pb-0.5 text-xs font-normal text-th-fgd-3 hover:border-th-bkg-2 hover:text-th-fgd-3`}
                      >
                        {t('rates')}
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
  <div className="h-5 w-10 animate-pulse rounded-sm bg-th-bkg-3" />
)
