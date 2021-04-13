import { useEffect } from 'react'
import useMangoStore from '../stores/useMangoStore'
import useInterval from './useInterval'

const useMarginAccount = () => {
  const mangoClient = useMangoStore((s) => s.mangoClient)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const actions = useMangoStore((s) => s.actions)
  const selectedMarginAccount = useMangoStore(
    (s) => s.selectedMarginAccount.current
  )
  const connected = useMangoStore((s) => s.wallet.connected)
  const setMangoStore = useMangoStore((s) => s.set)

  useEffect(() => {
    actions.fetchMangoGroup()
  }, [actions])

  useEffect(() => {
    if (!connected) return
    actions.fetchMarginAcccount()
    actions.fetchMangoSrmAccounts()
  }, [connected, actions])

  useInterval(() => {
    actions.fetchMarginAcccount()
    // fetchMangoGroup()
  }, 9000)

  return {
    mangoClient,
    setMangoStore,
    mangoGroup,
    marginAccount: selectedMarginAccount,
  }
}

export default useMarginAccount
