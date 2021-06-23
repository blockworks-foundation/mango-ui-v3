import { useEffect, useState } from 'react'
import useMangoStore from '../stores/useMangoStore'
import dayjs from 'dayjs'
import {
  BadgeCheckIcon,
  BellIcon,
  InformationCircleIcon,
  LinkIcon,
  PlusCircleIcon,
  TrashIcon,
} from '@heroicons/react/outline'
import { RadioGroup } from '@headlessui/react'
import useAlertsStore from '../stores/useAlertsStore'
import useLocalStorageState from '../hooks/useLocalStorageState'
import TopBar from '../components/TopBar'
import Button, { LinkButton } from '../components/Button'
import AlertsModal from '../components/AlertsModal'
import AlertItem from '../components/AlertItem'
import PageBodyContainer from '../components/PageBodyContainer'
import EmptyState from '../components/EmptyState'
import Select from '../components/Select'
import { abbreviateAddress } from '../utils'

const relativeTime = require('dayjs/plugin/relativeTime')
dayjs.extend(relativeTime)

const TABS = ['Active', 'Triggered']

export default function Alerts() {
  const connected = useMangoStore((s) => s.wallet.connected)
  const mangoAccounts = useMangoStore((s) => s.mangoAccounts)
  const [activeTab, setActiveTab] = useState(TABS[0])
  const [openAlertModal, setOpenAlertModal] = useState(false)
  const [reactivateAlertData, setReactivateAlertData] = useState(null)
  const [acc, setAcc] = useState('All')
  const [filteredActiveAlerts, setFilteredActiveAlerts] = useState([])
  const [filteredTriggeredAlerts, setFilteredTriggeredAlerts] = useState([])
  const activeAlerts = useAlertsStore((s) => s.activeAlerts)
  const triggeredAlerts = useAlertsStore((s) => s.triggeredAlerts)
  const loading = useAlertsStore((s) => s.loading)
  const [clearedAlerts, setClearedAlerts] = useState([])
  const [clearAlertsTimestamp, setClearAlertsTimestamp] = useLocalStorageState(
    'clearAlertsTimestamp'
  )

  useEffect(() => {
    if (!connected || loading) {
      setAcc('All')
    }
  }, [connected, loading])

  useEffect(() => {
    if (clearAlertsTimestamp && !loading) {
      const filterByTimestamp = triggeredAlerts.filter(
        (alert) =>
          alert.triggeredTimestamp > clearAlertsTimestamp &&
          Object.keys(alert).includes('triggeredTimestamp')
      )
      setClearedAlerts(filterByTimestamp)
    }
  }, [clearAlertsTimestamp, loading])

  const handleTabChange = (tabName) => {
    setActiveTab(tabName)
  }

  const handleAccountChange = (val) => {
    if (val !== 'All') {
      setAcc(val)
      const showActive = activeAlerts.filter(
        (alert) => alert.acc.toString() === val
      )
      const showTriggered = clearAlertsTimestamp
        ? clearedAlerts.filter((alert) => alert.acc.toString() === val)
        : triggeredAlerts.filter((alert) => alert.acc.toString() === val)
      setFilteredActiveAlerts(showActive)
      setFilteredTriggeredAlerts(showTriggered)
    } else {
      setAcc(val)
    }
  }

  return (
    <div className={`bg-th-bkg-1 text-th-fgd-1 transition-all`}>
      <TopBar />
      <PageBodyContainer>
        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 pb-3 sm:pb-6 md:pt-10">
          <h1 className={`text-th-fgd-1 text-2xl font-semibold`}>Alerts</h1>
          <div className="flex flex-col-reverse justify-between w-full pt-4 sm:pt-0 sm:justify-end sm:flex-row">
            {mangoAccounts.length === 2 ? (
              <RadioGroup
                value={acc.toString()}
                onChange={(val) => handleAccountChange(val)}
                className="flex border border-th-fgd-4 rounded-md w-full mt-3 sm:mt-0 sm:w-80 h-full text-xs h-8"
              >
                <RadioGroup.Option
                  value="All"
                  className="flex-1 focus:outline-none"
                >
                  {({ checked }) => (
                    <button
                      className={`${
                        checked ? 'bg-th-bkg-3 rounded-l-md' : ''
                      } font-normal text-th-fgd-1 text-center py-1.5 px-2.5 h-full w-full rounded-none hover:bg-th-bkg-3 focus:outline-none`}
                    >
                      All
                    </button>
                  )}
                </RadioGroup.Option>
                {mangoAccounts.map((acc, i) => (
                  <RadioGroup.Option
                    value={acc.publicKey.toString()}
                    className="focus:outline-none flex-auto"
                    key={i}
                  >
                    {({ checked }) => (
                      <button
                        className={`${
                          checked ? 'bg-th-bkg-3' : ''
                        } font-normal text-th-fgd-1  text-center p-1.5 h-full w-full rounded-none ${
                          i === mangoAccounts.length - 1 ? 'rounded-r-md' : null
                        } border-l border-th-fgd-4 hover:bg-th-bkg-3 focus:outline-none`}
                      >
                        {abbreviateAddress(acc.publicKey)}
                      </button>
                    )}
                  </RadioGroup.Option>
                ))}
              </RadioGroup>
            ) : null}
            {mangoAccounts.length > 2 ? (
              <Select
                className="w-full mt-2 sm:w-36 sm:mt-0"
                value={
                  acc === 'All'
                    ? 'All'
                    : `${acc.slice(0, 5)}...${acc.slice(-5)}`
                }
                onChange={(val) => handleAccountChange(val)}
              >
                <Select.Option value="All">All</Select.Option>
                {mangoAccounts
                  .slice()
                  .sort(
                    (a, b) =>
                      (a.publicKey.toBase58() > b.publicKey.toBase58() && 1) ||
                      -1
                  )
                  .map((acc, i) => (
                    <Select.Option key={i} value={acc.publicKey.toString()}>
                      {abbreviateAddress(acc.publicKey)}
                    </Select.Option>
                  ))}
              </Select>
            ) : null}
            <Button
              className={`text-xs flex items-center justify-center sm:ml-2 pt-0 pb-0 ${
                mangoAccounts.length > 2 ? 'h-10' : 'h-8'
              } pl-3 pr-3`}
              disabled={!connected}
              onClick={() => setOpenAlertModal(true)}
            >
              <div className="flex items-center">
                <PlusCircleIcon className="h-5 w-5 mr-1.5" />
                New
              </div>
            </Button>
          </div>
        </div>
        <div className="p-6 rounded-lg bg-th-bkg-2">
          {loading ? (
            <>
              <div className="h-12 w-full animate-pulse rounded-lg bg-th-bkg-3 mb-2" />
              <div className="h-24 w-full animate-pulse rounded-lg bg-th-bkg-3 mb-2" />
              <div className="h-24 w-full animate-pulse rounded-lg bg-th-bkg-3 mb-2" />
              <div className="h-24 w-full animate-pulse rounded-lg bg-th-bkg-3" />
            </>
          ) : connected ? (
            <>
              <div className="border-b border-th-fgd-4 mb-4">
                <nav className={`-mb-px flex space-x-6`} aria-label="Tabs">
                  {TABS.map((tabName) => (
                    <a
                      key={tabName}
                      onClick={() => handleTabChange(tabName)}
                      className={`whitespace-nowrap pb-4 px-1 border-b-2 font-semibold cursor-pointer default-transition hover:opacity-100
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
              <TabContent
                acc={acc}
                activeTab={activeTab}
                activeAlerts={activeAlerts}
                clearAlertsTimestamp={clearAlertsTimestamp}
                clearedAlerts={clearedAlerts}
                filteredActiveAlerts={filteredActiveAlerts}
                filteredTriggeredAlerts={filteredTriggeredAlerts}
                setClearAlertsTimestamp={setClearAlertsTimestamp}
                setReactivateAlertData={setReactivateAlertData}
                setOpenAlertModal={setOpenAlertModal}
                triggeredAlerts={triggeredAlerts}
              />
            </>
          ) : (
            <EmptyState
              desc="Connect a wallet to view and create liquidation alerts"
              icon={<LinkIcon />}
              title="Connect Wallet"
            />
          )}
        </div>
      </PageBodyContainer>
      {openAlertModal ? (
        <AlertsModal
          alert={reactivateAlertData}
          isOpen={openAlertModal}
          onClose={() => setOpenAlertModal(false)}
        />
      ) : null}
    </div>
  )
}

const TabContent = ({
  acc,
  activeTab,
  activeAlerts,
  clearedAlerts,
  clearAlertsTimestamp,
  filteredActiveAlerts,
  filteredTriggeredAlerts,
  setClearAlertsTimestamp,
  setOpenAlertModal,
  setReactivateAlertData,
  triggeredAlerts,
}) => {
  switch (activeTab) {
    case 'Active':
      return activeAlerts.length === 0 ? (
        <div className="flex flex-col items-center text-th-fgd-1 px-4 pb-2 rounded-lg">
          <BellIcon className="w-6 h-6 mb-1 text-th-primary" />
          <div className="font-bold text-lg pb-1">No Alerts Found</div>
          <p className="mb-0 text-center">
            Get notified when your account is in danger of liquidation.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center pb-3">
            <InformationCircleIcon className="flex-shrink-0 h-4 w-4 mr-1.5 text-th-fgd-4" />
            <p className="mb-0 text-th-fgd-4">
              Active alerts will only trigger once.
            </p>
          </div>
          {acc === 'All'
            ? activeAlerts.map((alert) => (
                <AlertItem alert={alert} key={alert.timestamp} isLarge />
              ))
            : filteredActiveAlerts.map((alert) => (
                <AlertItem alert={alert} key={alert.timestamp} isLarge />
              ))}
        </>
      )
    case 'Triggered':
      return (
        <div>
          {triggeredAlerts.length === 0 ||
          (clearAlertsTimestamp && clearedAlerts.length === 0) ||
          (acc !== 'All' && filteredTriggeredAlerts.length === 0) ? (
            <div className="flex flex-col items-center text-th-fgd-1 px-4 pb-2 rounded-lg">
              <BadgeCheckIcon className="w-6 h-6 mb-1 text-th-green" />
              <div className="font-bold text-lg pb-1">Smooth Sailing</div>
              <p className="mb-0 text-center">
                None of your active liquidation alerts have been triggered.
              </p>
            </div>
          ) : (
            <>
              <div className="flex justify-between pb-3">
                <div className="flex items-center pr-2">
                  <InformationCircleIcon className="flex-shrink-0 h-4 w-4 mr-1.5 text-th-fgd-4" />
                  <p className="mb-0 text-th-fgd-4">
                    Re-activate alerts you want to receive again.
                  </p>
                </div>
                <LinkButton
                  onClick={() =>
                    setClearAlertsTimestamp(
                      triggeredAlerts[0].triggeredTimestamp
                    )
                  }
                >
                  <div className="flex items-center">
                    <TrashIcon className="h-4 w-4 mr-1.5" />
                    Clear
                  </div>
                </LinkButton>
              </div>
              {acc === 'All'
                ? clearAlertsTimestamp
                  ? clearedAlerts.map((alert) => (
                      <AlertItem
                        alert={alert}
                        key={alert.timestamp}
                        setReactivateAlertData={setReactivateAlertData}
                        setOpenAlertModal={setOpenAlertModal}
                        isLarge
                      />
                    ))
                  : triggeredAlerts.map((alert) => (
                      <AlertItem
                        alert={alert}
                        key={alert.timestamp}
                        setReactivateAlertData={setReactivateAlertData}
                        setOpenAlertModal={setOpenAlertModal}
                        isLarge
                      />
                    ))
                : filteredTriggeredAlerts.map((alert) => (
                    <AlertItem
                      alert={alert}
                      key={alert.timestamp}
                      setReactivateAlertData={setReactivateAlertData}
                      setOpenAlertModal={setOpenAlertModal}
                      isLarge
                    />
                  ))}
            </>
          )}
        </div>
      )
    default:
      return activeAlerts.map((alert) => (
        <AlertItem alert={alert} key={alert.timestamp} />
      ))
  }
}
