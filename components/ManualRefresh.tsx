import { useState } from 'react'
import { RefreshClockwiseIcon } from './icons'
import useMangoStore from '../stores/useMangoStore'
import Tooltip from './Tooltip'
import { IconButton } from './Button'

const ManualRefresh = ({ className = '' }) => {
  const [spin, setSpin] = useState(false)
  const actions = useMangoStore((s) => s.actions)

  const handleRefreshData = async () => {
    setSpin(true)
    await actions.fetchMangoAccounts()
    actions.fetchWalletTokens()
    actions.fetchTradeHistory()
    setSpin(false)
  }

  return (
    <div className={`inline-flex relative ${className}`}>
      <Tooltip content="Refresh Data" className="text-xs py-1">
        <IconButton onClick={handleRefreshData}>
          <RefreshClockwiseIcon
            className={`w-4 h-4 ${spin ? 'animate-spin' : null}`}
          />
        </IconButton>
      </Tooltip>
    </div>
  )
}

export default ManualRefresh
