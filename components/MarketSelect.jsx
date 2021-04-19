import useMarketList from '../hooks/useMarketList'
import useMangoStore from '../stores/useMangoStore'

const MarketSelect = () => {
  const { spotMarkets } = useMarketList()
  const selectedMarket = useMangoStore((s) => s.selectedMarket)
  const setMangoStore = useMangoStore((s) => s.set)

  const handleChange = (mktName) => {
    setMangoStore((state) => {
      state.selectedMarket = { name: mktName, address: spotMarkets[mktName] }
    })
  }

  return (
    <div className={`bg-th-bkg-3`}>
      <div className={`flex items-center py-2 px-4 sm:px-10`}>
        {/* <div className="text-xs text-th-fgd-4 font-semibold mr-2">MARKETS</div> */}
        {Object.entries(spotMarkets).map(([name, address]) => (
          <div
            className={`px-2 py-1 mr-2 rounded-md cursor-pointer default-transition bg-th-bkg-2
              ${
                selectedMarket.name === name
                  ? `text-th-primary`
                  : `text-th-fgd-1 opacity-50 hover:opacity-100`
              }
            `}
            onClick={() => handleChange(name)}
            key={address}
          >
            {name.split('/')[0]}
          </div>
        ))}
      </div>
    </div>
  )
}

export default MarketSelect
