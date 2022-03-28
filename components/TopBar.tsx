import { useCallback, useState } from 'react'
import Link from 'next/link'
import { abbreviateAddress } from '../utils/index'
import useLocalStorageState from '../hooks/useLocalStorageState'
import MenuItem from './MenuItem'
import useMangoStore from '../stores/useMangoStore'
import { ConnectWalletButton } from 'components'
import NavDropMenu from './NavDropMenu'
import AccountsModal from './AccountsModal'
import { DEFAULT_MARKET_KEY, initialMarket } from './SettingsModal'
import { useTranslation } from 'next-i18next'
import Settings from './Settings'
import TradeNavMenu from './TradeNavMenu'
import {
  CalculatorIcon,
  CurrencyDollarIcon,
  LightBulbIcon,
  UserAddIcon,
} from '@heroicons/react/outline'
import { MangoIcon } from './icons'
import { useWallet } from '@solana/wallet-adapter-react'

const StyledNewLabel = ({ children, ...props }) => (
  <div style={{ fontSize: '0.5rem', marginLeft: '1px' }} {...props}>
    {children}
  </div>
)

const TopBar = () => {
  const { t } = useTranslation('common')
  const { publicKey } = useWallet()
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const [showAccountsModal, setShowAccountsModal] = useState(false)
  const [defaultMarket] = useLocalStorageState(
    DEFAULT_MARKET_KEY,
    initialMarket
  )

  const handleCloseAccounts = useCallback(() => {
    setShowAccountsModal(false)
  }, [])

  return (
    <>
      <nav className={`bg-th-bkg-2`}>
        <div className={`px-4 xl:px-6`}>
          <div className={`flex h-14 justify-between`}>
            <div className={`flex`}>
              <Link href={defaultMarket.path} shallow={true}>
                <div
                  className={`flex flex-shrink-0 cursor-pointer items-center`}
                >
                  <img
                    className={`h-8 w-auto`}
                    src="/assets/icons/logo.svg"
                    alt="next"
                  />
                </div>
              </Link>
              <div
                className={`hidden md:ml-4 md:flex md:items-center md:space-x-2 lg:space-x-3`}
              >
                <TradeNavMenu />
                <MenuItem href="/account">{t('account')}</MenuItem>
                <div className="relative">
                  <MenuItem href="/markets">
                    {t('markets')}
                    <div className="absolute -right-3 -top-3 flex h-4 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-yellow-500 px-1.5">
                      <StyledNewLabel className="uppercase text-white">
                        new
                      </StyledNewLabel>
                    </div>
                  </MenuItem>
                </div>
                <MenuItem href="/borrow">{t('borrow')}</MenuItem>
                <MenuItem href="/swap">{t('swap')}</MenuItem>
                <MenuItem href="/stats">{t('stats')}</MenuItem>
                <NavDropMenu
                  menuTitle={t('more')}
                  // linksArray: [name: string, href: string, isExternal: boolean]
                  linksArray={[
                    [
                      t('referrals'),
                      '/referral',
                      false,
                      <UserAddIcon className="h-4 w-4" key="referrals" />,
                    ],
                    [
                      t('calculator'),
                      '/risk-calculator',
                      false,
                      <CalculatorIcon className="h-4 w-4" key="calculator" />,
                    ],
                    [
                      t('fees'),
                      '/fees',
                      false,
                      <CurrencyDollarIcon className="h-4 w-4" key="fees" />,
                    ],
                    [
                      t('learn'),
                      'https://docs.mango.markets/',
                      true,
                      <LightBulbIcon className="h-4 w-4" key="learn" />,
                    ],
                    [
                      'Mango v2',
                      'https://v2.mango.markets',
                      true,
                      <MangoIcon
                        className="h-4 w-4 stroke-current"
                        key="mango-v2"
                      />,
                    ],
                    [
                      'Mango v1',
                      'https://v1.mango.markets',
                      true,
                      <MangoIcon
                        className="h-4 w-4 stroke-current"
                        key="mango-v1"
                      />,
                    ],
                  ]}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2.5">
              <div className="pl-2">
                <Settings />
              </div>
              {mangoAccount &&
                mangoAccount.owner.toBase58() === publicKey?.toBase58() ? (
                  <button
                    className="rounded border border-th-bkg-4 py-1 px-2 text-xs hover:border-th-fgd-4 focus:outline-none"
                    onClick={() => setShowAccountsModal(true)}
                  >
                    <div className="text-xs font-normal text-th-primary">
                      {t('account')}
                    </div>
                    {mangoAccount.name
                      ? mangoAccount.name
                      : abbreviateAddress(mangoAccount.publicKey)}
                  </button>
              ) : null}
              <ConnectWalletButton />
            </div>
          </div>
        </div>
      </nav>
      {showAccountsModal && (
        <AccountsModal
          onClose={handleCloseAccounts}
          isOpen={showAccountsModal}
        />
      )}
    </>
  )
}

export default TopBar
