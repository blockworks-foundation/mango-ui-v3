import { useCallback, useEffect, useMemo } from 'react'
import { PublicKey } from '@solana/web3.js'
import { IDS } from '@blockworks-foundation/mango-client'
import useMangoStore from '../stores/useMangoStore'
import useConnection from './useConnection'
import useInterval from './useInterval'
import useSolanaStore from '../stores/useSolanaStore'

const useMarginAccount = () => {
  const mangoClient = useMangoStore((s) => s.mangoClient)
  const tradeForm = useMangoStore((s) => s.tradeForm)
  const selectedMangoGroup = useMangoStore((s) => s.selectedMangoGroup)
  const selectedMarginAccount = useMangoStore((s) => s.selectedMarginAccount)
  const mangoGroup = useMangoStore((s) => s.mangoGroup)
  const setMangoStore = useMangoStore((s) => s.set)

  const { current: wallet } = useSolanaStore((s) => s.wallet)

  const { cluster, connection } = useConnection()
  const clusterIds = useMemo(() => IDS[cluster], [cluster])
  const mangoGroupIds = useMemo(
    () => clusterIds.mango_groups[selectedMangoGroup],
    [clusterIds, selectedMangoGroup]
  )

  const fetchMangoGroup = useCallback(() => {
    if (!mangoClient) return

    const mangoGroupPk = new PublicKey(mangoGroupIds.mango_group_pk)
    const srmVaultPk = new PublicKey(mangoGroupIds.srm_vault_pk)

    mangoClient
      .getMangoGroup(connection, mangoGroupPk, srmVaultPk)
      .then((mangoGroup) => {
        // Set the mango group
        setMangoStore((state) => {
          state.mangoGroup = mangoGroup
        })
      })
      .catch((err) => {
        console.error('Could not get mango group: ', err)
      })
  }, [connection, mangoClient, mangoGroupIds, setMangoStore])

  const fetchMarginAccounts = useCallback(() => {
    if (!mangoClient || !wallet || !mangoGroup) return

    mangoClient
      .getMarginAccountsForOwner(
        connection,
        new PublicKey(clusterIds.mango_program_id),
        mangoGroup,
        wallet
      )
      .then((marginAccounts) => {
        if (marginAccounts.length > 0) {
          setMangoStore((state) => {
            state.marginAcccounts = marginAccounts
            state.selectedMarginAccount = marginAccounts[0]
          })
        }
      })
      .catch((err) => {
        console.error('Could not get margin accounts for user in effect ', err)
      })
  }, [mangoClient, connection, mangoGroup, wallet])

  // useEffect(() => {
  //   fetchMangoGroup()
  // }, [fetchMangoGroup])

  // useInterval(() => {
  //   fetchMarginAccounts()
  //   fetchMangoGroup()
  // }, 20000)

  return {
    mangoClient,
    setMangoStore,
    tradeForm,
    mangoGroup,
    marginAccount: selectedMarginAccount,
  }
}

export default useMarginAccount
