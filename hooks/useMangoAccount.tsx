import useMangoStore from '../stores/useMangoStore'
import { MangoAccount } from '@blockworks-foundation/mango-client'

export default function useMangoAccount(): MangoAccount {
  const mangoAccount = useMangoStore(
    (state) => state.selectedMangoAccount.current,
    () => false
  )

  return mangoAccount
}
