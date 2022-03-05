import { useEffect, useState } from 'react'
import { XIcon } from '@heroicons/react/solid'
import { Connection } from '@solana/web3.js'
import { sumBy } from 'lodash'
import useInterval from '../hooks/useInterval'
import { SECONDS } from '../stores/useMangoStore'

const connection = new Connection('https://solana-api.projectserum.com/')

const getRecentPerformance = async (setShow) => {
  try {
    const samples = 5
    const response = await connection.getRecentPerformanceSamples(samples)
    const totalSecs = sumBy(response, 'samplePeriodSecs')
    const totalTransactions = sumBy(response, 'numTransactions')
    const tps = totalTransactions / totalSecs

    if (tps < 1500) {
      setShow(true)
    } else {
      setShow(false)
    }
  } catch {
    console.log('Unable to fetch TPS')
  }
}

const GlobalNotification = () => {
  const [show, setShow] = useState(false)

  useEffect(() => {
    getRecentPerformance(setShow)
  }, [])

  useInterval(() => {
    getRecentPerformance(setShow)
  }, 60 * SECONDS)

  if (show) {
    return (
      <div className="flex items-center bg-th-bkg-4 text-th-primary">
        <div className="w-full text-center p-1">
          <span>
            Solana network is experiencing degraded performance. Transactions
            may fail to send or confirm.
          </span>
        </div>

        <button
          className="text-th-primary mr-4 hover:text-th-primary"
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
