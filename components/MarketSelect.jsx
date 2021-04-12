// import { Listbox, Transition } from '@headlessui/react'
// import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/solid'
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
      {/*<div className={`opacity-50 p-2`}>Markets</div>*/}
      <div
        className={`flex items-center py-2 px-3 sm:px-8 divide-x divide-th-fgd-4 `}
      >
        {Object.entries(spotMarkets).map(([name, address]) => (
          <div
            className={`px-3 py-1 cursor-pointer text-sm font-normal
              ${
                selectedMarket.name === name
                  ? `text-th-primary`
                  : `text-th-fgd-3 hover:text-th-fgd-1`
              }
            `}
            onClick={() => handleChange(name)}
            key={address}
          >
            {name}
          </div>
        ))}
      </div>
      {/*<Listbox value={selectedMarket.name} onChange={handleChange}>
        {({ open }) => (
          <>
            <Listbox.Button
              className={`border border-mango-dark-lighter focus:outline-none focus:ring-1 focus:ring-mango-yellow p-2 w-56`}
            >
              <div
                className={`flex items-center text-lg justify-between font-light`}
              >
                {selectedMarket.name}
                {open ? (
                  <ChevronUpIcon className={`h-5 w-5 mr-1`} />
                ) : (
                  <ChevronDownIcon className={`h-5 w-5 mr-1`} />
                )}
              </div>
            </Listbox.Button>
            <Transition
              show={open}
              enter="transition duration-100 ease-out"
              enterFrom="transform scale-95 opacity-0"
              enterTo="transform scale-100 opacity-100"
              leave="transition duration-75 ease-out"
              leaveFrom="transform scale-100 opacity-100"
              leaveTo="transform scale-95 opacity-0"
            >
              <Listbox.Options
                static
                className={`z-20 p-1 absolute left-0 w-56 mt-1 bg-mango-dark-light origin-top-left divide-y divide-mango-dark-lighter shadow-lg outline-none`}
              >
                <div className={`opacity-50 p-2`}>Markets</div>
                {Object.entries(spotMarkets).map(([name, address]) => (
                  <Listbox.Option key={address} value={name}>
                    {({ selected }) => (
                      <div
                        className={`p-2 text-base hover:bg-mango-dark-lighter hover:cursor-pointer tracking-wider font-light
                          ${selected && `text-mango-yellow bg-mango-dark-lighter`}
                        `}
                      >
                        {name}
                      </div>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </>
        )}
                      </Listbox>*/}
    </div>
  )
}

export default MarketSelect
