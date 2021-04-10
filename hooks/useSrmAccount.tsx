import useMangoStore from '../stores/useMangoStore'
import { nativeToUi } from '@blockworks-foundation/mango-client'
import { SRM_DECIMALS } from '@project-serum/serum/lib/token-instructions'
import { getFeeTier, getFeeRates } from '@project-serum/serum'
import { parseTokenAccountData } from '../utils/tokens'

const useSrmAccount = () => {
  const srmAccount = useMangoStore((s) => s.selectedMangoGroup.srmAccount)

  const accountData = parseTokenAccountData(srmAccount.data)
  const totalSrm = nativeToUi(accountData.amount, SRM_DECIMALS)
  const feeTier = getFeeTier(0, totalSrm)
  const rates = getFeeRates(feeTier)

  return { totalSrm, feeTier, rates }
}

export default useSrmAccount
