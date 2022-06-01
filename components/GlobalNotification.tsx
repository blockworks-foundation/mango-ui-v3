import { useEffect, useState } from 'react'
import sumBy from 'lodash/sumBy'
import useInterval from '../hooks/useInterval'
import { SECONDS } from '../stores/useMangoStore'
import { useTranslation } from 'next-i18next'
import { ExclamationIcon } from '@heroicons/react/outline'
import { Connection } from '@solana/web3.js'

const tpsWarningThreshold = 1300

const connection = new Connection('https://mango.genesysgo.net')

const getRecentPerformance = async (setShow, setTps) => {
  try {
    const samples = 5
    const response = await connection.getRecentPerformanceSamples(samples)
    const totalSecs = sumBy(response, 'samplePeriodSecs')
    const totalTransactions = sumBy(response, 'numTransactions')
    const tps = totalTransactions / totalSecs

    if (tps < 1500) {
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
  const [show, setShow] = useState(true)
  const [tps, setTps] = useState(0)
  const { t } = useTranslation('common')

  useEffect(() => {
    getRecentPerformance(setShow, setTps)
  }, [])

  useInterval(() => {
    getRecentPerformance(setShow, setTps)
  }, 60 * SECONDS)

  if (show) {
    return (
      <div className="flex items-center bg-th-bkg-4 text-th-fgd-2">
        <div className="flex w-full items-center justify-center p-1">
          <ExclamationIcon
            className={`mr-1.5 mt-0.5 h-5 w-5 flex-shrink-0 ${
              tps < tpsWarningThreshold ? 'text-th-red' : 'text-th-orange'
            }`}
          />
          {tps < 50 ? (
            <span>{t('solana-down')}</span>
          ) : (
            <span>{t('degraded-performance')}</span>
          )}
          <div
            className={`ml-2 whitespace-nowrap rounded-full px-1.5 py-0.5 text-xs ${
              tps < tpsWarningThreshold
                ? 'bg-th-red text-white'
                : 'bg-th-orange text-th-bkg-1'
            }`}
          >
            TPS:{' '}
            <span className="font-bold">
              {tps?.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </span>
          </div>
        </div>
      </div>
    )
  } else {
    return null
  }
}

export default GlobalNotification
