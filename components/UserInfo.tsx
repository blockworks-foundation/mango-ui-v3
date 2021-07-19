import { useState } from 'react'
import FloatingElement from './FloatingElement'
import OpenOrdersTable from './OpenOrdersTable'
import BalancesTable from './BalancesTable'
import PositionsTable from './PositionsTable'
import TradeHistoryTable from './TradeHistoryTable'
// import { Position } from '../public/charting_library/charting_library'
// import FeeDiscountsTable from './FeeDiscountsTable'

const TABS = [
  'Balances',
  'Open Orders',
  'Positions',
  /*'Fee Discounts'*/
  'Trade History',
]

const UserInfoTabs = ({ activeTab, setActiveTab }) => {
  const handleTabChange = (tabName) => {
    setActiveTab(tabName)
  }

  return (
    <div>
      <div className={`sm:hidden`}>
        <label htmlFor="tabs" className={`sr-only`}>
          Select a tab
        </label>
        <select
          id="tabs"
          name="tabs"
          className={`block w-full pl-3 pr-10 py-2 bg-th-bkg-2 border border-th-fgd-4 focus:outline-none sm:text-sm rounded-md`}
          onChange={(e) => handleTabChange(e.target.value)}
        >
          {TABS.map((tabName) => (
            <option key={tabName} value={tabName}>
              {tabName}
            </option>
          ))}
        </select>
      </div>
      <div className={`hidden sm:block`}>
        <div className={`border-b border-th-fgd-4`}>
          <nav className={`-mb-px flex space-x-6`} aria-label="Tabs">
            {TABS.map((tabName) => (
              <a
                key={tabName}
                onClick={() => handleTabChange(tabName)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-semibold cursor-pointer default-transition hover:opacity-100
                  ${
                    activeTab === tabName
                      ? `border-th-primary text-th-primary`
                      : `border-transparent text-th-fgd-4 hover:text-th-primary`
                  }
                `}
              >
                {tabName}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </div>
  )
}

const TabContent = ({ activeTab }) => {
  switch (activeTab) {
    case 'Open Orders':
      return <OpenOrdersTable />
    case 'Balances':
      return <BalancesTable />
    case 'Trade History':
      return <TradeHistoryTable />
    case 'Positions':
      return <PositionsTable />
    // case 'Fee Discounts':
    //   return <FeeDiscountsTable />
    default:
      return <BalancesTable />
  }
}

const UserInfo = () => {
  const [activeTab, setActiveTab] = useState(TABS[0])

  return (
    <FloatingElement>
      <UserInfoTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      <TabContent activeTab={activeTab} />
    </FloatingElement>
  )
}

export default UserInfo
