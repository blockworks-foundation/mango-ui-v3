import { useEffect, useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import { Disclosure } from '@headlessui/react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { ChevronDownIcon } from '@heroicons/react/solid'
import ButtonGroup from './ButtonGroup'
import { numberCompacter, numberFormatter } from './SwapTokenInfo'
import Button from './Button'
import Input from './Input'
import { SearchIcon } from '@heroicons/react/outline'

dayjs.extend(relativeTime)

const SwapTokenInsights = ({ formState, jupiterTokens, setOutputToken }) => {
  const [tokenInsights, setTokenInsights] = useState([])
  const [filteredTokenInsights, setFilteredTokenInsights] = useState([])
  const [insightType, setInsightType] = useState('Best')
  const [filterBy, setFilterBy] = useState('24h Change')
  const [textFilter, setTextFilter] = useState('')
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
    if (filterBy === '24h Change' && textFilter === '') {
      setFilteredTokenInsights(
        tokenInsights
          .sort((a, b) =>
            insightType === 'Best'
              ? b.price_change_percentage_24h - a.price_change_percentage_24h
              : a.price_change_percentage_24h - b.price_change_percentage_24h
          )
          .slice(0, 10)
      )
    }
    if (filterBy === '24h Volume' && textFilter === '') {
      setFilteredTokenInsights(
        tokenInsights
          .sort((a, b) =>
            insightType === 'Best'
              ? b.total_volume - a.total_volume
              : a.total_volume - b.total_volume
          )
          .slice(0, 10)
      )
    }
    if (textFilter !== '') {
      setFilteredTokenInsights(
        tokenInsights.filter(
          (token) =>
            token.name.includes(textFilter) || token.symbol.includes(textFilter)
        )
      )
    }
  }, [filterBy, insightType, textFilter, tokenInsights])

  useEffect(() => {
    if (jupiterTokens) {
      getTokenInsights()
    }
  }, [])

  return filteredTokenInsights ? (
    <div>
      <div className="mb-2">
        <Input
          type="text"
          placeholder="Search tokens..."
          value={textFilter}
          onChange={(e) => setTextFilter(e.target.value)}
          prefix={<SearchIcon className="h-4 text-th-fgd-3 w-4" />}
        />
      </div>
      {textFilter === '' ? (
        <div className="flex items-center justify-between mb-2 mt-4">
          <div className="w-48">
            <ButtonGroup
              activeValue={filterBy}
              onChange={(t) => setFilterBy(t)}
              values={['24h Change', '24h Volume']}
            />
          </div>
          <div className="w-32">
            <ButtonGroup
              activeValue={insightType}
              onChange={(t) => setInsightType(t)}
              values={['Best', 'Worst']}
            />
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-2">
          <div className="animate-pulse bg-th-bkg-3 h-12 rounded-md w-full" />
          <div className="animate-pulse bg-th-bkg-3 h-12 rounded-md w-full" />
          <div className="animate-pulse bg-th-bkg-3 h-12 rounded-md w-full" />
        </div>
      ) : filteredTokenInsights.length > 0 ? (
        filteredTokenInsights.map((insight) => {
          const jupToken = jupiterTokens.find(
            (t) => t?.extensions?.coingeckoId === insight.id
          )
          return (
            <Disclosure>
              {({ open }) => (
                <>
                  <div
                    className={`border-b default-transition flex items-center p-2 hover:bg-th-bkg-2 ${
                      open
                        ? 'bg-th-bkg-2 border-transparent'
                        : 'border-th-bkg-4'
                    }`}
                  >
                    <Disclosure.Button
                      className="flex font-normal items-center justify-between text-th-fgd-1 w-full"
                      key={insight.symbol}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`min-w-[48px] text-xs ${
                            insight.price_change_percentage_24h >= 0
                              ? 'text-th-green'
                              : 'text-th-red'
                          }`}
                        >
                          {insight.price_change_percentage_24h
                            ? `${insight.price_change_percentage_24h.toFixed(
                                1
                              )}%`
                            : '?'}
                        </div>
                        {insight.image ? (
                          <img
                            src={insight.image}
                            width="24"
                            height="24"
                            alt={insight.name}
                            className="hidden lg:block rounded-full"
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
                          <div className="text-th-fgd-3 text-xs">
                            {insight.name}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center pl-2 space-x-3 text-right text-xs">
                        <div>
                          <div className="mb-[4px] text-th-fgd-4">Price</div>
                          <div className="text-th-fgd-3">
                            $
                            {insight.current_price.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 6,
                            })}
                          </div>
                        </div>
                        <div className="border-l border-th-bkg-4" />
                        <div>
                          <div className="mb-[4px] text-th-fgd-4">Volume</div>
                          <div className="text-th-fgd-3">
                            {insight.total_volume > 0
                              ? `$${numberCompacter.format(
                                  insight.total_volume
                                )}`
                              : '?'}
                          </div>
                        </div>
                        <ChevronDownIcon
                          className={`default-transition h-5 text-th-fgd-3 w-5 ${
                            open
                              ? 'transform rotate-180'
                              : 'transform rotate-360'
                          }`}
                        />
                      </div>
                    </Disclosure.Button>
                    <Button
                      className="hidden lg:block ml-3 pl-3 pr-3 text-xs"
                      onClick={() =>
                        setOutputToken({
                          ...formState,
                          outputMint: new PublicKey(jupToken.address),
                        })
                      }
                    >
                      Buy
                    </Button>
                  </div>
                  <Disclosure.Panel className="bg-th-bkg-2 border-b border-th-bkg-4 px-2 pb-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 grid-flow-row">
                      {insight.market_cap_rank ? (
                        <div className="border border-th-bkg-4 m-1 p-3 rounded-md">
                          <div className="text-th-fgd-3 text-xs">
                            Market Cap Rank
                          </div>
                          <div className="font-bold text-th-fgd-1">
                            #{insight.market_cap_rank}
                          </div>
                        </div>
                      ) : null}
                      {insight?.market_cap && insight?.market_cap !== 0 ? (
                        <div className="border border-th-bkg-4 m-1 p-3 rounded-md">
                          <div className="text-th-fgd-3 text-xs">
                            Market Cap
                          </div>
                          <div className="font-bold text-th-fgd-1">
                            ${numberCompacter.format(insight.market_cap)}
                          </div>
                        </div>
                      ) : null}
                      {insight?.circulating_supply ? (
                        <div className="border border-th-bkg-4 m-1 p-3 rounded-md">
                          <div className="text-th-fgd-3 text-xs">
                            Token Supply
                          </div>
                          <div className="font-bold text-th-fgd-1">
                            {numberCompacter.format(insight.circulating_supply)}
                          </div>
                          {insight?.max_supply ? (
                            <div className="text-th-fgd-2 text-xs">
                              Max Supply:{' '}
                              {numberCompacter.format(insight.max_supply)}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                      {insight?.ath ? (
                        <div className="border border-th-bkg-4 m-1 p-3 rounded-md">
                          <div className="text-th-fgd-3 text-xs">
                            All-Time High
                          </div>
                          <div className="flex">
                            <div className="font-bold text-th-fgd-1">
                              ${numberFormatter.format(insight.ath)}
                            </div>
                            {insight?.ath_change_percentage ? (
                              <div
                                className={`ml-1.5 mt-0.5 text-xs ${
                                  insight?.ath_change_percentage >= 0
                                    ? 'text-th-green'
                                    : 'text-th-red'
                                }`}
                              >
                                {insight.ath_change_percentage.toFixed(2)}%
                              </div>
                            ) : null}
                          </div>
                          {insight?.ath_date ? (
                            <div className="text-th-fgd-2 text-xs">
                              {dayjs(insight.ath_date).fromNow()}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                      {insight?.atl ? (
                        <div className="border border-th-bkg-4 m-1 p-3 rounded-md">
                          <div className="text-th-fgd-3 text-xs">
                            All-Time Low
                          </div>
                          <div className="flex">
                            <div className="font-bold text-th-fgd-1">
                              ${numberFormatter.format(insight.atl)}
                            </div>
                            {insight?.atl_change_percentage ? (
                              <div
                                className={`ml-1.5 mt-0.5 text-xs ${
                                  insight?.atl_change_percentage >= 0
                                    ? 'text-th-green'
                                    : 'text-th-red'
                                }`}
                              >
                                {(insight?.atl_change_percentage).toLocaleString(
                                  undefined,
                                  {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 2,
                                  }
                                )}
                                %
                              </div>
                            ) : null}
                          </div>
                          {insight?.atl_date ? (
                            <div className="text-th-fgd-2 text-xs">
                              {dayjs(insight.atl_date).fromNow()}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                    <Button
                      className="block lg:hidden my-2 text-xs w-full"
                      onClick={() =>
                        setOutputToken({
                          ...formState,
                          outputMint: new PublicKey(jupToken.address),
                        })
                      }
                    >
                      Buy
                    </Button>
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>
          )
        })
      ) : (
        <div className="bg-th-bkg-3 mt-3 p-4 rounded-md text-center text-th-fgd-3">
          No tokens found...
        </div>
      )}
    </div>
  ) : (
    <div className="bg-th-bkg-3 mt-3 p-4 rounded-md text-center text-th-fgd-3">
      Market insights are not available
    </div>
  )
}

export default SwapTokenInsights
