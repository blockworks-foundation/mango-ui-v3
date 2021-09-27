import { useMemo } from 'react'
import useMangoStore from '../stores/useMangoStore'
import { Config } from '@blockworks-foundation/mango-client'
import { GroupConfig } from '@blockworks-foundation/mango-client/lib/src/config'

export default function useMangoGroupConfig(): GroupConfig {
  const mangoGroupName = useMangoStore((state) => state.selectedMangoGroup.name)
  const cluster = useMangoStore((s) => s.connection.cluster)

  const mangoGroupConfig = useMemo(
    () => Config.ids().getGroup(cluster, mangoGroupName),
    [cluster, mangoGroupName]
  )

  return mangoGroupConfig
}
