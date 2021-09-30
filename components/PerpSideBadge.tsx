import { PerpAccount, ZERO_BN } from '@blockworks-foundation/mango-client'
import SideBadge from './SideBadge'

const PerpSideBadge = ({ perpAccount }: { perpAccount: PerpAccount }) => (
  <>
    {perpAccount && !perpAccount.basePosition.eq(ZERO_BN) ? (
      <SideBadge
        side={perpAccount.basePosition.gt(ZERO_BN) ? 'long' : 'short'}
      />
    ) : (
      '--'
    )}
  </>
)

export default PerpSideBadge
