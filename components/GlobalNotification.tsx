import { useEffect, useState } from 'react'
import sumBy from 'lodash/sumBy'
import useInterval from '../hooks/useInterval'
import { CLUSTER, SECONDS } from '../stores/useMangoStore'
import { useTranslation } from 'next-i18next'
import { ExclamationIcon } from '@heroicons/react/outline'
import { Connection } from '@solana/web3.js'

const tpsAlertThreshold = 1000
const tpsWarningThreshold = 1300

const connection = new Connection('https://mango.genesysgo.net')

const getRecentPerformance = async (setShow, setTps) => {
  try {
    const samples = 2
    const response = await connection.getRecentPerformanceSamples(samples)
    const totalSecs = sumBy(response, 'samplePeriodSecs')
    const totalTransactions = sumBy(response, 'numTransactions')
    const tps = totalTransactions / totalSecs

    if (tps < tpsWarningThreshold) {
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
  const { t } = useTranslation('common')

  useEffect(() => {
    getRecentPerformance(setShow, setTps)
  }, [])

  useInterval(() => {
    getRecentPerformance(setShow, setTps)
  }, 45 * SECONDS)

  if (show && CLUSTER == 'mainnet') {
    return (
      <div className="flex items-center bg-th-bkg-4 text-th-fgd-2">
        <div className="flex w-full items-center justify-center p-1">
          <ExclamationIcon
            className={`mr-1.5 mt-0.5 h-5 w-5 flex-shrink-0 ${
              tps < tpsAlertThreshold ? 'text-th-red' : 'text-th-orange'
            }`}
          />
          {tps < 50 ? (
            <span>{t('solana-down')}</span>
          ) : (
            <span>{t('degraded-performance')}</span>
          )}
          <div
            className={`ml-2 whitespace-nowrap rounded-full px-1.5 py-0.5 text-xs ${
              tps < tpsAlertThreshold
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
