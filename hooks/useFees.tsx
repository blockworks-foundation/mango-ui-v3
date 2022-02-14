import {
  CENTIBPS_PER_UNIT,
  getMarketIndexBySymbol,
  getSpotMarketByBaseSymbol,
  PerpMarket,
} from '@blockworks-foundation/mango-client'
import useSrmAccount from '../hooks/useSrmAccount'
import { mangoGroupConfigSelector } from '../stores/selectors'
import useMangoStore from '../stores/useMangoStore'

export default function useFees(): { makerFee: number; takerFee: number } {
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

  if (!mangoGroup || !market) return { makerFee: 0, takerFee: 0 }

  let takerFee: number, makerFee: number
  let discount = 0
  let refSurcharge = 0

  if (market instanceof PerpMarket) {
    takerFee = parseFloat(
      mangoGroup.perpMarkets[marketIndex].takerFee.toFixed()
    )
    makerFee = parseFloat(
      mangoGroup.perpMarkets[marketIndex].makerFee.toFixed()
    )
    // @ts-ignore
    refSurcharge = mangoGroup.refSurchargeCentibps / CENTIBPS_PER_UNIT
    // @ts-ignore
    const refShare = mangoGroup.refShareCentibps / CENTIBPS_PER_UNIT

    const mngoConfig = getSpotMarketByBaseSymbol(groupConfig, 'MNGO')
    const mngoRequired =
      mangoGroup.refMngoRequired.toNumber() /
      Math.pow(10, mngoConfig.baseDecimals)

    if (mangoAccount) {
      const mngoBalance = mangoAccount
        .getUiDeposit(
          mangoCache.rootBankCache[mngoConfig.marketIndex],
          mangoGroup,
          mngoConfig.marketIndex
        )
        .toNumber()

      const hasReferrer = useMangoStore.getState().referrerPk

      if (mngoBalance >= mngoRequired) {
        discount = refSurcharge
      } else {
        discount = hasReferrer ? refSurcharge - refShare : 0
      }
    }
  } else {
    takerFee = rates.takerWithRebate
    makerFee = rates.maker
  }

  return {
    makerFee: makerFee,
    takerFee: takerFee + refSurcharge - discount,
  }
}
