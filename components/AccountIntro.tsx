import React, { useCallback, useEffect, useState } from 'react'
import IntroTips, { SHOW_TOUR_KEY } from '../components/IntroTips'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from '../components/TradePageGrid'
import { mangoAccountSelector } from '../stores/selectors'
import { useWallet } from '@solana/wallet-adapter-react'
import AccountsModal from 'components/AccountsModal'
import useMangoStore from 'stores/useMangoStore'
import useLocalStorageState from '../hooks/useLocalStorageState'

const DISMISS_CREATE_ACCOUNT_KEY = 'show-create-account'

const AccountIntro = () => {
  const mangoAccount = useMangoStore(mangoAccountSelector)
  const [showTour] = useLocalStorageState(SHOW_TOUR_KEY, false)
  const [showCreateAccount, setShowCreateAccount] = useState(false)
  const { width } = useViewport()
  const [dismissCreateAccount, setDismissCreateAccount] = useLocalStorageState(
    DISMISS_CREATE_ACCOUNT_KEY,
    false
  )
  const { connected } = useWallet()

  const hideTips = width ? width < breakpoints.md : false

  useEffect(() => {
    if (connected && !mangoAccount && !dismissCreateAccount) {
      setShowCreateAccount(true)
    }
  }, [connected, mangoAccount])

  const handleCloseCreateAccount = useCallback(() => {
    setShowCreateAccount(false)
    setDismissCreateAccount(true)
  }, [])

  return (
    <>
      {showTour && !hideTips ? (
        <IntroTips connected={connected} mangoAccount={mangoAccount} />
      ) : null}
      {showCreateAccount ? (
        <AccountsModal
          isOpen={showCreateAccount}
          onClose={() => handleCloseCreateAccount()}
        />
      ) : null}
    </>
  )
}

export default AccountIntro
