import useFees from '../hooks/useFees'
import { percentFormat } from '../utils'

export default function MarketFee() {
  const { takerFee, makerFee } = useFees()

  return (
    <div className="flex text-xs text-th-fgd-4 px-6 mt-2.5">
      <div className="block sm:flex mx-auto text-center">
        <div>Maker Fee: {percentFormat.format(makerFee)}</div>
        <div className="hidden sm:block px-2">|</div>
        <div>Taker Fee: {percentFormat.format(takerFee)}</div>
      </div>
    </div>
  )
}
