import { useEffect, useState } from 'react'
import useMangoStore from '../stores/useMangoStore'
import OpenOrdersTable from './OpenOrdersTable'
import BalancesTable from './BalancesTable'
import PositionsTable from './PerpPositionsTable'
import TradeHistoryTable from './TradeHistoryTable'
import ManualRefresh from './ManualRefresh'
import Tabs from './Tabs'
import FeeDiscountsTable from './FeeDiscountsTable'
import { marketConfigSelector } from '../stores/selectors'

const TABS = [
  'Balances',
  'Orders',
  'Positions',
  'Trade History',
  'Fee Discount',
]

const UserInfoTabs = ({ activeTab, setActiveTab }) => {
  const totalOpenOrders = useMangoStore(
    (s) => s.selectedMangoAccount.totalOpenOrders
  )
  const totalOpenPerpPositions = useMangoStore(
    (s) => s.selectedMangoAccount.totalOpenPerpPositions
  )
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)

  const handleTabChange = (tabName) => {
    setActiveTab(tabName)
  }

  return (
    <div className="pb-1 relative">
      <Tabs
        activeTab={activeTab}
        onChange={handleTabChange}
        showCount={[
          { tabName: 'Orders', count: totalOpenOrders },
          { tabName: 'Positions', count: totalOpenPerpPositions },
        ]}
        tabs={TABS}
      />
      {mangoAccount ? (
        <div className="absolute right-0 top-0 -mt-1">
          <ManualRefresh />
        </div>
      ) : null}
    </div>
  )
}

const TabContent = ({ activeTab }) => {
  switch (activeTab) {
    case 'Orders':
      return <OpenOrdersTable />
    case 'Balances':
      return <BalancesTable clickToPopulateTradeForm />
    case 'Trade History':
      return <TradeHistoryTable numTrades={100} />
    case 'Positions':
      return <PositionsTable />
    case 'Fee Discount':
      return <FeeDiscountsTable />
    default:
      return <BalancesTable clickToPopulateTradeForm />
  }
}

const UserInfo = () => {
  const marketConfig = useMangoStore(marketConfigSelector)
  const isPerpMarket = marketConfig.kind === 'perp'
  const [activeTab, setActiveTab] = useState('')

  useEffect(() => {
    isPerpMarket ? setActiveTab(TABS[2]) : setActiveTab(TABS[0])
  }, [isPerpMarket])

  return (
    <div>
      <UserInfoTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      <TabContent activeTab={activeTab} />
    </div>
  )
}

export default UserInfo
