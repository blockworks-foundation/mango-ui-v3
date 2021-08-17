import {
  getMarketIndexBySymbol,
  PerpMarket,
} from '@blockworks-foundation/mango-client'
import useSrmAccount from '../hooks/useSrmAccount'
import useMangoStore from '../stores/useMangoStore'

export default function MarketFee() {
  const { rates } = useSrmAccount()
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoGroupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const market = useMangoStore((s) => s.selectedMarket.current)
  const marketIndex = getMarketIndexBySymbol(
    mangoGroupConfig,
    marketConfig.baseSymbol
  )

  let takerFee, makerFee
  if (market instanceof PerpMarket) {
    takerFee =
      parseFloat(mangoGroup.perpMarkets[marketIndex].takerFee.toFixed()) * 100
    makerFee =
      parseFloat(mangoGroup.perpMarkets[marketIndex].makerFee.toFixed()) * 100
  } else {
    takerFee = rates.taker * 100
    makerFee = rates.maker * 100
  }

  return (
    <div className="flex mx-auto">
      <>
        <div>Maker Fee: {makerFee}%</div>
        <div className="px-2">|</div>
        <div>Taker Fee: {takerFee}%</div>
      </>
    </div>
  )
}
