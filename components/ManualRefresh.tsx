import { useEffect, useState } from 'react'
import { RefreshClockwiseIcon } from './icons'
import useMangoStore from '../stores/useMangoStore'
import Tooltip from './Tooltip'
import { IconButton } from './Button'
import { useTranslation } from 'next-i18next'

const ManualRefresh = ({ className = '' }) => {
  const { t } = useTranslation('common')
  const [spin, setSpin] = useState(false)
  const actions = useMangoStore((s) => s.actions)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)

  const handleRefreshData = async () => {
    setSpin(true)
    await actions.fetchMangoGroup()
    if (mangoAccount) {
      await actions.reloadMangoAccount()
      actions.fetchTradeHistory()
    }
  }

  useEffect(() => {
    let timer
    if (spin) {
      timer = setTimeout(() => setSpin(false), 5000)
    }

    return () => {
      clearTimeout(timer)
    }
  }, [spin])

  return (
    <div className={`inline-flex relative ${className}`}>
      <Tooltip content={t('refresh-data')} className="text-xs py-1">
        <IconButton onClick={handleRefreshData} disabled={spin}>
          <RefreshClockwiseIcon
            className={`w-4 h-4 ${spin ? 'animate-spin' : null}`}
          />
        </IconButton>
      </Tooltip>
    </div>
  )
}

export default ManualRefresh
