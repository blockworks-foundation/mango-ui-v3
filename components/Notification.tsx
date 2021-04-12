import { useEffect, useState } from 'react'
import xw from 'xwind'
import {
  CheckCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/outline'
import useMangoStore from '../stores/useMangoStore'

const NotificationList = () => {
  const setMangoStore = useMangoStore((s) => s.set)
  const notifications = useMangoStore((s) => s.notifications)
  console.log('notifications', notifications)

  useEffect(() => {
    if (notifications.length > 0) {
      const id = setInterval(() => {
        setMangoStore((state) => {
          state.notifications = notifications.slice(1, notifications.length)
        })
      }, 6000)

      return () => {
        clearInterval(id)
      }
    }
  }, [notifications, setMangoStore])

  return (
    <div
      css={xw`fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6`}
    >
      <div css={xw`flex flex-col w-full`}>
        {notifications.map((n, idx) => (
          <Notification
            key={`${n.message}${idx}`}
            type={n.type}
            message={n.message}
            description={n.description}
            txid={n.txid}
          />
        ))}
      </div>
    </div>
  )
}

const Notification = ({ type, message, description, txid }) => {
  const [showNotification, setShowNotification] = useState(true)

  if (!showNotification) return null

  return (
    <div
      css={xw`max-w-sm w-full bg-white shadow-lg rounded-lg mt-2 pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden`}
    >
      <div css={xw`p-4`}>
        <div css={xw`flex items-start`}>
          <div css={xw`flex-shrink-0`}>
            {type === 'success' ? (
              <CheckCircleIcon css={xw`text-green-400 h-9 w-9 mr-1`} />
            ) : null}
            {type === 'info' && (
              <XCircleIcon css={xw`text-yellow-400 h-9 w-9 mr-1`} />
            )}
            {type === 'error' && (
              <InformationCircleIcon css={xw`text-red-400 h-9 w-9 mr-1`} />
            )}
          </div>
          <div css={xw`ml-2 w-0 flex-1`}>
            <p css={xw`text-lg font-medium text-gray-900`}>{message}</p>
            <p css={xw`mt-0.5 text-base text-gray-500`}>{description}</p>
            {txid ? <p css={xw`mt-0.5 text-sm text-gray-500`}>{txid}</p> : null}
          </div>
          <div css={xw`ml-4 flex-shrink-0 flex`}>
            <button
              onClick={() => setShowNotification(false)}
              css={xw`bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mango-yellow`}
            >
              <span css={xw`sr-only`}>Close</span>
              <svg
                css={xw`h-5 w-5`}
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
    </div>
  )
}

export default NotificationList
