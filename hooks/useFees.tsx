import {
  CENTIBPS_PER_UNIT,
  getMarketIndexBySymbol,
  PerpMarket,
} from '@blockworks-foundation/mango-client'
import useSrmAccount from '../hooks/useSrmAccount'
import useMangoStore from '../stores/useMangoStore'

export default function useFees(): { makerFee: number; takerFee: number } {
  const { rates } = useSrmAccount()
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoGroupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const market = useMangoStore((s) => s.selectedMarket.current)
  const marketIndex = getMarketIndexBySymbol(
    mangoGroupConfig,
    marketConfig.baseSymbol
  )

  if (!mangoGroup) return { makerFee: 0, takerFee: 0 }

  let takerFee: number, makerFee: number
  if (market instanceof PerpMarket) {
    takerFee = parseFloat(
      mangoGroup.perpMarkets[marketIndex].takerFee.toFixed()
    )
    makerFee = parseFloat(
      mangoGroup.perpMarkets[marketIndex].makerFee.toFixed()
    )
  } else {
    takerFee = rates.takerWithRebate
    makerFee = rates.maker
  }

  // @ts-ignore
  const refSurcharge = mangoGroup.refSurchargeCentibps / CENTIBPS_PER_UNIT

  return {
    makerFee: makerFee,
    takerFee: takerFee + refSurcharge,
  }
}
