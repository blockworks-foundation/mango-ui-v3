import { useEffect, useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import ButtonGroup from './ButtonGroup'
import { numberCompacter, numberFormatter } from './SwapTokenInfo'
import Button, { IconButton } from './Button'
import Input from './Input'
import { SearchIcon, XIcon } from '@heroicons/react/outline'
import { useTranslation } from 'next-i18next'
import { ExpandableRow } from './TableElements'

const filterByVals = ['change-percent', '24h-volume']
const timeFrameVals = ['24h', '7d', '30d']
const insightTypeVals = ['best', 'worst']

dayjs.extend(relativeTime)

const SwapTokenInsights = ({ formState, jupiterTokens, setOutputToken }) => {
  const [tokenInsights, setTokenInsights] = useState<any>([])
  const [filteredTokenInsights, setFilteredTokenInsights] = useState<any>([])
  const [insightType, setInsightType] = useState(insightTypeVals[0])
  const [filterBy, setFilterBy] = useState(filterByVals[0])
  const [timeframe, setTimeframe] = useState(timeFrameVals[0])
  const [textFilter, setTextFilter] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [loading, setLoading] = useState(false)
  const { t } = useTranslation(['common', 'swap'])

  const getTokenInsights = async () => {
    setLoading(true)
    const ids = jupiterTokens
      .filter((token) => token?.extensions?.coingeckoId)
      .map((token) => token.extensions.coingeckoId)
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids.toString()}&order=market_cap_desc&sparkline=false&price_change_percentage=24h,7d,30d`
    )
    const data = await response.json()
    setLoading(false)
    setTokenInsights(data)
  }

  useEffect(() => {
    if (filterBy === filterByVals[0] && textFilter === '') {
      //filter by 'change %'
      setFilteredTokenInsights(
        tokenInsights
          .sort((a, b) =>
            insightType === insightTypeVals[0] //insight type 'best'
              ? b[`price_change_percentage_${timeframe}_in_currency`] -
                a[`price_change_percentage_${timeframe}_in_currency`]
              : a[`price_change_percentage_${timeframe}_in_currency`] -
                b[`price_change_percentage_${timeframe}_in_currency`]
          )
          .slice(0, 10)
      )
    }
    if (filterBy === filterByVals[1] && textFilter === '') {
      //filter by 24h vol
      setFilteredTokenInsights(
        tokenInsights
          .sort((a, b) =>
            insightType === insightTypeVals[0] //insight type 'best'
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
  }, [filterBy, insightType, textFilter, timeframe, tokenInsights])

  useEffect(() => {
    if (jupiterTokens) {
      getTokenInsights()
    }
  }, [])

  const handleToggleSearch = () => {
    setShowSearch(!showSearch)
    setTextFilter('')
  }

  return filteredTokenInsights ? (
    <div>
      <div className="mb-3 flex items-end space-x-2">
        {!showSearch ? (
          <div className="flex w-full flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-2 w-44 lg:mb-0">
              <ButtonGroup
                activeValue={filterBy}
                className="h-10"
                onChange={(t) => setFilterBy(t)}
                values={filterByVals}
                names={filterByVals.map((val) => t(`swap:${val}`))}
              />
            </div>
            <div className="flex space-x-2">
              {filterBy === filterByVals[0] ? ( //filter by change %
                <div className="w-36">
                  <ButtonGroup
                    activeValue={timeframe}
                    className="h-10"
                    onChange={(t) => setTimeframe(t)}
                    values={timeFrameVals}
                  />
                </div>
              ) : null}
              <div className="w-28">
                <ButtonGroup
                  activeValue={insightType}
                  className="h-10"
                  onChange={(t) => setInsightType(t)}
                  values={insightTypeVals}
                  names={insightTypeVals.map((val) => t(`swap:${val}`))}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full">
            <Input
              type="text"
              placeholder="Search tokens..."
              value={textFilter}
              onChange={(e) => setTextFilter(e.target.value)}
              prefix={<SearchIcon className="h-4 w-4 text-th-fgd-3" />}
            />
          </div>
        )}
        <IconButton
          className="h-10 w-10 flex-shrink-0"
          onClick={() => handleToggleSearch()}
        >
          {showSearch ? (
            <XIcon className="h-4 w-4" />
          ) : (
            <SearchIcon className="h-4 w-4" />
          )}
        </IconButton>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-12 w-full animate-pulse rounded-md bg-th-bkg-3" />
          <div className="h-12 w-full animate-pulse rounded-md bg-th-bkg-3" />
          <div className="h-12 w-full animate-pulse rounded-md bg-th-bkg-3" />
        </div>
      ) : filteredTokenInsights.length > 0 ? (
        <div className="border-b border-th-bkg-4">
          {filteredTokenInsights.map((insight) => {
            if (!insight) {
              return null
            }
            const jupToken = jupiterTokens.find(
              (t) => t?.extensions?.coingeckoId === insight.id
            )
            return (
              <>
                <ExpandableRow
                  buttonTemplate={
                    <div className="flex w-full items-center">
                      <div className="flex w-1/2 items-center space-x-3">
                        <div
                          className={`min-w-[48px] text-xs ${
                            timeframe === timeFrameVals[0] //timeframe 24h
                              ? insight.price_change_percentage_24h_in_currency >=
                                0
                                ? 'text-th-green'
                                : 'text-th-red'
                              : timeframe === timeFrameVals[1] //timeframe 7d
                              ? insight.price_change_percentage_7d_in_currency >=
                                0
                                ? 'text-th-green'
                                : 'text-th-red'
                              : insight.price_change_percentage_30d_in_currency >=
                                0
                              ? 'text-th-green'
                              : 'text-th-red'
                          }`}
                        >
                          {timeframe === timeFrameVals[0] //timeframe 24h
                            ? insight.price_change_percentage_24h_in_currency
                              ? `${insight.price_change_percentage_24h_in_currency.toFixed(
                                  1
                                )}%`
                              : '?'
                            : timeframe === timeFrameVals[1] //timeframe 7d
                            ? insight.price_change_percentage_7d_in_currency
                              ? `${insight.price_change_percentage_7d_in_currency.toFixed(
                                  1
                                )}%`
                              : '?'
                            : insight.price_change_percentage_30d_in_currency
                            ? `${insight.price_change_percentage_30d_in_currency.toFixed(
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
                            className="hidden rounded-full lg:block"
                          />
                        ) : (
                          <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-th-bkg-3 text-xs text-th-fgd-3">
                            ?
                          </div>
                        )}
                        <div className="text-left">
                          <div className="font-bold">
                            {insight?.symbol?.toUpperCase()}
                          </div>
                          <div className="text-xs text-th-fgd-3">
                            {insight.name}
                          </div>
                        </div>
                      </div>
                      <div className="flex w-1/2 items-center justify-end space-x-3 pl-2 text-right text-xs">
                        <div>
                          <div className="mb-[4px] text-th-fgd-4">
                            {t('price')}
                          </div>
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
                          <div className="mb-[4px] text-th-fgd-4">
                            {t('swap:24h-vol')}
                          </div>
                          <div className="text-th-fgd-3">
                            {insight.total_volume > 0
                              ? `$${numberCompacter.format(
                                  insight.total_volume
                                )}`
                              : '?'}
                          </div>
                        </div>
                      </div>
                      <Button
                        className="ml-3 hidden pl-3 pr-3 text-xs lg:block"
                        onClick={() =>
                          setOutputToken({
                            ...formState,
                            outputMint: new PublicKey(jupToken.address),
                          })
                        }
                      >
                        {t('buy')}
                      </Button>
                    </div>
                  }
                  panelTemplate={
                    <div className="grid grid-flow-row grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                      {insight.market_cap_rank ? (
                        <div className="m-1 rounded-md border border-th-bkg-4 p-3">
                          <div className="text-xs text-th-fgd-3">
                            {t('swap:market-cap-rank')}
                          </div>
                          <div className="font-bold text-th-fgd-1">
                            #{insight.market_cap_rank}
                          </div>
                        </div>
                      ) : null}
                      {insight?.market_cap && insight?.market_cap !== 0 ? (
                        <div className="m-1 rounded-md border border-th-bkg-4 p-3">
                          <div className="text-xs text-th-fgd-3">
                            {t('swap:market-cap')}
                          </div>
                          <div className="font-bold text-th-fgd-1">
                            ${numberCompacter.format(insight.market_cap)}
                          </div>
                        </div>
                      ) : null}
                      {insight?.circulating_supply ? (
                        <div className="m-1 rounded-md border border-th-bkg-4 p-3">
                          <div className="text-xs text-th-fgd-3">
                            {t('swap:token-supply')}
                          </div>
                          <div className="font-bold text-th-fgd-1">
                            {numberCompacter.format(insight.circulating_supply)}
                          </div>
                          {insight?.max_supply ? (
                            <div className="text-xs text-th-fgd-2">
                              {t('swap:max-supply')}
                              {': '}
                              {numberCompacter.format(insight.max_supply)}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                      {insight?.ath ? (
                        <div className="m-1 rounded-md border border-th-bkg-4 p-3">
                          <div className="text-xs text-th-fgd-3">
                            {t('swap:ath')}
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
                            <div className="text-xs text-th-fgd-2">
                              {dayjs(insight.ath_date).fromNow()}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                      {insight?.atl ? (
                        <div className="m-1 rounded-md border border-th-bkg-4 p-3">
                          <div className="text-xs text-th-fgd-3">
                            {t('swap:atl')}
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
                            <div className="text-xs text-th-fgd-2">
                              {dayjs(insight.atl_date).fromNow()}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  }
                />
              </>
            )
          })}
        </div>
      ) : (
        <div className="mt-3 rounded-md bg-th-bkg-3 p-4 text-center text-th-fgd-3">
          {t('swap:no-tokens-found')}
        </div>
      )}
    </div>
  ) : (
    <div className="mt-3 rounded-md bg-th-bkg-3 p-4 text-center text-th-fgd-3">
      {t('swap:insights-not-available')}
    </div>
  )
}

export default SwapTokenInsights
