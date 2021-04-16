import { useState } from 'react'
import FloatingElement from './FloatingElement'
import OpenOrdersTable from './OpenOrdersTable'
import BalancesTable from './BalancesTable'
import FeeDiscountsTable from './FeeDiscountsTable'
import TradeHistoryTable from './TradeHistoryTable'

const TABS = ['Open Orders', 'Balances', 'Fee Discounts', 'Trade History']

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
          className={`block w-full pl-3 pr-10 py-2 bg-th-bkg-2 border border-th-fgd-4 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md`}
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
          <nav className={`-mb-px flex space-x-8`} aria-label="Tabs">
            {TABS.map((tabName) => (
              <a
                key={tabName}
                onClick={() => handleTabChange(tabName)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-base cursor-pointer transition-all duration-500
                  ${
                    activeTab === tabName
                      ? `border-th-primary text-th-primary`
                      : `border-transparent text-th-fgd-4 hover:text-th-primary`
                  }
                `}
              >
                {tabName}
                {/* TODO: add indicator for number in tab */}
                {/* <!-- Current: "bg-indigo-100 text-indigo-600", Default: "bg-gray-100 text-gray-900" -->
              <span
                className={`bg-gray-100 text-gray-900 hidden ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium md:inline-block`}
              >
                52
              </span> */}
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
    case 'Orders':
      return <OpenOrdersTable />
    case 'Balances':
      return <BalancesTable />
    case 'Fee Discounts':
      return <FeeDiscountsTable />
    case 'Trade History':
      return <TradeHistoryTable />
    default:
      return <OpenOrdersTable />
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
