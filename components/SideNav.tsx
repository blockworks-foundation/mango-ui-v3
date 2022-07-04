import Link from 'next/link'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { DEFAULT_MARKET_KEY, initialMarket } from './SettingsModal'
import { BtcMonoIcon, TradeIcon, TrophyIcon } from './icons'
import {
  CashIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  DotsHorizontalIcon,
  SwitchHorizontalIcon,
  CalculatorIcon,
  LibraryIcon,
  LightBulbIcon,
  UserAddIcon,
  ExternalLinkIcon,
  ChevronDownIcon,
  ReceiptTaxIcon,
} from '@heroicons/react/solid'
import { useRouter } from 'next/router'
import AccountOverviewPopover from './AccountOverviewPopover'
import useMangoAccount from 'hooks/useMangoAccount'
import { useTranslation } from 'next-i18next'
import { Fragment, ReactNode, useEffect, useState } from 'react'
import { Disclosure, Popover, Transition } from '@headlessui/react'
import HealthHeart from './HealthHeart'
import { abbreviateAddress } from 'utils'

const SideNav = ({ collapsed }) => {
  const { t } = useTranslation('common')
  const { mangoAccount } = useMangoAccount()
  const [defaultMarket] = useLocalStorageState(
    DEFAULT_MARKET_KEY,
    initialMarket
  )
  const router = useRouter()
  const { pathname } = router

  return (
    <div
      className={`flex flex-col justify-between transition-all duration-500 ease-in-out ${
        collapsed ? 'w-[64px]' : 'w-[220px]'
      } min-h-screen border-r border-th-bkg-3 bg-th-bkg-1`}
    >
      <div className="mb-4">
        <Link href={defaultMarket.path} shallow={true}>
          <div
            className={`flex h-14 w-full items-center justify-start border-b border-th-bkg-3 px-4`}
          >
            <div className={`flex flex-shrink-0 cursor-pointer items-center`}>
              <img
                className={`h-8 w-auto`}
                src="/assets/icons/logo.svg"
                alt="next"
              />
              <Transition
                appear={true}
                show={!collapsed}
                as={Fragment}
                enter="transition-all ease-in duration-300"
                enterFrom="opacity-50"
                enterTo="opacity-100"
                leave="transition ease-out duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <span className="ml-2 text-lg font-bold text-th-fgd-1">
                  Mango
                </span>
              </Transition>
            </div>
          </div>
        </Link>
        <div className={`flex flex-col items-start space-y-3.5 px-4 pt-4`}>
          <MenuItem
            active={pathname === '/'}
            collapsed={collapsed}
            icon={<TradeIcon className="h-5 w-5" />}
            title={t('trade')}
            pagePath="/"
          />
          <MenuItem
            active={pathname === '/account'}
            collapsed={collapsed}
            icon={<CurrencyDollarIcon className="h-5 w-5" />}
            title={t('account')}
            pagePath="/account"
          />
          <MenuItem
            active={pathname === '/markets'}
            collapsed={collapsed}
            icon={<BtcMonoIcon className="h-4 w-4" />}
            title={t('markets')}
            pagePath="/markets"
          />
          <MenuItem
            active={pathname === '/borrow'}
            collapsed={collapsed}
            icon={<CashIcon className="h-5 w-5" />}
            title={t('borrow')}
            pagePath="/borrow"
          />
          <MenuItem
            active={pathname === '/swap'}
            collapsed={collapsed}
            icon={<SwitchHorizontalIcon className="h-5 w-5" />}
            title={t('swap')}
            pagePath="/swap"
          />
          <MenuItem
            active={pathname === '/stats'}
            collapsed={collapsed}
            icon={<ChartBarIcon className="h-5 w-5" />}
            title={t('stats')}
            pagePath="/stats"
          />
          <MenuItem
            active={pathname === '/leaderboard'}
            collapsed={collapsed}
            icon={<TrophyIcon className="h-[18px] w-[18px]" />}
            title={t('leaderboard')}
            pagePath="/leaderboard"
          />
          <ExpandableMenuItem
            collapsed={collapsed}
            icon={<DotsHorizontalIcon className="h-5 w-5" />}
            title={t('more')}
          >
            <MenuItem
              active={pathname === '/referral'}
              collapsed={false}
              icon={<UserAddIcon className="h-4 w-4" />}
              title={t('referrals')}
              pagePath="/referral"
              hideIconBg
            />
            <MenuItem
              active={pathname === '/risk-calculator'}
              collapsed={false}
              icon={<CalculatorIcon className="h-4 w-4" />}
              title={t('calculator')}
              pagePath="/risk-calculator"
              hideIconBg
            />
            <MenuItem
              active={pathname === '/fees'}
              collapsed={false}
              icon={<ReceiptTaxIcon className="h-4 w-4" />}
              title={t('fees')}
              pagePath="/fees"
              hideIconBg
            />
            <MenuItem
              collapsed={false}
              icon={<LightBulbIcon className="h-4 w-4" />}
              title={t('learn')}
              pagePath="https://docs.mango.markets"
              hideIconBg
              isExternal
            />
            <MenuItem
              collapsed={false}
              icon={<LibraryIcon className="h-4 w-4" />}
              title={t('governance')}
              pagePath="https://dao.mango.markets"
              hideIconBg
              isExternal
            />
          </ExpandableMenuItem>
        </div>
      </div>
      {mangoAccount ? (
        <div className="flex min-h-[64px] w-full items-center border-t border-th-bkg-3 ">
          <ExpandableMenuItem
            collapsed={collapsed}
            icon={<HealthHeart health={50} size={32} />}
            title={
              <div className="py-3 text-left">
                <p className="mb-0 whitespace-nowrap text-xs text-th-fgd-3">
                  {t('account-summary')}
                </p>
                <p className="mb-0 font-bold text-th-fgd-1">
                  {abbreviateAddress(mangoAccount.publicKey)}
                </p>
              </div>
            }
            hideIconBg
            alignBottom
          >
            <AccountOverviewPopover collapsed={collapsed} />
          </ExpandableMenuItem>
        </div>
      ) : null}
    </div>
  )
}

export default SideNav

const MenuItem = ({
  active,
  collapsed,
  icon,
  title,
  pagePath,
  hideIconBg,
  isExternal,
}: {
  active?: boolean
  collapsed: boolean
  icon: ReactNode
  title: string
  pagePath: string
  hideIconBg?: boolean
  isExternal?: boolean
}) => {
  return !isExternal ? (
    <Link href={pagePath} shallow={true}>
      <a
        className={`default-transition flex items-center hover:brightness-[1.1] ${
          active ? 'text-th-primary' : 'text-th-fgd-1'
        }`}
      >
        <div
          className={
            hideIconBg
              ? ''
              : 'flex h-8 w-8 items-center justify-center rounded-full bg-th-bkg-3'
          }
        >
          {icon}
        </div>
        <Transition
          appear={true}
          show={!collapsed}
          as={Fragment}
          enter="transition-all ease-in duration-300"
          enterFrom="opacity-50"
          enterTo="opacity-100"
          leave="transition ease-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <span className="ml-2">{title}</span>
        </Transition>
      </a>
    </Link>
  ) : (
    <a
      href={pagePath}
      className={`default-transition flex items-center justify-between hover:brightness-[1.1] ${
        active ? 'text-th-primary' : 'text-th-fgd-1'
      }`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="flex items-center">
        <div
          className={
            hideIconBg
              ? ''
              : 'flex h-8 w-8 items-center justify-center rounded-full bg-th-bkg-3'
          }
        >
          {icon}
        </div>
        {!collapsed ? <span className="ml-2">{title}</span> : null}
      </div>
      <ExternalLinkIcon className="h-4 w-4" />
    </a>
  )
}

const ExpandableMenuItem = ({
  children,
  collapsed,
  icon,
  title,
  hideIconBg,
  alignBottom,
}: {
  children: ReactNode
  collapsed: boolean
  icon: ReactNode
  title: string | ReactNode
  hideIconBg?: boolean
  alignBottom?: boolean
}) => {
  const [showMenu, setShowMenu] = useState(false)

  const onHoverMenu = (open, action) => {
    if (
      (!open && action === 'onMouseEnter') ||
      (open && action === 'onMouseLeave')
    ) {
      setShowMenu(!showMenu)
    }
  }

  useEffect(() => {
    if (collapsed) {
      setShowMenu(false)
    }
  }, [collapsed])

  return collapsed ? (
    <Popover>
      <div
        onMouseEnter={() => onHoverMenu(showMenu, 'onMouseEnter')}
        onMouseLeave={() => onHoverMenu(showMenu, 'onMouseLeave')}
        className="relative z-30"
      >
        <Popover.Button className="hover:text-th-primary">
          <div
            className={` ${
              hideIconBg
                ? ''
                : 'flex h-8 w-8 items-center justify-center rounded-full bg-th-bkg-3'
            } ${
              alignBottom
                ? 'default-transition flex h-16 w-16 items-center justify-center hover:bg-th-bkg-2'
                : ''
            }`}
          >
            {icon}
          </div>
        </Popover.Button>
        <Transition
          appear={true}
          show={showMenu}
          as={Fragment}
          enter="transition-all ease-in duration-300"
          enterFrom="opacity-0 transform scale-90"
          enterTo="opacity-100 transform scale-100"
          leave="transition ease-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Popover.Panel
            className={`absolute  w-56 space-y-2 rounded-md bg-th-bkg-2 p-4 ${
              alignBottom
                ? 'bottom-0 left-14'
                : 'left-10 top-1/2 -translate-y-1/2 transform'
            }`}
          >
            {children}
          </Popover.Panel>
        </Transition>
      </div>
    </Popover>
  ) : (
    <Disclosure>
      <div
        onClick={() => setShowMenu(!showMenu)}
        role="button"
        className={`w-full `}
      >
        <Disclosure.Button
          className={`flex w-full items-center justify-between rounded-none hover:text-th-primary ${
            alignBottom ? 'h-[64px] px-4 hover:bg-th-bkg-2' : ''
          }`}
        >
          <div className="flex items-center">
            <div
              className={
                hideIconBg
                  ? ''
                  : 'flex h-8 w-8 items-center justify-center rounded-full bg-th-bkg-3'
              }
            >
              {icon}
            </div>
            <Transition
              appear={true}
              show={!collapsed}
              as={Fragment}
              enter="transition-all ease-in duration-300"
              enterFrom="opacity-50"
              enterTo="opacity-100"
              leave="transition ease-out duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <span className="ml-2">{title}</span>
            </Transition>
          </div>
          <ChevronDownIcon
            className={`${
              showMenu ? 'rotate-180 transform' : 'rotate-360 transform'
            } default-transition h-5 w-5 flex-shrink-0`}
          />
        </Disclosure.Button>
        <Transition
          appear={true}
          show={showMenu}
          as={Fragment}
          enter="transition-all ease-in duration-500"
          enterFrom="opacity-100 max-h-0"
          enterTo="opacity-100 max-h-64"
          leave="transition-all ease-out duration-500"
          leaveFrom="opacity-100 max-h-64"
          leaveTo="opacity-0 max-h-0"
        >
          <Disclosure.Panel className="overflow-hidden">
            <div className="space-y-2 p-2">{children}</div>
          </Disclosure.Panel>
        </Transition>
      </div>
    </Disclosure>
  )
}
