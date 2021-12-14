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
import { parseTokenAccountData } from '../utils/tokens'
import { useEffect } from 'react'

export function getFeeRates(feeTier: number): { taker: number; maker: number } {
  if (feeTier === 1) {
    return { taker: 0.00039, maker: 0 }
  } else if (feeTier === 2) {
    return { taker: 0.00038, maker: 0 }
  } else if (feeTier === 3) {
    return { taker: 0.00036, maker: 0 }
  } else if (feeTier === 4) {
    return { taker: 0.00034, maker: 0 }
  } else if (feeTier === 5) {
    return { taker: 0.00032, maker: 0 }
  } else if (feeTier === 6) {
    // MSRM
    return { taker: 0.0003, maker: 0 }
  }
  // Base
  return { taker: 0.0004, maker: 0 }
}

export function getFeeTier(msrmBalance: number, srmBalance: number): number {
  if (msrmBalance >= 1) {
    return 6
  } else if (srmBalance >= 1_000_000) {
    return 5
  } else if (srmBalance >= 100_000) {
    return 4
  } else if (srmBalance >= 10_000) {
    return 3
  } else if (srmBalance >= 1_000) {
    return 2
  } else if (srmBalance >= 100) {
    return 1
  } else {
    return 0
  }
}

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
