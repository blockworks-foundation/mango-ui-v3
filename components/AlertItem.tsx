import { FunctionComponent } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import styled from '@emotion/styled'
import { ClockIcon, DeviceMobileIcon, MailIcon } from '@heroicons/react/outline'
import { TelegramIcon } from './icons'
import { abbreviateAddress } from '../utils'
import { LinkButton } from './Button'
import { Alert } from '../stores/useAlertsStore'

dayjs.extend(relativeTime)

const StyledDiv = styled.div`
  font-size: 0.75rem;
`

interface AlertItemProps {
  alert: Alert
  isLarge?: boolean
  setOpenAlertModal?: (x) => void
  setReactivateAlertData?: (x) => void
}

const AlertItem: FunctionComponent<AlertItemProps> = ({
  alert,
  isLarge = false,
  setOpenAlertModal,
  setReactivateAlertData,
}) => {
  const reactivateAlertData = !alert.open
    ? {
        acc: alert.acc,
        alertProvider: alert.alertProvider,
        collateralRatioThresh: alert.collateralRatioThresh,
      }
    : null

  const handleReactivate = () => {
    setOpenAlertModal(true)
    setReactivateAlertData(reactivateAlertData)
  }

  return (
    <div className="border border-th-bkg-3 mb-2 p-3 rounded-lg">
      <div className="flex">
        {alert.alertProvider === 'sms' ? (
          <DeviceMobileIcon
            className={`${isLarge ? 'w-5 h-5' : 'w-4 h-4 mt-0.5'} mr-2`}
          />
        ) : alert.alertProvider === 'mail' ? (
          <MailIcon
            className={`${isLarge ? 'w-5 h-5' : 'w-4 h-4 mt-0.5'} mr-2`}
          />
        ) : (
          <TelegramIcon
            className={`${isLarge ? 'w-5 h-5' : 'w-4 h-4 mt-0.5'} mr-2`}
          />
        )}
        <div className="w-full">
          <div className="flex justify-between pb-1">
            {alert.alertProvider === 'sms'
              ? 'SMS'
              : alert.alertProvider === 'mail'
              ? 'E-mail'
              : 'Telegram'}{' '}
            below {alert.collateralRatioThresh}%
            {isLarge ? (
              <div className="flex items-center">
                <ClockIcon className="w-3 h-3 text-th-fgd-4 mr-1" />
                <div className="text-xs text-th-fgd-4">
                  {dayjs(alert.timestamp).fromNow()}
                </div>
              </div>
            ) : null}
          </div>
          <div className="text-th-fgd-3 text-xs mb-1">
            Acc: {abbreviateAddress(alert.acc)}
          </div>
          {alert.open ? (
            <StyledDiv className="flex items-center text-th-fgd-4">
              <span className="flex h-2 w-2 mr-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-th-green opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-th-green"></span>
              </span>
              Active
            </StyledDiv>
          ) : (
            <div className="flex justify-between">
              <StyledDiv className="flex items-center text-th-fgd-4">
                <span className="flex h-2 w-2 mr-1.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-th-red opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-th-red"></span>
                </span>
                Triggered{' '}
                {alert.triggeredTimestamp
                  ? dayjs(alert.triggeredTimestamp).fromNow()
                  : null}
              </StyledDiv>
              {isLarge ? (
                <LinkButton
                  className="text-xs text-th-primary"
                  onClick={() => handleReactivate()}
                >
                  Re-activate
                </LinkButton>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AlertItem
