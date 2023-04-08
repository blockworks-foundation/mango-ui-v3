import {
  CENTIBPS_PER_UNIT,
  getMarketIndexBySymbol,
  getSpotMarketByBaseSymbol,
  PerpMarket,
} from '@blockworks-foundation/mango-client'
import useSrmAccount from '../hooks/useSrmAccount'
import { mangoGroupConfigSelector } from '../stores/selectors'
import useMangoStore from '../stores/useMangoStore'

export default function useFees(): {
  makerFee: number
  takerFee: number
  takerFeeBeforeDiscount: number
  takerFeeWithTier1Discount: number
  takerFeeWithTier2Discount: number
} {
  const { rates } = useSrmAccount()
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoGroupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const market = useMangoStore((s) => s.selectedMarket.current)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const groupConfig = useMangoStore(mangoGroupConfigSelector)

  const marketIndex = getMarketIndexBySymbol(
    mangoGroupConfig,
    marketConfig.baseSymbol
  )

  if (!mangoGroup || !market)
    return {
      makerFee: 0,
      takerFee: 0,
      takerFeeBeforeDiscount: 0,
      takerFeeWithTier1Discount: 0,
      takerFeeWithTier2Discount: 0,
    }

  let takerFee: number, makerFee: number
  let discount = 0
  let refSurchargeTier1 = 0
  let refSurchargeTier2 = 0

  if (market instanceof PerpMarket) {
    takerFee = parseFloat(
      mangoGroup.perpMarkets[marketIndex].takerFee.toFixed()
    )
    makerFee = parseFloat(
      mangoGroup.perpMarkets[marketIndex].makerFee.toFixed()
    )
    // @ts-ignore
    refSurchargeTier1 = mangoGroup.refSurchargeCentibpsTier1 / CENTIBPS_PER_UNIT
    // @ts-ignore
    refSurchargeTier2 = mangoGroup.refSurchargeCentibpsTier2 / CENTIBPS_PER_UNIT
    // @ts-ignore
    const refShare = mangoGroup.refShareCentibpsTier1 / CENTIBPS_PER_UNIT

    const mngoConfig = getSpotMarketByBaseSymbol(groupConfig, 'MNGO')
    const mngoRequiredTier1 = mngoConfig
      ? mangoGroup.refMngoRequired.toNumber() /
        Math.pow(10, mngoConfig.baseDecimals)
      : null
    const refMngoTier2Factor =
      // @ts-ignore
      mangoGroup.refMngoTier2Factor == 0 ? 1 : mangoGroup.refMngoTier2Factor
    const mngoRequiredTier2 = mngoConfig
      ? (mangoGroup.refMngoRequired.toNumber() * refMngoTier2Factor) /
        Math.pow(10, mngoConfig.baseDecimals)
      : null

    if (mangoAccount && mangoCache && mngoConfig) {
      const mngoBalance = mangoAccount
        .getUiDeposit(
          mangoCache.rootBankCache[mngoConfig.marketIndex],
          mangoGroup,
          mngoConfig.marketIndex
        )
        .toNumber()

      const hasReferrer = useMangoStore.getState().referrerPk

      if (
        typeof mngoRequiredTier1 === 'number' &&
        mngoBalance >= mngoRequiredTier1
      ) {
        if (
          typeof mngoRequiredTier2 === 'number' &&
          mngoBalance >= mngoRequiredTier2
        ) {
          discount = refSurchargeTier2
        } else {
          discount = refSurchargeTier1
        }
      } else {
        discount = hasReferrer ? refSurchargeTier2 - refShare : 0
      }
    }
  } else {
    takerFee = rates.takerWithRebate
    makerFee = rates.maker
  }

  return {
    makerFee: makerFee,
    takerFee: takerFee + refSurchargeTier2 - discount,
    takerFeeBeforeDiscount: takerFee + refSurchargeTier2,
    takerFeeWithTier1Discount: takerFee + refSurchargeTier1,
    takerFeeWithTier2Discount: takerFee,
  }
}
