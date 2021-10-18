import { useState } from 'react'
import useMangoStore from '../stores/useMangoStore'
import {
  getMultipleAccounts,
  nativeToUi,
} from '@blockworks-foundation/mango-client'
import {
  MSRM_DECIMALS,
  SRM_DECIMALS,
} from '@project-serum/serum/lib/token-instructions'
import { getFeeTier, getFeeRates } from '@project-serum/serum'
import { parseTokenAccountData } from '../utils/tokens'
import { useEffect } from 'react'

const useSrmAccount = () => {
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const connection = useMangoStore((s) => s.connection.current)
  const [srmAccount, setSrmAccount] = useState(null)
  const [msrmAccount, setMsrmAccount] = useState(null)

  useEffect(() => {
    if (mangoGroup) {
      const srmPk = mangoGroup.srmVault
      const msrmPk = mangoGroup.msrmVault

      const fetchAccounts = async () => {
        const [srmAccountInfo, msrmAccountInfo] = await getMultipleAccounts(
          connection,
          [srmPk, msrmPk]
        )

        setSrmAccount(srmAccountInfo.accountInfo)
        setMsrmAccount(msrmAccountInfo.accountInfo)
      }

      fetchAccounts()
    }
  }, [mangoGroup])

  const srmAccountData = srmAccount
    ? parseTokenAccountData(srmAccount?.data)
    : null
  const totalSrm = srmAccountData
    ? nativeToUi(srmAccountData.amount, SRM_DECIMALS)
    : 0
  const msrmAccountData = msrmAccount
    ? parseTokenAccountData(msrmAccount?.data)
    : null
  const totalMsrm = msrmAccountData
    ? nativeToUi(msrmAccountData.amount, MSRM_DECIMALS)
    : 0
  const feeTier = getFeeTier(totalMsrm, totalSrm)

  const { maker, taker } = getFeeRates(feeTier)

  // account for GUI rebate in taker fees
  return {
    totalSrm,
    totalMsrm,
    feeTier,
    rates: { maker, taker, takerWithRebate: taker - (taker + maker) * 0.2 },
  }
}

export default useSrmAccount
