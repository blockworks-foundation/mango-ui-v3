import useMangoStore from '../stores/useMangoStore'
import { MangoAccount } from '@blockworks-foundation/mango-client'
import shallow from 'zustand/shallow'

export default function useMangoAccount(): {
  mangoAccount: MangoAccount
  initialLoad: boolean
} {
  const { mangoAccount, initialLoad } = useMangoStore(
    (state) => ({
      mangoAccount: state.selectedMangoAccount.current,
      lastUpdatedAt: state.selectedMangoAccount.lastUpdatedAt,
      initialLoad: state.selectedMangoAccount.initialLoad,
    }),
    shallow
  )

  return { mangoAccount, initialLoad }
}
