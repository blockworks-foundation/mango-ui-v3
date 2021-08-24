import { useEffect, useState } from 'react'
import {
  CheckCircleIcon,
  ExternalLinkIcon,
  InformationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/outline'
import useMangoStore from '../stores/useMangoStore'
import { notify } from '../utils/notifications'

const NotificationList = () => {
  const setMangoStore = useMangoStore((s) => s.set)
  const notifications = useMangoStore((s) => s.notifications)
  const walletTokens = useMangoStore((s) => s.wallet.tokens)

  // if a notification is shown with {"InstructionError":[0,{"Custom":1}]} then
  // add a notification letting the user know they may not have enough SOL
  useEffect(() => {
    if (notifications.length) {
      const notEnoughSoLMessage =
        'You may not have enough SOL for this transaction'
      const customErrorNotification = notifications.find(
        (n) => n.description && n.description.includes('"Custom":1')
      )
      const notEnoughSolNotification = notifications.find(
        (n) => n.title && n.title.includes(notEnoughSoLMessage)
      )
      const solBalance = walletTokens.find(
        (t) => t.config.symbol === 'SOL'
      )?.uiBalance

      if (
        customErrorNotification &&
        solBalance < 0.04 &&
        !notEnoughSolNotification
      ) {
        notify({
          title: notEnoughSoLMessage,
          type: 'info',
        })
      }
      console.log('notifications', notifications)
      console.log('walletTokens', walletTokens)
    }
  }, [notifications, walletTokens])

  useEffect(() => {
    if (notifications.length > 0) {
      const id = setInterval(() => {
        setMangoStore((state) => {
          state.notifications = notifications.slice(1, notifications.length)
        })
      }, 5000)

      return () => {
        clearInterval(id)
      }
    }
  }, [notifications, setMangoStore])

  const reversedNotifications = [...notifications].reverse()

  return (
    <div
      className={`fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 text-th-fgd-1 z-50`}
    >
      <div className={`flex flex-col w-full`}>
        {reversedNotifications.map((n, idx) => (
          <Notification
            key={`${n.title}${idx}`}
            type={n.type}
            title={n.title}
            description={n.description}
            txid={n.txid}
          />
        ))}
      </div>
    </div>
  )
}

const Notification = ({ type, title, description, txid }) => {
  const [showNotification, setShowNotification] = useState(true)

  if (!showNotification) return null

  return (
    <div
      className={`max-w-sm w-full bg-th-bkg-3 shadow-lg rounded-md mt-2 pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden`}
    >
      <div className={`flex items-center p-4 relative`}>
        <div className={`flex-shrink-0`}>
          {type === 'success' ? (
            <CheckCircleIcon className={`text-th-green h-7 w-7 mr-1`} />
          ) : null}
          {type === 'info' && (
            <InformationCircleIcon className={`text-th-primary h-7 w-7 mr-1`} />
          )}
          {type === 'error' && (
            <XCircleIcon className={`text-th-red h-7 w-7 mr-1`} />
          )}
        </div>
        <div className={`ml-2 w-0 flex-1`}>
          <div className={`font-bold text-base text-th-fgd-1`}>{title}</div>
          {description ? (
            <p className={`mb-0 mt-0.5 text-th-fgd-3`}>{description}</p>
          ) : null}
          {txid ? (
            <a
              href={'https://explorer.solana.com/tx/' + txid}
              className="block flex items-center mt-0.5 text-sm"
              target="_blank"
              rel="noreferrer"
            >
              {txid.slice(0, 8)}...
              {txid.slice(txid.length - 8)}
              <ExternalLinkIcon className="h-4 mb-0.5 ml-1 w-4" />
            </a>
          ) : null}
        </div>
        <div className={`absolute flex-shrink-0 right-2 top-2`}>
          <button
            onClick={() => setShowNotification(false)}
            className={`text-th-fgd-4 hover:text-th-primary focus:outline-none`}
          >
            <span className={`sr-only`}>Close</span>
            <svg
              className={`h-5 w-5`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotificationList
