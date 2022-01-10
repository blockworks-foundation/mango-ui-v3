import { useEffect, useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import ButtonGroup from './ButtonGroup'
import { numberFormatter } from './SwapTokenInfo'

const SwapTokenInsights = ({ formState, jupiterTokens, setOutputToken }) => {
  const [tokenInsights, setTokenInsights] = useState([])
  const [filteredTokenInsights, setFilteredTokenInsights] = useState([])
  const [insightType, setInsightType] = useState('Best')
  const [loading, setLoading] = useState(false)

  const getTokenInsights = async () => {
    setLoading(true)
    const ids = jupiterTokens
      .filter((token) => token?.extensions?.coingeckoId)
      .map((token) => token.extensions.coingeckoId)
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids.toString()}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`
    )
    const data = await response.json()
    setLoading(false)
    setTokenInsights(data)
  }

  useEffect(() => {
    if (insightType === 'Best') {
      setFilteredTokenInsights(
        tokenInsights
          .sort(
            (a, b) =>
              b.price_change_percentage_24h - a.price_change_percentage_24h
          )
          .slice(0, 10)
      )
    } else {
      setFilteredTokenInsights(
        tokenInsights
          .sort(
            (a, b) =>
              a.price_change_percentage_24h - b.price_change_percentage_24h
          )
          .slice(0, 10)
      )
    }
  }, [insightType, tokenInsights])

  useEffect(() => {
    if (jupiterTokens) {
      getTokenInsights()
    }
  }, [])

  return filteredTokenInsights ? (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-bold text-base text-th-fgd-1">24h Change</h2>
        <div className="w-40">
          <ButtonGroup
            activeValue={insightType}
            onChange={(t) => setInsightType(t)}
            values={['Best', 'Worst']}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="animate-pulse bg-th-bkg-3 h-12 w-full" />
          <div className="animate-pulse bg-th-bkg-3 h-12 w-full" />
          <div className="animate-pulse bg-th-bkg-3 h-12 w-full" />
        </div>
      ) : (
        filteredTokenInsights.map((insight) => {
          const jupToken = jupiterTokens.find(
            (t) => t?.extensions?.coingeckoId === insight.id
          )
          return (
            <button
              className="border-b border-th-bkg-4 default-transition flex font-normal items-center justify-between p-2 text-th-fgd-1 w-full hover:bg-th-bkg-2"
              key={insight.symbol}
              onClick={() =>
                setOutputToken({
                  ...formState,
                  outputMint: new PublicKey(jupToken.address),
                })
              }
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`text-xs ${
                    insightType === 'Best' ? 'text-th-green' : 'text-th-red'
                  }`}
                >
                  {insight.price_change_percentage_24h.toFixed(1)}%
                </div>
                {insight.image ? (
                  <img
                    src={insight.image}
                    width="24"
                    height="24"
                    alt={insight.name}
                    className="rounded-full"
                  />
                ) : (
                  <div className="bg-th-bkg-3 h-6 inline-flex items-center justify-center rounded-full text-th-fgd-3 text-xs w-6">
                    ?
                  </div>
                )}
                <div className="text-left">
                  <div className="font-bold">
                    {insight.symbol.toUpperCase()}
                  </div>
                  <div className="text-th-fgd-3 text-xs">{insight.name}</div>
                </div>
              </div>
              <div className="flex space-x-3 text-right text-xs">
                <div>
                  <div className="text-th-fgd-4">Price</div>
                  <div className="text-th-fgd-3">
                    $
                    {insight.current_price.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 7,
                    })}
                  </div>
                </div>
                <div className="border-l border-th-bkg-4" />
                <div>
                  <div className="text-th-fgd-4">M. Cap</div>
                  <div className="text-th-fgd-3">
                    {insight.market_cap > 0
                      ? `$${numberFormatter.format(insight.market_cap)}`
                      : '?'}
                  </div>
                </div>
              </div>
            </button>
          )
        })
      )}
    </div>
  ) : (
    <div className="bg-th-bkg-3 mt-3 p-4 rounded-md text-center text-th-fgd-3">
      Market insights are not available
    </div>
  )
}

export default SwapTokenInsights
