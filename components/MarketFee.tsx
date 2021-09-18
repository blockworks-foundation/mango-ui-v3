import {
  getMarketIndexBySymbol,
  PerpMarket,
} from '@blockworks-foundation/mango-client'
import useSrmAccount from '../hooks/useSrmAccount'
import useMangoStore from '../stores/useMangoStore'
import { percentFormat } from '../utils'

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
    takerFee = parseFloat(
      mangoGroup.perpMarkets[marketIndex].takerFee.toFixed()
    )
    makerFee = parseFloat(
      mangoGroup.perpMarkets[marketIndex].makerFee.toFixed()
    )
  } else {
    takerFee = rates.taker
    makerFee = rates.maker
  }

  return (
    <div className="block sm:flex mx-auto text-center">
      <>
        <div>Maker Fee: {percentFormat.format(makerFee)}</div>
        <div className="hidden sm:block px-2">|</div>
        <div>Taker Fee: {percentFormat.format(takerFee)}</div>
      </>
    </div>
  )
}
