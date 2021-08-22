import useMangoStore from '../stores/useMangoStore'
import { ZERO_I80F48 } from '@blockworks-foundation/mango-client'
import BN from 'bn.js'

const usePerpPositions = () => {
  const groupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)

  const perpAccounts = mangoAccount
    ? groupConfig.perpMarkets.map((m) => {
        return {
          perpAccount: mangoAccount.perpAccounts[m.marketIndex],
          marketIndex: m.marketIndex,
        }
      })
    : []
  const filteredPerpAccounts = perpAccounts.filter(
    ({ perpAccount }) =>
      !(
        perpAccount.quotePosition.eq(ZERO_I80F48) &&
        perpAccount.basePosition.eq(new BN(0))
      )
  )

  return filteredPerpAccounts
}

export default usePerpPositions
