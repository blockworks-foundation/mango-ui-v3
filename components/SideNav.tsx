import {
  ProSidebar,
  Menu,
  MenuItem,
  SubMenu,
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
} from 'react-pro-sidebar'
import Link from 'next/link'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { DEFAULT_MARKET_KEY, initialMarket } from './SettingsModal'
import { BtcMonoIcon, TradeIcon, TrophyIcon } from './icons'
import {
  CashIcon,
  ChartBarIcon,
  ChevronRightIcon,
  CurrencyDollarIcon,
  DotsHorizontalIcon,
  SwitchHorizontalIcon,
  CalculatorIcon,
  LibraryIcon,
  LightBulbIcon,
  UserAddIcon,
  ExternalLinkIcon,
} from '@heroicons/react/solid'
import { useState } from 'react'
import { useRouter } from 'next/router'
import AccountOverviewPopover from './AccountOverviewPopover'
import { IconButton } from './Button'
import useMangoAccount from 'hooks/useMangoAccount'
import { useTranslation } from 'next-i18next'

const SideNav = ({ collapsed, setCollapsed }) => {
  const { t } = useTranslation('common')
  const { mangoAccount } = useMangoAccount()
  const [accountPopoverOpen, setAccountPopoverOpen] = useState(false)
  const [defaultMarket] = useLocalStorageState(
    DEFAULT_MARKET_KEY,
    initialMarket
  )
  const router = useRouter()
  const { pathname } = router

  const handleToggleSidebar = () => {
    setCollapsed(!collapsed)
    setAccountPopoverOpen(false)
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'))
    }, 100)
  }

  return (
    <>
      <IconButton
        className="absolute -right-4 top-1/2 z-50 h-10 w-4 -translate-y-1/2 transform rounded-none rounded-r"
        onClick={handleToggleSidebar}
      >
        <ChevronRightIcon
          className={`default-transition h-5 w-5 ${
            !collapsed ? 'rotate-180' : 'rotate-360'
          }`}
        />
      </IconButton>
      <ProSidebar collapsed={collapsed} width="220px" collapsedWidth="64px">
        <SidebarHeader>
          <Link href={defaultMarket.path} shallow={true}>
            <div
              className={`flex w-full items-center ${
                collapsed ? 'justify-center' : 'justify-start'
              } h-14 border-b border-th-bkg-3 px-4`}
            >
              <div className={`flex flex-shrink-0 cursor-pointer items-center`}>
                <img
                  className={`h-8 w-auto`}
                  src="/assets/icons/logo.svg"
                  alt="next"
                />
                {!collapsed ? (
                  <span className="ml-2 text-lg font-bold text-th-fgd-1">
                    Mango
                  </span>
                ) : null}
              </div>
            </div>
          </Link>
        </SidebarHeader>
        <SidebarContent className="relative">
          <Menu iconShape="circle">
            <MenuItem
              active={pathname === '/'}
              icon={<TradeIcon className="h-5 w-5" />}
            >
              <Link href={defaultMarket.path} shallow={true}>
                {t('trade')}
              </Link>
            </MenuItem>
            <MenuItem
              active={pathname === '/account'}
              icon={<CurrencyDollarIcon className="h-5 w-5" />}
            >
              <Link href={'/account'} shallow={true}>
                {t('account')}
              </Link>
            </MenuItem>
            <MenuItem
              active={pathname === '/markets'}
              icon={<BtcMonoIcon className="h-4 w-4" />}
            >
              <Link href={'/markets'} shallow={true}>
                {t('markets')}
              </Link>
            </MenuItem>
            <MenuItem
              active={pathname === '/borrow'}
              icon={<CashIcon className="h-5 w-5" />}
            >
              <Link href={'/borrow'} shallow={true}>
                {t('borrow')}
              </Link>
            </MenuItem>
            <MenuItem
              active={pathname === '/swap'}
              icon={<SwitchHorizontalIcon className="h-5 w-5" />}
            >
              <Link href={'/swap'} shallow={true}>
                {t('swap')}
              </Link>
            </MenuItem>
            <MenuItem
              active={pathname === '/stats'}
              icon={<ChartBarIcon className="h-5 w-5" />}
            >
              <Link href={'/stats'} shallow={true}>
                {t('stats')}
              </Link>
            </MenuItem>
            <MenuItem
              active={pathname === '/leaderboard'}
              icon={<TrophyIcon className="h-5 w-5" />}
            >
              <Link href={'/leaderboard'} shallow={true}>
                {t('leaderboard')}
              </Link>
            </MenuItem>
            <SubMenu
              title={t('more')}
              icon={<DotsHorizontalIcon className="h-5 w-5" />}
            >
              <MenuItem
                active={pathname === '/referral'}
                icon={<UserAddIcon className="h-4 w-4" />}
              >
                <Link href={'/referral'} shallow={true}>
                  {t('referrals')}
                </Link>
              </MenuItem>
              <MenuItem
                active={pathname === '/risk-calculator'}
                icon={<CalculatorIcon className="h-4 w-4" />}
              >
                <Link href={'/risk-calculator'} shallow={true}>
                  {t('calculator')}
                </Link>
              </MenuItem>
              <MenuItem
                active={pathname === '/fees'}
                icon={<CurrencyDollarIcon className="h-4 w-4" />}
              >
                <Link href={'/fees'} shallow={true}>
                  {t('fees')}
                </Link>
              </MenuItem>
              <MenuItem
                icon={<LightBulbIcon className="h-4 w-4" />}
                suffix={<ExternalLinkIcon className="h-4 w-4" />}
              >
                <a
                  href={'https://docs.mango.markets'}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('learn')}
                </a>
              </MenuItem>
              <MenuItem
                icon={<LibraryIcon className="h-4 w-4" />}
                suffix={<ExternalLinkIcon className="h-4 w-4" />}
              >
                <a
                  href={'https://dao.mango.markets'}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('governance')}
                </a>
              </MenuItem>
            </SubMenu>
          </Menu>
          {accountPopoverOpen ? (
            <div className="absolute top-0 left-0 h-full w-full bg-th-bkg-1 opacity-80" />
          ) : null}
        </SidebarContent>

        {mangoAccount ? (
          <SidebarFooter>
            <AccountOverviewPopover
              collapsed={collapsed}
              open={accountPopoverOpen}
              setOpen={setAccountPopoverOpen}
            />
          </SidebarFooter>
        ) : null}
      </ProSidebar>
    </>
  )
}

export default SideNav
