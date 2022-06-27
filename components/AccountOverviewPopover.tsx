import { useTranslation } from 'next-i18next'
import useMangoStore from '../stores/useMangoStore'
import useMangoAccount from '../hooks/useMangoAccount'
import {
  I80F48,
  nativeI80F48ToUi,
  QUOTE_INDEX,
  ZERO_I80F48,
} from '@blockworks-foundation/mango-client'
import HealthHeart from './HealthHeart'
import { abbreviateAddress, formatUsdValue, usdFormatter } from 'utils'
import { DataLoader } from './MarketPosition'
import { Menu, SubMenu } from 'react-pro-sidebar'
import { useEffect } from 'react'

const AccountOverviewPopover = ({
  collapsed,
  isOpen,
  setIsOpen,
}: {
  collapsed: boolean
  isOpen: boolean
  setIsOpen: (x) => void
}) => {
  const { t } = useTranslation('common')
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const { mangoAccount, initialLoad } = useMangoAccount()
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)

  const I80F48_100 = I80F48.fromString('100')

  const maintHealthRatio =
    mangoAccount && mangoGroup && mangoCache
      ? mangoAccount.getHealthRatio(mangoGroup, mangoCache, 'Maint')
      : I80F48_100

  const initHealth =
    mangoAccount && mangoGroup && mangoCache
      ? mangoAccount.getHealth(mangoGroup, mangoCache, 'Init')
      : I80F48_100

  const equity =
    mangoAccount && mangoGroup && mangoCache
      ? mangoAccount.computeValue(mangoGroup, mangoCache)
      : ZERO_I80F48

  const liquidationPrice =
    mangoGroup && mangoAccount && marketConfig && mangoGroup && mangoCache
      ? mangoAccount.getLiquidationPrice(
          mangoGroup,
          mangoCache,
          marketConfig.marketIndex
        )
      : undefined

  useEffect(() => {
    const id = document.getElementById('sidebar-content')
    if (isOpen) {
      id?.style.setProperty('height', 'calc(100vh - 325px)', '')
    } else {
      id?.style.setProperty('height', 'calc(100vh - 125px)', '')
    }
  }, [isOpen])

  return (
    <>
      {mangoAccount ? (
        <Menu style={{ paddingBottom: '0px', paddingTop: '0px' }}>
          <SubMenu
            // @ts-ignore
            title={
              <div className="py-2">
                <p className="mb-0 whitespace-nowrap text-xs text-th-fgd-3">
                  {t('account-summary')}
                </p>
                <p className="mb-0 font-bold text-th-fgd-1">
                  {abbreviateAddress(mangoAccount.publicKey)}
                </p>
              </div>
            }
            icon={<HealthHeart health={Number(maintHealthRatio)} size={32} />}
            open={isOpen}
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className={`w-full pr-5 ${!collapsed ? 'pl-3 pb-2' : 'py-2'}`}>
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
                  {maintHealthRatio.gt(I80F48_100)
                    ? '>100'
                    : maintHealthRatio.toFixed(2)}
                  %
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
              <div className="pb-2">
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
              <div>
                <p className="mb-0 text-xs leading-4">
                  {marketConfig.name} {t('estimated-liq-price')}
                </p>
                <p className="mb-0 font-bold text-th-fgd-1">
                  {liquidationPrice && liquidationPrice.gt(ZERO_I80F48)
                    ? usdFormatter(liquidationPrice)
                    : 'N/A'}
                </p>
              </div>
            </div>
          </SubMenu>
        </Menu>
      ) : null}
    </>
  )
}

export default AccountOverviewPopover
