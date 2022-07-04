import { useTranslation } from 'next-i18next'
import useMangoStore from '../stores/useMangoStore'
import useMangoAccount from '../hooks/useMangoAccount'
import {
  I80F48,
  nativeI80F48ToUi,
  QUOTE_INDEX,
  ZERO_I80F48,
} from '@blockworks-foundation/mango-client'
import { abbreviateAddress, formatUsdValue, usdFormatter } from 'utils'
import { DataLoader } from './MarketPosition'

const AccountOverviewPopover = ({
  collapsed,
  health,
}: {
  collapsed: boolean
  health: I80F48
}) => {
  const { t } = useTranslation('common')
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const { mangoAccount, initialLoad } = useMangoAccount()
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)

  const I80F48_100 = I80F48.fromString('100')

  const initHealth =
    mangoAccount && mangoGroup && mangoCache
      ? mangoAccount.getHealth(mangoGroup, mangoCache, 'Init')
      : I80F48_100

  const equity =
    mangoAccount && mangoGroup && mangoCache
      ? mangoAccount.computeValue(mangoGroup, mangoCache)
      : ZERO_I80F48

  return (
    <>
      {mangoAccount ? (
        <div className="w-full">
          {collapsed ? (
            <div className="pb-2">
              <p className="mb-0 text-xs text-th-fgd-3">{t('account')}</p>
              <p className="mb-0 font-bold text-th-fgd-1">
                {abbreviateAddress(mangoAccount.publicKey)}
              </p>
            </div>
          ) : null}
          <div className="pb-2">
            <p className="mb-0 text-xs leading-4">{t('value')}</p>
            <p className="mb-0 font-bold text-th-fgd-1">
              {initialLoad ? <DataLoader /> : formatUsdValue(+equity)}
            </p>
          </div>
          <div className="pb-2">
            <p className="mb-0 text-xs leading-4">{t('health')}</p>
            <p className="mb-0 font-bold text-th-fgd-1">
              {health.gt(I80F48_100) ? '>100' : health.toFixed(2)}%
            </p>
          </div>
          <div className="pb-2">
            <p className="mb-0 text-xs leading-4">{t('leverage')}</p>
            <p className="mb-0 font-bold text-th-fgd-1">
              {initialLoad ? (
                <DataLoader />
              ) : mangoAccount && mangoGroup && mangoCache ? (
                `${mangoAccount
                  .getLeverage(mangoGroup, mangoCache)
                  .toFixed(2)}x`
              ) : (
                '0.00x'
              )}
            </p>
          </div>
          <div className="pb-2">
            <p className="mb-0 text-xs leading-4">
              {t('collateral-available')}
            </p>
            <p className="mb-0 font-bold text-th-fgd-1">
              {initialLoad ? (
                <DataLoader />
              ) : mangoAccount && mangoGroup ? (
                usdFormatter(
                  nativeI80F48ToUi(
                    initHealth,
                    mangoGroup.tokens[QUOTE_INDEX].decimals
                  ).toFixed()
                )
              ) : (
                '--'
              )}
            </p>
          </div>
          <div>
            <p className="mb-0 text-xs leading-4">
              {marketConfig.name} {t('margin-available')}
            </p>
            <p className="mb-0 font-bold text-th-fgd-1">
              {mangoAccount && mangoGroup && mangoCache
                ? usdFormatter(
                    nativeI80F48ToUi(
                      mangoAccount.getMarketMarginAvailable(
                        mangoGroup,
                        mangoCache,
                        marketConfig.marketIndex,
                        marketConfig.kind
                      ),
                      mangoGroup.tokens[QUOTE_INDEX].decimals
                    ).toFixed()
                  )
                : '0.00'}
            </p>
          </div>
        </div>
      ) : null}
    </>
  )
}

export default AccountOverviewPopover
