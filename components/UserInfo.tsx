import { useEffect, useState } from 'react'
import useMangoStore from '../stores/useMangoStore'
import { useOpenOrders } from '../hooks/useOpenOrders'
import usePerpPositions from '../hooks/usePerpPositions'
import OpenOrdersTable from './OpenOrdersTable'
import BalancesTable from './BalancesTable'
import PositionsTable from './PerpPositionsTable'
import TradeHistoryTable from './TradeHistoryTable'
// import FeeDiscountsTable from './FeeDiscountsTable'
import ManualRefresh from './ManualRefresh'

const TABS = [
  'Balances',
  'Orders',
  'Positions',
  // 'Fees',
  'History',
]

const UserInfoTabs = ({ activeTab, setActiveTab }) => {
  const openOrders = useOpenOrders()
  const perpPositions = usePerpPositions()
  const connected = useMangoStore((s) => s.connection.current)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const handleTabChange = (tabName) => {
    setActiveTab(tabName)
  }

  return (
    <div>
      <div className={`border-b border-th-fgd-4 mb-3 flex justify-between`}>
        <nav className={`-mb-px flex space-x-3 sm:space-x-6`} aria-label="Tabs">
          {TABS.map((tabName) => (
            <a
              key={tabName}
              onClick={() => handleTabChange(tabName)}
              className={`whitespace-nowrap pt-2 pb-4 px-1 border-b-2 font-semibold cursor-pointer default-transition relative text-xs sm:text-sm hover:opacity-100
                  ${
                    activeTab === tabName
                      ? `border-th-primary text-th-primary`
                      : `border-transparent text-th-fgd-4 hover:text-th-primary`
                  }
                `}
            >
              {tabName}{' '}
              {tabName === 'Orders' && openOrders?.length > 0 ? (
                <Count count={openOrders?.length} />
              ) : null}
              {tabName === 'Positions' && perpPositions?.length > 0 ? (
                <Count count={perpPositions?.length} />
              ) : null}
            </a>
          ))}
        </nav>
        <div>
          {connected && mangoAccount ? (
            <ManualRefresh className="pl-2" />
          ) : null}
        </div>
      </div>
    </div>
  )
}

const Count = ({ count }) => (
  <div className="absolute -top-2 -right-2 z-10">
    <span className="h-4 p-1 bg-th-bkg-4 inline-flex rounded-lg items-center justify-center text-th-fgd-2 text-xxs">
      {count}
    </span>
  </div>
)

const TabContent = ({ activeTab }) => {
  switch (activeTab) {
    case 'Orders':
      return <OpenOrdersTable />
    case 'Balances':
      return <BalancesTable />
    case 'History':
      return <TradeHistoryTable numTrades={100} />
    case 'Positions':
      return <PositionsTable />
    // case 'Fees':
    //   return <FeeDiscountsTable /> // now displayed in trade form. may add back when MRSRM deposits are supported
    default:
      return <BalancesTable />
  }
}

const UserInfo = () => {
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const isPerpMarket = marketConfig.kind === 'perp'
  const connected = useMangoStore((s) => s.wallet.connected)
  const [activeTab, setActiveTab] = useState('')

  useEffect(() => {
    isPerpMarket ? setActiveTab(TABS[2]) : setActiveTab(TABS[0])
  }, [isPerpMarket])

  return (
    <div className={!connected ? 'filter blur-sm' : null}>
      <UserInfoTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      <TabContent activeTab={activeTab} />
    </div>
  )
}

export default UserInfo
