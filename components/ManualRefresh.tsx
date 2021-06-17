import { useState } from 'react'
import { RefreshClockwiseIcon } from './icons'
import useMangoStore from '../stores/useMangoStore'
import Tooltip from './Tooltip'

const ManualRefresh = ({ className = '' }) => {
  const [spin, setSpin] = useState(false)
  const actions = useMangoStore((s) => s.actions)

  const handleRefreshData = async () => {
    setSpin(true)
    await actions.fetchMarginAccounts()
    await actions.fetchWalletTokens()
    await actions.fetchTradeHistory()
    setSpin(false)
  }

  return (
    <div className={`inline-flex relative ${className}`}>
      <Tooltip content="Refresh Data" className="text-xs py-1">
        <button
          onClick={() => handleRefreshData()}
          className="flex items-center justify-center rounded-full bg-th-bkg-3 w-8 h-8 hover:text-th-primary focus:outline-none"
        >
          <RefreshClockwiseIcon
            className={`w-4 h-4 ${spin ? 'animate-spin' : null}`}
          />
        </button>
      </Tooltip>
    </div>
  )
}

export default ManualRefresh
