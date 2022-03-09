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
      actions.reloadOrders()
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
    <div className={`relative inline-flex ${className}`}>
      <Tooltip content={t('refresh-data')} className="py-1 text-xs">
        <IconButton onClick={handleRefreshData} disabled={spin}>
          <RefreshClockwiseIcon
            className={`h-4 w-4 ${spin ? 'animate-spin' : null}`}
          />
        </IconButton>
      </Tooltip>
    </div>
  )
}

export default ManualRefresh
