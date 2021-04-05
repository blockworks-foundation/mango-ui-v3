import { useEffect, useState } from 'react'
import xw from 'xwind'
import FloatingElement from './FloatingElement'
import OpenOrdersTable from './OpenOrdersTable'

const TABS = ['Open Orders', 'Balances', 'Fee Discounts', 'Trade History']

const UserInfoTabs = ({ activeTab, setActiveTab }) => {
  const handleTabChange = (tabName) => {
    console.log('handle tab change', tabName)
    setActiveTab(tabName)
  }

  return (
    <div>
      <div css={xw`sm:hidden`}>
        <label htmlFor="tabs" css={xw`sr-only`}>
          Select a tab
        </label>
        <select
          id="tabs"
          name="tabs"
          css={xw`block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md`}
          onChange={(e) => handleTabChange(e.target.value)}
        >
          {TABS.map((tabName) => (
            <option key={tabName} value={tabName}>
              {tabName}
            </option>
          ))}
        </select>
      </div>
      <div css={xw`hidden sm:block`}>
        <div css={xw`border-b border-gray-700`}>
          <nav css={xw`-mb-px flex space-x-8`} aria-label="Tabs">
            {TABS.map((tabName) => (
              <a
                key={tabName}
                onClick={() => handleTabChange(tabName)}
                css={[
                  activeTab === tabName
                    ? xw`border-mango-yellow text-mango-yellow`
                    : xw`border-transparent text-gray-300 hover:text-mango-yellow`,
                  xw`whitespace-nowrap py-4 px-1 border-b-2 font-normal text-base tracking-tight`,
                ]}
              >
                {tabName}
                {/* TODO: add indicator for number in tab */}
                {/* <!-- Current: "bg-indigo-100 text-indigo-600", Default: "bg-gray-100 text-gray-900" -->
              <span
                css={xw`bg-gray-100 text-gray-900 hidden ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium md:inline-block`}
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

const UserInfo = () => {
  const [activeTab, setActiveTab] = useState(TABS[0])
  useEffect(() => {
    console.log('user info')
  })

  return (
    <FloatingElement>
      <UserInfoTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      <OpenOrdersTable />
    </FloatingElement>
  )
}

export default UserInfo
