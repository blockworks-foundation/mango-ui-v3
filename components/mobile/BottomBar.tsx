import { useEffect, useState } from 'react'
import styled from '@emotion/styled'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ChartBarIcon, CurrencyDollarIcon } from '@heroicons/react/solid'
import { BtcMonoIcon, TradeIcon } from '../icons'
import useMangoGroupConfig from '../../hooks/useMangoGroupConfig'
import MarketsModal from '../MarketsModal'

const StyledBarItemLabel = styled.div`
  font-size: 0.6rem;
  line-height: 1;
`

const BottomBar = () => {
  const [showMarketsModal, setShowMarketsModal] = useState(false)
  const [sortedMarkets, setSortedMarkets] = useState([])
  const { asPath } = useRouter()
  const groupConfig = useMangoGroupConfig()

  useEffect(() => {
    const markets = []
    const allMarkets = [...groupConfig.spotMarkets, ...groupConfig.perpMarkets]
    allMarkets.forEach((market) => {
      const base = market.name.slice(0, -5)
      const found = markets.find((b) => b.baseAsset === base)
      if (!found) {
        markets.push({ baseAsset: base, markets: [market] })
      } else {
        found.markets.push(market)
      }
    })
    setSortedMarkets(markets)
  }, [])

  return (
    <>
      <div className="bg-th-bkg-4 default-transition grid grid-cols-4 grid-rows-1 py-2.5">
        <div
          className="col-span-1 cursor-pointer default-transition flex flex-col items-center text-th-fgd-3 hover:text-th-primary"
          onClick={() => setShowMarketsModal(true)}
        >
          <BtcMonoIcon className="h-4 mb-1 w-4" />
          <StyledBarItemLabel>Markets</StyledBarItemLabel>
        </div>
        <Link href="/perp/btc">
          <div
            className={`${
              asPath === '/' ||
              asPath.includes('spot') ||
              asPath.includes('perp')
                ? 'text-th-primary'
                : 'text-th-fgd-3'
            } col-span-1 cursor-pointer default-transition flex flex-col items-center hover:text-th-primary`}
          >
            <TradeIcon className="h-4 mb-1 w-4" />
            <StyledBarItemLabel>Trade</StyledBarItemLabel>
          </div>
        </Link>
        <Link href="/account">
          <div
            className={`${
              asPath === '/account' ? 'text-th-primary' : 'text-th-fgd-3'
            } col-span-1 cursor-pointer default-transition flex flex-col items-center hover:text-th-primary`}
          >
            <CurrencyDollarIcon className="h-4 mb-1 w-4" />
            <StyledBarItemLabel>Account</StyledBarItemLabel>
          </div>
        </Link>
        <Link href="/stats">
          <div
            className={`${
              asPath === '/stats' ? 'text-th-primary' : 'text-th-fgd-3'
            } col-span-1 cursor-pointer default-transition flex flex-col items-center hover:text-th-primary`}
          >
            <ChartBarIcon className="h-4 mb-1 w-4" />
            <StyledBarItemLabel>Stats</StyledBarItemLabel>
          </div>
        </Link>
      </div>
      {showMarketsModal ? (
        <MarketsModal
          isOpen={showMarketsModal}
          onClose={() => setShowMarketsModal(false)}
          markets={sortedMarkets}
        />
      ) : null}
    </>
  )
}

export default BottomBar
