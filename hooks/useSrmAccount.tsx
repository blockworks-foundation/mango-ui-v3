import useMangoStore from '../stores/useMangoStore'
import { PublicKey } from '@solana/web3.js'
import { ACCOUNT_LAYOUT, nativeToUi } from '@blockworks-foundation/mango-client'
import { SRM_DECIMALS } from '@project-serum/serum/lib/token-instructions'
import { getFeeTier, getFeeRates } from '@project-serum/serum'

function parseTokenAccountData(
  data: Buffer
): { mint: PublicKey; owner: PublicKey; amount: number } {
  const { mint, owner, amount } = ACCOUNT_LAYOUT.decode(data)
  return {
    mint: new PublicKey(mint),
    owner: new PublicKey(owner),
    amount,
  }
}

const useSrmAccount = () => {
  const srmAccount = useMangoStore((s) => s.selectedMangoGroup.srmAccount)

  const accountData = parseTokenAccountData(srmAccount.data)
  const totalSrm = nativeToUi(accountData.amount, SRM_DECIMALS)
  const feeTier = getFeeTier(0, totalSrm)
  const rates = getFeeRates(feeTier)

  return { totalSrm, feeTier, rates }
}

export default useSrmAccount
