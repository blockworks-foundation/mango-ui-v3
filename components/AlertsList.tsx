import { Fragment, useEffect, useState } from 'react'
import styled from '@emotion/styled'
import Router from 'next/router'
import { BadgeCheckIcon, BellIcon, TrashIcon } from '@heroicons/react/outline'
import useAlertsStore from '../stores/useAlertsStore'
import useLocalStorageState from '../hooks/useLocalStorageState'
import { Popover, Transition } from '@headlessui/react'
import { LinkButton } from './Button'
import Loading from './Loading'
import AlertsModal from './AlertsModal'
import AlertItem from './AlertItem'

const StyledAlertCount = styled.span`
  font-size: 0.6rem;
`

const AlertsList = () => {
  const [openAlertModal, setOpenAlertModal] = useState(false)
  const [clearedAlerts, setClearedAlerts] = useState([])
  const [ringBell, setRingBell] = useState(false)
  const activeAlerts = useAlertsStore((s) => s.activeAlerts)
  const triggeredAlerts = useAlertsStore((s) => s.triggeredAlerts)
  const loading = useAlertsStore((s) => s.loading)

  const [
    triggeredAlertsLength,
    setTriggeredAlertsLength,
  ] = useLocalStorageState('triggeredAlertsLength', null)

  const [alertsCount, setAlertsCount] = useLocalStorageState('alertsCount', 0)

  const [clearAlertsTimestamp, setClearAlertsTimestamp] = useLocalStorageState(
    'clearAlertsTimestamp',
    null
  )

  useEffect(() => {
    if (triggeredAlerts.length > 0) {
      if (!triggeredAlertsLength) {
        setTriggeredAlertsLength(triggeredAlerts.length)
      }
      if (
        triggeredAlertsLength &&
        triggeredAlerts.length > triggeredAlertsLength
      ) {
        setAlertsCount(alertsCount + 1)
        setTriggeredAlertsLength(triggeredAlerts.length)
        setRingBell(true)
      }
    }
  }, [triggeredAlerts])

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

  useEffect(() => {
    if (ringBell) {
      const bellTimer = setTimeout(() => {
        setRingBell(false)
      }, 1200)
      return () => clearTimeout(bellTimer)
    }
  }, [ringBell])

  return (
    <>
      <Popover className="relative">
        {({ open }) => (
          <>
            <Popover.Button className="focus:outline-none">
              {alertsCount > 0 ? (
                <div className="absolute -top-1.5 -right-1.5 z-20">
                  <span className="flex h-4 w-4 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-th-red opacity-75"></span>
                    <StyledAlertCount className="w-4 h-4 bg-th-red relative inline-flex rounded-full flex items-center justify-center">
                      {alertsCount}
                    </StyledAlertCount>
                  </span>
                </div>
              ) : null}
              <div
                className={`flex items-center justify-center rounded-full bg-th-bkg-3 w-8 h-8 default-transition hover:text-th-primary ${
                  ringBell ? 'animate-shake' : null
                }`}
                onClick={() => setAlertsCount(0)}
              >
                <BellIcon className="w-4 h-4" />
              </div>
            </Popover.Button>
            <Transition
              show={open}
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Popover.Panel
                static
                className="absolute z-10 mt-3 right-0 md:transform md:-translate-x-1/2 md:left-1/2 w-64"
              >
                <div className="bg-th-bkg-1 p-4 overflow-auto max-h-80 rounded-lg shadow-lg thin-scroll">
                  {loading ? (
                    <div className="flex items-center justify-center text-th-primary h-40">
                      <Loading />
                    </div>
                  ) : (
                    <>
                      {triggeredAlerts.length === 0 &&
                      activeAlerts.length === 0 ? (
                        <>
                          <div className="flex flex-col items-center text-th-fgd-1 px-4 pb-2 rounded-lg">
                            <BellIcon className="w-6 h-6 mb-1 text-th-primary" />
                            <div className="font-bold text-base pb-1">
                              No Alerts Found
                            </div>
                            <p className="mb-0 text-center text-xs">
                              Get notified when your account is in danger of
                              liquidation.
                            </p>
                          </div>
                          <LinkButton
                            onClick={() => setOpenAlertModal(true)}
                            className="w-full text-xs text-th-primary"
                          >
                            Create Liquidation Alert
                          </LinkButton>
                        </>
                      ) : triggeredAlerts.length === 0 ||
                        (clearAlertsTimestamp && clearedAlerts.length === 0) ? (
                        <>
                          <div className="flex flex-col items-center text-th-fgd-1 px-4 pb-2 rounded-lg">
                            <BadgeCheckIcon className="w-6 h-6 mb-1 text-th-green" />
                            <div className="font-bold text-base pb-1">
                              Smooth Sailing
                            </div>
                            <p className="mb-0 text-center text-xs">
                              None of your active liquidation alerts have been
                              triggered.
                            </p>
                          </div>
                          <LinkButton
                            onClick={() => Router.push('/alerts')}
                            className="w-full text-xs text-th-primary"
                          >
                            View All
                          </LinkButton>
                        </>
                      ) : (
                        <>
                          <div className="pb-3">
                            <div className="flex items-center justify-between text-th-fgd-1 font-bold">
                              Triggered Alerts
                              <LinkButton
                                className="text-xs"
                                onClick={() =>
                                  setClearAlertsTimestamp(
                                    triggeredAlerts[0].triggeredTimestamp
                                  )
                                }
                              >
                                <div className="flex items-center">
                                  <TrashIcon className="h-3 w-3 mr-1" />
                                  Clear
                                </div>
                              </LinkButton>
                            </div>
                            {activeAlerts.length === 0 ? (
                              <div className="text-xs text-th-fgd-4 pt-1">
                                You have no active alerts.
                              </div>
                            ) : null}
                          </div>

                          {clearAlertsTimestamp
                            ? clearedAlerts.map((alert) => (
                                <AlertItem
                                  alert={alert}
                                  key={alert.timestamp}
                                />
                              ))
                            : triggeredAlerts.map((alert) => (
                                <AlertItem
                                  alert={alert}
                                  key={alert.timestamp}
                                />
                              ))}
                          <div className="flex justify-center pt-2">
                            <LinkButton
                              onClick={() => Router.push('/alerts')}
                              className="text-th-primary text-xs text-center"
                            >
                              View All
                            </LinkButton>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
      {openAlertModal ? (
        <AlertsModal
          isOpen={openAlertModal}
          onClose={() => setOpenAlertModal(false)}
        />
      ) : null}
    </>
  )
}

export default AlertsList
