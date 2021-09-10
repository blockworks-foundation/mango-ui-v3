import React from 'react'
import Link from 'next/link'
import { EyeIcon, EyeOffIcon } from '@heroicons/react/outline'
import { ChevronRightIcon } from '@heroicons/react/solid'
import Modal from './Modal'
import useLocalStorageState from '../hooks/useLocalStorageState'
import useMangoStore from '../stores/useMangoStore'
import { formatUsdValue } from '../utils'
import { LinkButton } from './Button'

const MarketsModal = ({
  isOpen,
  markets,
  onClose,
}: {
  isOpen: boolean
  markets: Array<any>
  onClose?: (x?) => void
}) => {
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const [hiddenMarkets, setHiddenMarkets] = useLocalStorageState(
    'hiddenMarkets',
    []
  )

  const handleHideShowMarket = (asset) => {
    if (hiddenMarkets.includes(asset)) {
      setHiddenMarkets(hiddenMarkets.filter((m) => m !== asset))
    } else {
      setHiddenMarkets(hiddenMarkets.concat(asset))
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex items-end justify-between pb-3 pt-2">
        <div className="font-bold text-lg text-th-fgd-1">Markets</div>
        {hiddenMarkets.length === 0 ? (
          <LinkButton
            className="font-normal hidden sm:block mb-0.5 text-th-fgd-3 text-xs disabled:cursor-not-allowed disabled:no-underline disabled:text-th-fgd-4"
            // disabled={hiddenMarkets.length === 0}
            onClick={() =>
              setHiddenMarkets(markets.map((mkt) => mkt.baseAsset))
            }
          >
            Hide all from Nav
          </LinkButton>
        ) : (
          <LinkButton
            className="font-normal hidden sm:block mb-0.5 text-th-fgd-3 text-xs disabled:cursor-not-allowed disabled:no-underline disabled:text-th-fgd-4"
            // disabled={hiddenMarkets.length === 0}
            onClick={() => setHiddenMarkets([])}
          >
            Show all in Nav
          </LinkButton>
        )}
      </div>
      {markets.map((mkt, index) => (
        <div key={mkt.baseAsset}>
          <div className="bg-th-bkg-3 flex items-center justify-between px-2.5 py-2">
            <div className="flex items-center">
              <img
                alt=""
                src={`/assets/icons/${mkt.baseAsset.toLowerCase()}.svg`}
                className={`h-5 mr-2.5 w-auto`}
              />
              <span className="text-th-fgd-2">{mkt.baseAsset}</span>
            </div>
            <div className="hidden sm:flex">
              {hiddenMarkets.includes(mkt.baseAsset) ? (
                <EyeOffIcon
                  className="cursor-pointer default-transition h-4 text-th-fgd-4 w-4 hover:text-th-fgd-3"
                  onClick={() => handleHideShowMarket(mkt.baseAsset)}
                />
              ) : (
                <EyeIcon
                  className="cursor-pointer default-transition h-4 text-th-primary w-4 hover:text-th-primary-dark"
                  onClick={() => handleHideShowMarket(mkt.baseAsset)}
                />
              )}
            </div>
          </div>
          {/* <div className="bg-[rgba(255,255,255,0.1)] flex items-center justify-between px-2.5 py-0.5 text-th-fgd-3">
            <StyledColumnHeader>Markets</StyledColumnHeader>
            <div className="flex justify-between">
              <StyledColumnHeader className="pr-5 text-right w-20">
                Price
              </StyledColumnHeader>
              <StyledColumnHeader className="text-right w-20">
                24h Change
              </StyledColumnHeader>
              <StyledColumnHeader className="text-right w-20">
                24h Vol
              </StyledColumnHeader>
            </div>
          </div> */}
          <div className="divide-y divide-th-bkg-4">
            {mkt.markets.map((m) => (
              <div
                className={`flex items-center justify-between px-2.5 text-xs`}
                key={m.name}
              >
                <Link
                  href={`/${
                    m.name.slice(-4) === 'PERP' ? 'perp' : 'spot'
                  }/${m.name.slice(0, -5)}`}
                  key={m.name}
                >
                  <a
                    className="cursor-pointer default-transition flex h-12 items-center justify-between text-th-fgd-2 hover:text-th-primary w-full"
                    onClick={onClose}
                  >
                    {m.name}
                    <div className="flex items-center">
                      <span className="text-right w-20">
                        {formatUsdValue(mangoGroup.getPrice(index, mangoCache))}
                      </span>
                      {/* <span className="text-th-green text-right w-20">
                        +2.44%
                      </span>
                      <span className="text-th-fgd-3 text-right w-20">
                        $233m
                      </span> */}
                      <ChevronRightIcon className="h-4 ml-1 w-5 text-th-fgd-2" />
                    </div>
                  </a>
                </Link>
              </div>
            ))}
          </div>
        </div>
      ))}
    </Modal>
  )
}

export default React.memo(MarketsModal)
