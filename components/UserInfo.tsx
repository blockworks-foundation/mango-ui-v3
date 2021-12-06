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
import Tabs from './Tabs'
import FeeDiscountsTable from './FeeDiscountsTable'
import useMangoAccount from '../hooks/useMangoAccount'
import { marketConfigSelector } from '../stores/selectors'

const TABS = [
  'Balances',
  'Orders',
  'Positions',
  'Trade History',
  'Fee Discount',
]

const UserInfoTabs = ({ activeTab, setActiveTab }) => {
  const openOrders = useOpenOrders()
  const { openPositions } = usePerpPositions()
  const { mangoAccount } = useMangoAccount()

  const handleTabChange = (tabName) => {
    setActiveTab(tabName)
  }

  return (
    <div className="relative">
      <Tabs
        activeTab={activeTab}
        onChange={handleTabChange}
        showCount={
          openOrders && openPositions
            ? [
                { tabName: 'Orders', count: openOrders.length },
                { tabName: 'Positions', count: openPositions.length },
              ]
            : null
        }
        tabs={TABS}
      />
      {mangoAccount ? (
        <div className="absolute right-0 top-0">
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
      return <BalancesTable />
    case 'Trade History':
      return <TradeHistoryTable numTrades={100} />
    case 'Positions':
      return <PositionsTable />
    case 'Fee Discount':
      return <FeeDiscountsTable />
    default:
      return <BalancesTable />
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
