import { useState } from 'react'
import xw from 'xwind'
import useInterval from '../hooks/useInterval'

const NotificationList = ({ notifications }) => {
  return (
    <div
      css={xw`fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6`}
    >
      <div css={xw`flex flex-col w-full`}>
        {notifications.map((n, idx) => (
          <Notification
            key={`${n.title}${idx}`}
            title={n.title}
            message={n.message}
          />
        ))}
      </div>
    </div>
  )
}

const Notification = ({ title, message }) => {
  const [showNotification, setShowNotification] = useState(true)

  useInterval(() => {
    setShowNotification(false)
  }, 6000)

  if (!showNotification) return null

  return (
    <div
      css={xw`max-w-sm w-full bg-white shadow-lg rounded-lg mt-2 pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden`}
    >
      <div css={xw`p-4`}>
        <div css={xw`flex items-start`}>
          <div css={xw`flex-shrink-0`}>
            <svg
              css={xw`h-6 w-6 text-green-400`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div css={xw`ml-3 w-0 flex-1 pt-0.5`}>
            <p css={xw`text-sm font-medium text-gray-900`}>{title}</p>
            <p css={xw`mt-1 text-sm text-gray-500`}>{message}</p>
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
