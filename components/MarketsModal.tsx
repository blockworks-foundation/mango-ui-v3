import React from 'react'
import styled from '@emotion/styled'
import Link from 'next/link'
import { EyeIcon, EyeOffIcon } from '@heroicons/react/outline'
import Modal from './Modal'
import useLocalStorageState from '../hooks/useLocalStorageState'
import useMangoStore from '../stores/useMangoStore'
import { formatUsdValue } from '../utils'
import { LinkButton } from './Button'

const StyledColumnHeader = styled.span`
  font-size: 0.6rem;
`

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
        <LinkButton
          className="font-normal mb-0.5 text-th-fgd-3 text-xs disabled:cursor-not-allowed disabled:no-underline disabled:text-th-fgd-4"
          disabled={hiddenMarkets.length === 0}
          onClick={() => setHiddenMarkets([])}
        >
          Show all in Nav
        </LinkButton>
      </div>
      {markets.map((mkt, index) => (
        <div key={mkt.baseAsset}>
          <div className="bg-th-bkg-3 flex items-center justify-between p-2 rounded">
            <div className="flex items-center">
              <img
                alt=""
                src={`/assets/icons/${mkt.baseAsset.toLowerCase()}.svg`}
                className={`h-5 mr-2.5 w-auto`}
              />
              <span className="text-th-fgd-2">{mkt.baseAsset}</span>
            </div>
            {hiddenMarkets.includes(mkt.baseAsset) ? (
              <EyeOffIcon
                className="cursor-pointer default-transition h-5 text-th-fgd-4 w-5 hover:text-th-fgd-3"
                onClick={() => handleHideShowMarket(mkt.baseAsset)}
              />
            ) : (
              <EyeIcon
                className="cursor-pointer default-transition h-5 text-th-primary w-5 hover:text-th-primary-dark"
                onClick={() => handleHideShowMarket(mkt.baseAsset)}
              />
            )}
          </div>
          <div className="flex items-center justify-between pt-2.5 px-2.5 text-th-fgd-3">
            <StyledColumnHeader>Market</StyledColumnHeader>
            <div className="flex justify-between">
              <StyledColumnHeader className="text-right w-20">
                Price
              </StyledColumnHeader>
              {/* <StyledColumnHeader className="text-right w-20">
                24h Change
              </StyledColumnHeader>
              <StyledColumnHeader className="text-right w-20">
                24h Vol
              </StyledColumnHeader> */}
            </div>
          </div>
          <div className="divide-y divide-th-bkg-3">
            {mkt.markets.map((m, i) => (
              <div
                className={`flex items-center justify-between p-2.5 text-xs ${
                  i === 0 && 'pt-1'
                }`}
                key={m.name}
              >
                <Link
                  href={`/${
                    m.name.slice(-4) === 'PERP' ? 'perp' : 'spot'
                  }/${m.name.slice(0, -5)}`}
                  key={m.name}
                >
                  <a
                    className="cursor-pointer default-transition text-th-fgd-2 hover:text-th-primary"
                    onClick={onClose}
                  >
                    {m.name}
                  </a>
                </Link>
                <div className="flex justify-between">
                  <span className="text-th-fgd-2 text-right w-20">
                    {formatUsdValue(mangoGroup.getPrice(index, mangoCache))}
                  </span>
                  {/* <span className="text-th-green text-right w-20">+2.44%</span>
                  <span className="text-th-fgd-3 text-right w-20">$233m</span> */}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </Modal>
  )
}

export default React.memo(MarketsModal)
