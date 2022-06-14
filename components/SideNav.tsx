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
import SettingsModal, {
  DEFAULT_MARKET_KEY,
  initialMarket,
} from './SettingsModal'
import { BtcMonoIcon, TradeIcon, TrophyIcon } from './icons'
import {
  CashIcon,
  ChartBarIcon,
  CogIcon,
  CurrencyDollarIcon,
  DotsHorizontalIcon,
  SwitchHorizontalIcon,
} from '@heroicons/react/solid'
import { useState } from 'react'
// import useMangoStore from 'stores/useMangoStore'
// import MarketNavItem from './MarketNavItem'
import { useRouter } from 'next/router'

const SideNav = ({ collapsed, toggled, handleToggleSidebar }) => {
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [defaultMarket] = useLocalStorageState(
    DEFAULT_MARKET_KEY,
    initialMarket
  )
  //   const marketsInfo = useMangoStore((s) => s.marketsInfo)
  const router = useRouter()
  const { pathname } = router

  //   const perpMarketsInfo = useMemo(
  //     () =>
  //       marketsInfo
  //         .filter((mkt) => mkt?.name.includes('PERP'))
  //         .sort((a, b) => b.volumeUsd24h - a.volumeUsd24h),
  //     [marketsInfo]
  //   )

  //   const spotMarketsInfo = useMemo(
  //     () =>
  //       marketsInfo
  //         .filter((mkt) => mkt?.name.includes('USDC'))
  //         .sort((a, b) => b.volumeUsd24h - a.volumeUsd24h),
  //     [marketsInfo]
  //   )

  return (
    <ProSidebar
      collapsed={collapsed}
      toggled={toggled}
      onToggle={handleToggleSidebar}
      width="220px"
      collapsedWidth="64px"
    >
      <SidebarHeader>
        <Link href={defaultMarket.path} shallow={true}>
          <div
            className={`flex w-full items-center ${
              collapsed ? 'justify-center' : 'justify-start'
            } h-14 border-b border-[rgba(255,255,255,0.08)] px-4`}
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
      <SidebarContent>
        <Menu iconShape="circle">
          <MenuItem
            active={pathname === '/'}
            icon={<TradeIcon className="h-5 w-5" />}
          >
            Trade
          </MenuItem>
          {/* <SubMenu title="Trade" icon={<TradeIcon className="h-5 w-5" />}>
            <SubMenu title="Futures">
              {perpMarketsInfo.map((mkt) => (
                <MarketNavItem
                  //   buttonRef={buttonRef}
                  market={mkt}
                  key={mkt.name}
                />
              ))}
            </SubMenu>
            <SubMenu title="Spot">
              {spotMarketsInfo.map((mkt) => (
                <MarketNavItem
                  //   buttonRef={buttonRef}
                  market={mkt}
                  key={mkt.name}
                />
              ))}
            </SubMenu>
          </SubMenu> */}
          <SubMenu
            title="Account"
            icon={<CurrencyDollarIcon className="h-5 w-5" />}
          >
            <MenuItem>Overview</MenuItem>
            <MenuItem>Performance</MenuItem>
            <MenuItem>Orders</MenuItem>
            <MenuItem>History</MenuItem>
          </SubMenu>
          <MenuItem icon={<BtcMonoIcon className="h-4 w-4" />}>
            Markets
          </MenuItem>
          <MenuItem icon={<CashIcon className="h-5 w-5" />}>Borrow</MenuItem>
          <MenuItem icon={<SwitchHorizontalIcon className="h-5 w-5" />}>
            Swap
          </MenuItem>
          <MenuItem icon={<ChartBarIcon className="h-5 w-5" />}>Stats</MenuItem>
          <MenuItem icon={<TrophyIcon className="h-5 w-5" />}>
            Leaderboard
          </MenuItem>
          <MenuItem
            onClick={() => setShowSettingsModal(true)}
            icon={<CogIcon className="h-5 w-5" />}
          >
            Settings
          </MenuItem>
          <SubMenu
            title="More"
            icon={<DotsHorizontalIcon className="h-5 w-5" />}
          >
            <MenuItem>Overview</MenuItem>
            <MenuItem>Orders</MenuItem>
            <MenuItem>History</MenuItem>
          </SubMenu>
        </Menu>
      </SidebarContent>

      <SidebarFooter>
        <div
          className={`flex w-full items-center ${
            collapsed ? 'justify-center' : 'justify-start'
          } py-4 pl-5 pr-4`}
        >
          <span className="relative mr-2.5 flex h-1.5 w-1.5">
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full bg-th-green opacity-75`}
            ></span>
            <span
              className={`relative inline-flex h-1.5 w-1.5 rounded-full bg-th-green`}
            ></span>
          </span>
          <span className="truncate text-xs text-th-fgd-4">Operational</span>
        </div>
      </SidebarFooter>
      {showSettingsModal ? (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
          isOpen={showSettingsModal}
        />
      ) : null}
    </ProSidebar>
  )
}

export default SideNav
