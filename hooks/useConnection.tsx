import { useEffect, useMemo } from 'react'
import { Account, Connection } from '@solana/web3.js'
import { IDS } from '@blockworks-foundation/mango-client'
import useMangoStore from '../stores/useMangoStore'

const useConnection = () => {
  const { cluster, current: connection, endpoint } = useMangoStore(
    (s) => s.connection
  )
  const setSolanaStore = useMangoStore((s) => s.set)

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
  }, [connection])

  useEffect(() => {
    const id = connection.onSlotChange(() => null)
    return () => {
      connection.removeSlotChangeListener(id)
    }
  }, [connection])

  const programId = IDS[cluster].mango_program_id
  const dexProgramId = IDS[cluster]?.dex_program_id

  return { connection, dexProgramId, cluster, programId, sendConnection }
}

export default useConnection
