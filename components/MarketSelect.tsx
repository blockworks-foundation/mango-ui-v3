import useMarketList from '../hooks/useMarketList'
import useMangoStore from '../stores/useMangoStore'

const MarketSelect = () => {
  const { spotMarkets } = useMarketList()
  const selectedMarketName = useMangoStore((s) => s.selectedMarket.name)
  const selectedMangoGroupMarkets = useMangoStore(
    (s) => s.selectedMangoGroup.markets
  )
  const setMangoStore = useMangoStore((s) => s.set)

  const handleChange = (mktName) => {
    const newMarket = Object.entries(selectedMangoGroupMarkets).find(
      (m) => m[0] == spotMarkets[mktName]
    )[1]
    setMangoStore((state) => {
      state.selectedMarket.current = newMarket
      state.selectedMarket.name = mktName
      state.selectedMarket.address = spotMarkets[mktName]
    })
  }

  return (
    <div className="bg-th-bkg-3 py-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center px-4 md:px-10">
          <div className="border-r border-th-fgd-4 pr-4 text-th-fgd-4 text-xs">
            MARKETS
          </div>
          {Object.entries(spotMarkets).map(([name, address]) => (
            <div
              className={`border-r border-th-fgd-4 cursor-pointer default-transition flex font-semibold px-4 text-xs hover:text-th-primary
              ${
                selectedMarketName === name
                  ? `text-th-primary`
                  : `text-th-fgd-3`
              }
            `}
              onClick={() => handleChange(name)}
              key={address as string}
            >
              {name.split('/')[0]}
            </div>
          ))}
        </div>
        <div className="mr-10 text-xs">
          <a
            href="https://old.mango.markets"
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
