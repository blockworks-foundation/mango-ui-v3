import { useEffect, useState } from 'react'
import { XIcon } from '@heroicons/react/solid'
import { Connection } from '@solana/web3.js'
import { sumBy } from 'lodash'
import useInterval from '../hooks/useInterval'
import { SECONDS } from '../stores/useMangoStore'

const connection = new Connection('https://solana-api.projectserum.com/')

const getRecentPerformance = async (setShow, setTps) => {
  try {
    const samples = 3
    const response = await connection.getRecentPerformanceSamples(samples)
    const totalSecs = sumBy(response, 'samplePeriodSecs')
    const totalTransactions = sumBy(response, 'numTransactions')
    const tps = totalTransactions / totalSecs

    if (tps < 1600) {
      setShow(true)
      setTps(tps)
    } else {
      setShow(false)
    }
  } catch {
    console.log('Unable to fetch TPS')
  }
}

const GlobalNotification = () => {
  const [show, setShow] = useState(false)
  const [tps, setTps] = useState(0)

  useEffect(() => {
    getRecentPerformance(setShow, setTps)
  }, [])

  useInterval(() => {
    getRecentPerformance(setShow, setTps)
  }, 60 * SECONDS)

  if (show) {
    return (
      <div className="flex items-center bg-th-bkg-4 text-th-primary">
        <div className="w-full p-1 text-center">
          <span>
            Solana network is experiencing degraded performance. Transactions
            may fail to send or confirm. (TPS: {tps?.toFixed(0)})
          </span>
        </div>

        <button
          className="mr-4 text-th-primary hover:text-th-primary"
          onClick={() => setShow(false)}
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>
    )
  } else {
    return null
  }
}

export default GlobalNotification
