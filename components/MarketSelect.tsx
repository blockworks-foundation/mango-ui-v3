import { useState } from 'react'
import styled from '@emotion/styled'
import { RadioGroup } from '@headlessui/react'
import useLocalStorageState from '../hooks/useLocalStorageState'
import useMangoGroupConfig from '../hooks/useMangoGroupConfig'
import useMangoStore from '../stores/useMangoStore'
import { getMarketByBaseSymbolAndKind } from '@blockworks-foundation/mango-client'

const StyledMarketTypeToggleWrapper = styled.div`
  background: rgba(255, 255, 255, 0.12);
`

const StyledArrow = styled.div`
  width: 0;
  height: 0;
  border-top: 20px solid transparent;
  border-bottom: 20px solid transparent;
  border-left: 20px solid rgba(255, 255, 255, 0.12);
`

const MarketSelect = () => {
  // const [lastViewedMarket, setLastViewedMarket] = useLocalStorageState(
  //   'lastViewedMarket',
  //   { baseSymbol: 'BTC', kind: 'spot' }
  // )
  const [marketType, setMarketType] = useState('spot')
  const groupConfig = useMangoGroupConfig()
  const selectedMarket = useMangoStore((s) => s.selectedMarket.config)
  const setMangoStore = useMangoStore((s) => s.set)

  const handleChange = (symbol, kind) => {
    const newMarket = getMarketByBaseSymbolAndKind(groupConfig, symbol, kind)
    setMangoStore((state) => {
      state.selectedMarket.current = null
      state.selectedMarket.config = newMarket
    })
    // setLastViewedMarket({ baseSymbol: symbol, kind: kind })
  }

  const markets =
    marketType === 'perp' ? groupConfig.perpMarkets : groupConfig.spotMarkets

  return (
    <div className="bg-th-bkg-3 flex h-10">
      <StyledMarketTypeToggleWrapper className="flex items-center pl-6 md:pl-9 pr-1">
        <RadioGroup
          value={marketType}
          onChange={(t) => setMarketType(t)}
          className="flex font-bold rounded-md text-xs w-30"
        >
          <RadioGroup.Option value="spot" className="flex-1 focus:outline-none">
            {({ checked }) => (
              <button
                className={`${
                  checked
                    ? 'bg-th-primary text-th-bkg-1'
                    : 'bg-th-bkg-2 hover:bg-th-bkg-1'
                } rounded-r-none text-th-fgd-3 text-center py-1 px-2.5 h-full w-full focus:outline-none`}
              >
                Spot
              </button>
            )}
          </RadioGroup.Option>
          <RadioGroup.Option value="perp" className="flex-1 focus:outline-none">
            {({ checked }) => (
              <button
                className={`${
                  checked
                    ? 'bg-th-primary text-th-bkg-1'
                    : 'bg-th-bkg-2 hover:bg-th-bkg-1'
                } rounded-l-none text-th-fgd-3 text-center py-1 px-2.5 h-full w-full focus:outline-none`}
              >
                Perp
              </button>
            )}
          </RadioGroup.Option>
        </RadioGroup>
      </StyledMarketTypeToggleWrapper>
      <StyledArrow />
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center">
          {markets.map((s) => (
            <div
              className={`cursor-pointer default-transition flex font-bold px-4 text-xs hover:text-th-primary
              ${
                selectedMarket.name === s.name
                  ? `text-th-primary`
                  : `text-th-fgd-3`
              }
            `}
              onClick={() => handleChange(s.baseSymbol, marketType)}
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
