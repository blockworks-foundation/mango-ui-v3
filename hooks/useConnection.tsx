import { useEffect, useMemo } from 'react'
import { Account, Connection } from '@solana/web3.js'
import { IDS } from '@blockworks-foundation/mango-client'
import { EndpointInfo } from '../@types/types'
import useStore from './useStore'

export const ENDPOINTS: EndpointInfo[] = [
  {
    name: 'mainnet-beta',
    endpoint: 'https://solana-api.projectserum.com',
    custom: false,
  },
  {
    name: 'devnet',
    endpoint: 'https://devnet.solana.com',
    custom: false,
  },
]

const cluster = 'mainnet-beta'

const useConnection = () => {
  const setConnection = useStore((state) => state.connection.setConnection)
  const { endpoint } = ENDPOINTS.find((e) => e.name === cluster)
  const connection = useMemo(() => new Connection(endpoint, 'recent'), [
    endpoint,
  ])

  useEffect(() => {
    setConnection(connection)
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

  return { connection, dexProgramId, cluster, programId }
}

export default useConnection
