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
  ChatIcon,
} from '@heroicons/react/solid'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { Fragment, ReactNode, useEffect, useState } from 'react'
import { Disclosure, Popover, Transition } from '@headlessui/react'
import Chat from './chat/Chat'

const SideNav = ({ collapsed }) => {
  const { t } = useTranslation('common')
  const [defaultMarket] = useLocalStorageState(
    DEFAULT_MARKET_KEY,
    initialMarket
  )
  const router = useRouter()
  const { pathname } = router

  return (
    <div
      className={`flex flex-col justify-between transition-all duration-500 ease-in-out ${
        collapsed ? 'w-14' : 'w-[220px] lg:w-[250px] xl:w-[280px]'
      } min-h-screen border-r border-th-bkg-3 bg-th-bkg-1`}
    >
      <div className="mb-4">
        <Link href={defaultMarket.path} shallow={true}>
          <div
            className={`flex h-14 w-full items-center justify-start border-b border-th-bkg-3 px-3`}
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
        <div className={`flex flex-col items-start space-y-3.5 px-3 pt-4`}>
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
          <ExpandableMenuItem
            collapsed={collapsed}
            icon={<DotsHorizontalIcon className="h-5 w-5" />}
            title={t('more')}
          >
            <MenuItem
              active={pathname === '/leaderboard'}
              collapsed={false}
              icon={<TrophyIcon className="h-[14px] w-[14px]" />}
              title={t('leaderboard')}
              pagePath="/leaderboard"
              hideIconBg
            />
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
      <div className="border-t border-th-bkg-3">
        <ExpandableMenuItem
          collapsed={collapsed}
          icon={<ChatIcon className="h-6 w-6" />}
          title="Trollbox"
          alignBottom
          hideIconBg
        >
          <Chat />
        </ExpandableMenuItem>
      </div>
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
        className={`default-transition flex w-full items-center hover:brightness-[1.1] ${
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

  const toggleMenu = () => {
    setShowMenu(!showMenu)
  }

  return collapsed ? (
    <Popover>
      <div
        onMouseEnter={
          !alignBottom ? () => onHoverMenu(showMenu, 'onMouseEnter') : undefined
        }
        onMouseLeave={
          !alignBottom ? () => onHoverMenu(showMenu, 'onMouseLeave') : undefined
        }
        className="relative z-30"
        onClick={() => toggleMenu()}
      >
        <Popover.Button className="hover:text-th-primary">
          <div
            className={` ${
              hideIconBg
                ? ''
                : 'flex h-8 w-8 items-center justify-center rounded-full bg-th-bkg-3'
            } ${
              alignBottom
                ? 'default-transition flex h-14 w-14 items-center justify-center hover:bg-th-bkg-2'
                : ''
            }`}
          >
            {icon}
          </div>
        </Popover.Button>
      </div>
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
          className={`absolute space-y-2 rounded-md rounded-l-none border border-th-bkg-3 bg-th-bkg-1 p-4 ${
            alignBottom
              ? 'bottom-0 left-[55px] w-72 rounded-b-none p-0'
              : 'left-[43px] top-1/2 w-56 -translate-y-1/2 transform'
          }`}
        >
          {children}
        </Popover.Panel>
      </Transition>
    </Popover>
  ) : (
    <Disclosure>
      <div
        onClick={() => setShowMenu(!showMenu)}
        role="button"
        className={`default-transition w-full ${
          alignBottom ? 'h-14 px-3 hover:bg-th-bkg-2' : ''
        }`}
      >
        <Disclosure.Button
          className={`flex h-full w-full items-center justify-between rounded-none hover:text-th-primary`}
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
      </div>
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
        <Disclosure.Panel className="w-full overflow-hidden">
          <div className={`space-y-2 ${!alignBottom ? 'p-2' : ''}`}>
            {children}
          </div>
        </Disclosure.Panel>
      </Transition>
    </Disclosure>
  )
}
