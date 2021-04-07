import { useCallback, useEffect, useMemo } from 'react'
import { PublicKey } from '@solana/web3.js'
import { IDS } from '@blockworks-foundation/mango-client'
import useMangoStore from '../stores/useMangoStore'
import useConnection from './useConnection'
import useInterval from './useInterval'
import useWallet from './useWallet'

const useMarginAccount = () => {
  const mangoClient = useMangoStore((s) => s.mangoClient)
  const mangoGroupName = useMangoStore((s) => s.selectedMangoGroup.name)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const selectedMarginAccount = useMangoStore(
    (s) => s.selectedMarginAccount.current
  )
  const setMangoStore = useMangoStore((s) => s.set)

  const { current: wallet } = useMangoStore((s) => s.wallet)
  const { connected } = useWallet()

  const { cluster, connection } = useConnection()
  const clusterIds = useMemo(() => IDS[cluster], [cluster])
  const mangoGroupIds = useMemo(() => clusterIds.mango_groups[mangoGroupName], [
    clusterIds,
    mangoGroupName,
  ])

  const fetchMangoGroup = useCallback(() => {
    if (!mangoClient) return

    const mangoGroupPk = new PublicKey(mangoGroupIds.mango_group_pk)
    const srmVaultPk = new PublicKey(mangoGroupIds.srm_vault_pk)

    mangoClient
      .getMangoGroup(connection, mangoGroupPk, srmVaultPk)
      .then((mangoGroup) => {
        // Set the mango group
        setMangoStore((state) => {
          state.selectedMangoGroup.current = mangoGroup
        })
      })
      .catch((err) => {
        console.error('Could not get mango group: ', err)
      })
  }, [connection, mangoClient, mangoGroupIds, setMangoStore])

  const fetchMarginAccounts = useCallback(() => {
    if (!mangoClient || !mangoGroup || !connected || !wallet.publicKey) return

    mangoClient
      .getMarginAccountsForOwner(
        connection,
        new PublicKey(clusterIds.mango_program_id),
        mangoGroup,
        wallet
      )
      .then((marginAccounts) => {
        console.log('margin Accounts: ', marginAccounts)

        if (marginAccounts.length > 0) {
          setMangoStore((state) => {
            state.marginAcccounts = marginAccounts
            state.selectedMarginAccount.current = marginAccounts[0]
          })
        }
      })
      .catch((err) => {
        console.error('Could not get margin accounts for user in effect ', err)
      })
  }, [mangoClient, connection, connected, mangoGroup, wallet])

  useEffect(() => {
    fetchMangoGroup()
    fetchMarginAccounts()
  }, [fetchMangoGroup])

  useEffect(() => {
    if (!connected) return
    fetchMarginAccounts()
  }, [connected, fetchMarginAccounts])

  useInterval(() => {
    fetchMarginAccounts()
    // fetchMangoGroup()
  }, 2000)

  return {
    mangoClient,
    setMangoStore,
    mangoGroup,
    marginAccount: selectedMarginAccount,
  }
}

export default useMarginAccount
