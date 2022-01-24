import { useState } from 'react'
// import useLocalStorageState from '../hooks/useLocalStorageState'

import { XIcon } from '@heroicons/react/solid'

// const GLOBAL_NOTIFICATION_KEY = 'globalNotification-0.1'

const GlobalNotification = () => {
  const [show, setShow] = useState(false) // update this to true when we have a notification

  if (show) {
    return (
      <div className="flex items-center bg-th-bkg-4 text-th-fgd-1">
        <div className="w-full text-center p-2.5">
          <span>
            The Solana network is currently experiencing degraded performance
            resulting in some transactions timing out.
          </span>
        </div>

        <button
          className="text-th-fgd-1 mr-4 hover:text-th-primary"
          onClick={() => setShow(false)}
        >
          <XIcon className="w-5 h-5" />
        </button>
      </div>
    )
  } else {
    return null
  }
}

export default GlobalNotification
