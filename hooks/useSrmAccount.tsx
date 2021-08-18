import { useState } from 'react'
import useMangoStore, { DEFAULT_CONNECTION } from '../stores/useMangoStore'
import { nativeToUi } from '@blockworks-foundation/mango-client'
import { SRM_DECIMALS } from '@project-serum/serum/lib/token-instructions'
import { getFeeTier, getFeeRates } from '@project-serum/serum'
import { parseTokenAccountData } from '../utils/tokens'
import { useEffect } from 'react'

const useSrmAccount = () => {
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const [srmAccount, setSrmAccount] = useState(null)
  // const [msrmAccount, setMsrmAccount] = useState(null)

  useEffect(() => {
    if (mangoGroup) {
      const srmPk = mangoGroup.srmVault
      const fetchAccounts = async () => {
        const srmAccountInfo = await DEFAULT_CONNECTION.getAccountInfo(srmPk)

        setSrmAccount(srmAccountInfo)
      }

      fetchAccounts()
    }
  }, [mangoGroup])

  const accountData = srmAccount
    ? parseTokenAccountData(srmAccount?.data)
    : null
  const totalSrm = accountData
    ? nativeToUi(accountData.amount, SRM_DECIMALS)
    : 0
  const feeTier = getFeeTier(0, totalSrm)
  const { maker, taker } = getFeeRates(feeTier)

  // mul taker by 0.8 to account for GUI rebate
  return { totalSrm, feeTier, rates: { maker, taker: taker * 0.8 } }
}

export default useSrmAccount
