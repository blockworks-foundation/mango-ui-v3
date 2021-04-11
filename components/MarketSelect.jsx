import xw from 'xwind'
import styled from '@emotion/styled'
import { Listbox, Transition } from '@headlessui/react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/solid'
import useMarketList from '../hooks/useMarketList'
// import useMarket from '../hooks/useMarket'
import useMangoStore from '../stores/useMangoStore'

const StyledDiv = styled.div`
  cursor: pointer;
`

const MarketSelect = () => {
  const { spotMarkets } = useMarketList()
  const selectedMarket = useMangoStore((s) => s.selectedMarket)
  const setMangoStore = useMangoStore((s) => s.set)

  const handleChange = (mktName) => {
    setMangoStore((state) => {
      state.selectedMarket = { name: mktName, address: spotMarkets[mktName] }
    })
  }

  console.log(selectedMarket)

  return (
    <div
      css={xw`relative flex items-center py-2 px-3 sm:px-6 divide-x divide-mango-grey-light dark:divide-mango-grey-dark bg-mango-grey-lighter dark:bg-mango-grey-darkest`}
    >
      {/*<div css={xw`opacity-50 p-2`}>Markets</div>*/}
      {Object.entries(spotMarkets).map(([name, address]) => (
        <StyledDiv
          css={
            selectedMarket.name === name
              ? xw`px-3 py-1 text-mango-orange text-xs font-normal`
              : xw`px-3 py-1 text-gray-400 hover:text-gray-600 dark:hover:text-white text-xs font-normal`
          }
          onClick={() => handleChange(name)}
          key={address}
        >
          {name}
        </StyledDiv>
      ))}
      {/*<Listbox value={selectedMarket.name} onChange={handleChange}>
        {({ open }) => (
          <>
            <Listbox.Button
              css={xw`border border-mango-dark-lighter focus:outline-none focus:ring-1 focus:ring-mango-yellow p-2 w-56`}
            >
              <div
                css={xw`flex items-center text-lg justify-between font-light`}
              >
                {selectedMarket.name}
                {open ? (
                  <ChevronUpIcon css={xw`h-5 w-5 mr-1`} />
                ) : (
                  <ChevronDownIcon css={xw`h-5 w-5 mr-1`} />
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
                css={xw`z-20 p-1 absolute left-0 w-56 mt-1 bg-mango-dark-light origin-top-left divide-y divide-mango-dark-lighter shadow-lg outline-none`}
              >
                <div css={xw`opacity-50 p-2`}>Markets</div>
                {Object.entries(spotMarkets).map(([name, address]) => (
                  <Listbox.Option key={address} value={name}>
                    {({ selected }) => (
                      <div
                        css={[
                          xw`p-2 text-base hover:bg-mango-dark-lighter hover:cursor-pointer tracking-wider font-light`,
                          selected &&
                            xw`text-mango-yellow bg-mango-dark-lighter`,
                        ]}
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
