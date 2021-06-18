import useMangoGroupConfig from '../hooks/useMangoGroupConfig'
import useMangoStore from '../stores/useMangoStore'
import { getMarketByBaseSymbolAndKind } from '@blockworks-foundation/mango-client'

const MarketSelect = () => {
  const groupConfig = useMangoGroupConfig()
  const selectedMarket = useMangoStore((s) => s.selectedMarket.config)
  const setMangoStore = useMangoStore((s) => s.set)

  const handleChange = (symbol, kind) => {
    const newMarket = getMarketByBaseSymbolAndKind(groupConfig, symbol, kind)
    setMangoStore((state) => {
      state.selectedMarket.current = null
      state.selectedMarket.config = newMarket
    })
  }

  return (
    <div className="bg-th-bkg-3 py-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center px-4 md:px-10">
          <div className="border-r border-th-fgd-4 pr-4 text-th-fgd-4 text-xs">
            MARKETS
          </div>
          {groupConfig.perpMarkets.map((s) => (
            <div
              className={`border-r border-th-fgd-4 cursor-pointer default-transition flex font-semibold px-4 text-xs hover:text-th-primary
              ${
                selectedMarket.name === s.name
                  ? `text-th-primary`
                  : `text-th-fgd-3`
              }
            `}
              onClick={() => handleChange(s.baseSymbol, 'perp')}
              key={s.publicKey.toBase58()}
            >
              {s.name}
            </div>
          ))}

          {groupConfig.spotMarkets.map((s) => (
            <div
              className={`border-r border-th-fgd-4 cursor-pointer default-transition flex font-semibold px-4 text-xs hover:text-th-primary
              ${
                selectedMarket.name === s.name
                  ? `text-th-primary`
                  : `text-th-fgd-3`
              }
            `}
              onClick={() => handleChange(s.baseSymbol, 'spot')}
              key={s.publicKey.toBase58()}
            >
              {s.name}
            </div>
          ))}
        </div>
        <div className="mr-10 text-xs">
          <a
            href="https://usdt.mango.markets"
            className="text-primary default-transition underline hover:text-th-primary hover:no-underline border-1"
          >
            Go to Mango V1
          </a>
        </div>
      </div>
    </div>
  )
}

export default MarketSelect
