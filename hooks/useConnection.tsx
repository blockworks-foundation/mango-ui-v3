import { useEffect, useMemo } from 'react'
import { Account, Connection } from '@solana/web3.js'
import { IDS } from '@blockworks-foundation/mango-client'
import useMangoStore from '../stores/useMangoStore'

const useConnection = () => {
  // console.log('loading useConnection')

  const setSolanaStore = useMangoStore((s) => s.set)
  const { cluster, current: connection, endpoint } = useMangoStore(
    (s) => s.connection
  )

  const sendConnection = useMemo(() => new Connection(endpoint, 'recent'), [
    endpoint,
  ])

  useEffect(() => {
    // @ts-ignore
    if (connection && endpoint === connection._rpcEndpoint) return
    console.log('setting new connection')

    const newConnection = new Connection(endpoint, 'recent')
    setSolanaStore((state) => {
      state.connection.current = newConnection
    })
  }, [endpoint])

  useEffect(() => {
    const id = connection.onAccountChange(new Account().publicKey, () => {})
    return () => {
      connection.removeAccountChangeListener(id)
    }
  }, [endpoint])

  useEffect(() => {
    const id = connection.onSlotChange(() => null)
    return () => {
      connection.removeSlotChangeListener(id)
    }
  }, [endpoint])

  const programId = useMemo(() => IDS[cluster].mango_program_id, [cluster])
  const dexProgramId = useMemo(() => IDS[cluster]?.dex_program_id, [cluster])

  return { connection, dexProgramId, cluster, programId, sendConnection }
}

export default useConnection
