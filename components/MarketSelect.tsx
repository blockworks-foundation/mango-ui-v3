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
    <div className="bg-th-bkg-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center py-2 px-4 md:px-10">
          {Object.entries(spotMarkets).map(([name, address]) => (
            <div
              className={`flex px-2 py-1 mr-2 rounded-md cursor-pointer default-transition bg-th-bkg-2
              ${
                selectedMarketName === name
                  ? `text-th-primary`
                  : `text-th-fgd-1 opacity-50 hover:opacity-100`
              }
            `}
              onClick={() => handleChange(name)}
              key={address as string}
            >
              <div className="pr-1">{name.split('/')[0]}</div>
              <span className="text-th-fgd-4">/</span>
              <div className="pl-1">{name.split('/')[1]}</div>
            </div>
          ))}
        </div>
        <div className="mr-10 text-xs">
          <a
            href="https://old.mango.markets"
            className="text-th-fgd-4 default-transition underline hover:text-th-primary hover:no-underline"
          >
            Use Previous Version
          </a>
        </div>
      </div>
    </div>
  )
}

export default MarketSelect
