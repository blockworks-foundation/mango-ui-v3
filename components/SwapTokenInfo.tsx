import { FunctionComponent, useEffect, useMemo, useState } from 'react'
import { ExternalLinkIcon, EyeOffIcon } from '@heroicons/react/outline'
import { ChevronDownIcon } from '@heroicons/react/solid'
import { Disclosure } from '@headlessui/react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'
import useDimensions from 'react-cool-dimensions'
import { IconButton } from './Button'
import { LineChartIcon } from './icons'

dayjs.extend(relativeTime)

interface SwapTokenInfoProps {
  inputTokenId?: string
  outputTokenId?: string
}

export const numberFormatter = Intl.NumberFormat('en', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 5,
})

export const numberCompacter = Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 2,
})

const SwapTokenInfo: FunctionComponent<SwapTokenInfoProps> = ({
  inputTokenId,
  outputTokenId,
}) => {
  const [chartData, setChartData] = useState([])
  const [hideChart, setHideChart] = useState(false)
  const [baseTokenId, setBaseTokenId] = useState('')
  const [quoteTokenId, setQuoteTokenId] = useState('')
  const [inputTokenInfo, setInputTokenInfo] = useState(null)
  const [outputTokenInfo, setOutputTokenInfo] = useState(null)
  const [mouseData, setMouseData] = useState<string | null>(null)
  const [daysToShow, setDaysToShow] = useState(1)
  const [topHolders, setTopHolders] = useState(null)
  const { observe, width, height } = useDimensions()

  const getTopHolders = async (inputMint, outputMint) => {
    const inputResponse = await fetch(
      `https://public-api.solscan.io/token/holders?tokenAddress=${inputMint}&offset=0&limit=10`
    )
    const outputResponse = await fetch(
      `https://public-api.solscan.io/token/holders?tokenAddress=${outputMint}&offset=0&limit=10`
    )
    const inputData = await inputResponse.json()
    const outputData = await outputResponse.json()

    setTopHolders({
      inputHolders: inputData.data,
      outputHolders: outputData.data,
    })
  }

  useEffect(() => {
    if (inputTokenInfo && outputTokenInfo) {
      getTopHolders(
        inputTokenInfo.contract_address,
        outputTokenInfo.contract_address
      )
    }
  }, [inputTokenInfo, outputTokenInfo])

  const handleMouseMove = (coords) => {
    if (coords.activePayload) {
      setMouseData(coords.activePayload[0].payload)
    }
  }

  const handleMouseLeave = () => {
    setMouseData(null)
  }

  useEffect(() => {
    if (['usd-coin', 'tether'].includes(inputTokenId)) {
      setBaseTokenId(outputTokenId)
      setQuoteTokenId(inputTokenId)
    } else {
      setBaseTokenId(inputTokenId)
      setQuoteTokenId(outputTokenId)
    }
  }, [inputTokenId, outputTokenId])

  // Use ohlc data

  const getChartData = async () => {
    const inputResponse = await fetch(
      `https://api.coingecko.com/api/v3/coins/${baseTokenId}/ohlc?vs_currency=usd&days=${daysToShow}`
    )
    const outputResponse = await fetch(
      `https://api.coingecko.com/api/v3/coins/${quoteTokenId}/ohlc?vs_currency=usd&days=${daysToShow}`
    )
    const inputData = await inputResponse.json()
    const outputData = await outputResponse.json()

    const data = inputData.concat(outputData)

    const formattedData = data.reduce((a, c) => {
      const found = a.find((price) => price.time === c[0])
      if (found) {
        if (['usd-coin', 'tether'].includes(quoteTokenId)) {
          found.price = found.inputPrice / c[4]
        } else {
          found.price = c[4] / found.inputPrice
        }
      } else {
        a.push({ time: c[0], inputPrice: c[4] })
      }
      return a
    }, [])
    formattedData[formattedData.length - 1].time = Date.now()
    setChartData(formattedData.filter((d) => d.price))
  }

  // Alternative chart data. Needs a timestamp tolerance to get data points for each asset

  //   const getChartData = async () => {
  //     const now = Date.now() / 1000
  //     const inputResponse = await fetch(
  //       `https://api.coingecko.com/api/v3/coins/${inputTokenId}/market_chart/range?vs_currency=usd&from=${
  //         now - 1 * 86400
  //       }&to=${now}`
  //     )

  //     const outputResponse = await fetch(
  //       `https://api.coingecko.com/api/v3/coins/${outputTokenId}/market_chart/range?vs_currency=usd&from=${
  //         now - 1 * 86400
  //       }&to=${now}`
  //     )
  //     const inputData = await inputResponse.json()
  //     const outputData = await outputResponse.json()

  //     const data = inputData?.prices.concat(outputData?.prices)

  //     const formattedData = data.reduce((a, c) => {
  //       const found = a.find(
  //         (price) => c[0] >= price.time - 120000 && c[0] <= price.time + 120000
  //       )
  //       if (found) {
  //         found.price = found.inputPrice / c[1]
  //       } else {
  //         a.push({ time: c[0], inputPrice: c[1] })
  //       }
  //       return a
  //     }, [])
  //     setChartData(formattedData.filter((d) => d.price))
  //   }

  const getInputTokenInfo = async () => {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${inputTokenId}?localization=false&tickers=false&developer_data=false&sparkline=false
      `
    )
    const data = await response.json()
    setInputTokenInfo(data)
  }

  const getOutputTokenInfo = async () => {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${outputTokenId}?localization=false&tickers=false&developer_data=false&sparkline=false
      `
    )
    const data = await response.json()
    setOutputTokenInfo(data)
  }

  useMemo(() => {
    if (baseTokenId && quoteTokenId) {
      getChartData()
    }
  }, [daysToShow, baseTokenId, quoteTokenId])

  useMemo(() => {
    if (baseTokenId) {
      getInputTokenInfo()
    }
    if (quoteTokenId) {
      getOutputTokenInfo()
    }
  }, [baseTokenId, quoteTokenId])

  const chartChange = chartData.length
    ? ((chartData[chartData.length - 1]['price'] - chartData[0]['price']) /
        chartData[0]['price']) *
      100
    : 0

  return (
    <div>
      {chartData.length && baseTokenId && quoteTokenId ? (
        <div className="pb-6">
          <div className="flex items-start justify-between">
            <div>
              {inputTokenInfo && outputTokenInfo ? (
                <div className="text-th-fgd-3 text-sm">
                  {['usd-coin', 'tether'].includes(baseTokenId)
                    ? `${inputTokenInfo.symbol.toUpperCase()}/${outputTokenInfo.symbol.toUpperCase()}`
                    : `${outputTokenInfo.symbol.toUpperCase()}/${inputTokenInfo.symbol.toUpperCase()}`}
                </div>
              ) : null}
              {mouseData ? (
                <>
                  <div className="font-bold text-lg text-th-fgd-1">
                    {numberFormatter.format(mouseData['price'])}
                    <span
                      className={`ml-2 text-xs ${
                        chartChange >= 0 ? 'text-th-green' : 'text-th-red'
                      }`}
                    >
                      {chartChange.toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-xs font-normal text-th-fgd-3">
                    {dayjs(mouseData['time']).format('DD MMM YY, h:mma')}
                  </div>
                </>
              ) : (
                <>
                  <div className="font-bold text-lg text-th-fgd-1">
                    {numberFormatter.format(
                      chartData[chartData.length - 1]['price']
                    )}
                    <span
                      className={`ml-2 text-xs ${
                        chartChange >= 0 ? 'text-th-green' : 'text-th-red'
                      }`}
                    >
                      {chartChange.toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-xs font-normal text-th-fgd-3">
                    {dayjs(chartData[chartData.length - 1]['time']).format(
                      'DD MMM YY, h:mma'
                    )}
                  </div>
                </>
              )}
            </div>
            <IconButton onClick={() => setHideChart(!hideChart)}>
              {hideChart ? (
                <LineChartIcon className="w-4 h-4" />
              ) : (
                <EyeOffIcon className="w-4 h-4" />
              )}
            </IconButton>
          </div>
          {!hideChart ? (
            <div className="h-52 mt-4 w-full" ref={observe}>
              <AreaChart
                width={width}
                height={height}
                data={chartData}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <Tooltip
                  cursor={{
                    strokeOpacity: 0,
                  }}
                  content={<></>}
                />
                <defs>
                  <linearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffba24" stopOpacity={0.9} />
                    <stop offset="90%" stopColor="#ffba24" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  isAnimationActive={true}
                  type="monotone"
                  dataKey="price"
                  stroke="#ffba24"
                  fill="url(#gradientArea)"
                />
                <XAxis dataKey="time" hide />
                <YAxis
                  dataKey="price"
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  hide
                />
              </AreaChart>
              <div className="flex justify-end">
                <button
                  className={`default-transition font-bold px-3 py-2 text-th-fgd-1 text-xs hover:text-th-primary focus:outline-none ${
                    daysToShow === 1 && 'text-th-primary'
                  }`}
                  onClick={() => setDaysToShow(1)}
                >
                  24H
                </button>
                <button
                  className={`default-transition font-bold px-3 py-2 text-th-fgd-1 text-xs hover:text-th-primary focus:outline-none ${
                    daysToShow === 7 && 'text-th-primary'
                  }`}
                  onClick={() => setDaysToShow(7)}
                >
                  7D
                </button>
                <button
                  className={`default-transition font-bold px-3 py-2 text-th-fgd-1 text-xs hover:text-th-primary focus:outline-none ${
                    daysToShow === 30 && 'text-th-primary'
                  }`}
                  onClick={() => setDaysToShow(30)}
                >
                  30D
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="bg-th-bkg-3 mt-4 md:mt-0 p-4 rounded-md text-center text-th-fgd-3">
          <LineChartIcon className="h-6 mx-auto text-th-primary w-6" />
          Chart not available
        </div>
      )}

      {inputTokenInfo && baseTokenId ? (
        <div className="w-full">
          <Disclosure>
            {({ open }) => (
              <>
                <Disclosure.Button
                  className={`border border-th-bkg-4 default-transition flex items-center justify-between mt-6 p-3 rounded-md w-full hover:bg-th-bkg-2 ${
                    open
                      ? 'border-b-transparent rounded-b-none'
                      : 'transform rotate-360'
                  }`}
                >
                  <div className="flex items-center">
                    {inputTokenInfo.image?.small ? (
                      <img
                        className="rounded-full"
                        src={inputTokenInfo.image?.small}
                        width="32"
                        height="32"
                        alt={inputTokenInfo.name}
                      />
                    ) : null}
                    <div className="ml-2.5 text-left">
                      <h2 className="font-bold text-base text-th-fgd-1">
                        {inputTokenInfo?.symbol?.toUpperCase()}
                      </h2>
                      <div className="font-normal text-th-fgd-3 text-xs">
                        {inputTokenInfo.name}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="flex items-center space-x-3">
                      {inputTokenInfo.market_data?.current_price?.usd ? (
                        <div className="font-normal text-th-fgd-1">
                          $
                          {numberFormatter.format(
                            inputTokenInfo.market_data.current_price.usd
                          )}
                        </div>
                      ) : null}
                      {inputTokenInfo.market_data
                        ?.price_change_percentage_24h ? (
                        <div
                          className={`font-normal text-th-fgd-1 ${
                            inputTokenInfo.market_data
                              .price_change_percentage_24h >= 0
                              ? 'text-th-green'
                              : 'text-th-red'
                          }`}
                        >
                          {inputTokenInfo.market_data.price_change_percentage_24h.toFixed(
                            2
                          )}
                          %
                        </div>
                      ) : null}
                    </div>
                    <ChevronDownIcon
                      className={`default-transition h-6 ml-2 w-6 text-th-fgd-3 ${
                        open ? 'transform rotate-180' : 'transform rotate-360'
                      }`}
                    />
                  </div>
                </Disclosure.Button>
                <Disclosure.Panel>
                  <div className="border border-th-bkg-4 border-t-0 p-3 rounded-b-md">
                    <div className="font-bold m-1 mt-0 pb-2 text-th-fgd-1 text-base">
                      Market Data
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 grid-flow-row">
                      {inputTokenInfo.market_cap_rank ? (
                        <div className="border border-th-bkg-4 m-1 p-3 rounded-md">
                          <div className="text-th-fgd-3 text-xs">
                            Market Cap Rank
                          </div>
                          <div className="font-bold text-th-fgd-1 text-lg">
                            #{inputTokenInfo.market_cap_rank}
                          </div>
                        </div>
                      ) : null}
                      {inputTokenInfo.market_data?.market_cap &&
                      inputTokenInfo.market_data?.market_cap?.usd !== 0 ? (
                        <div className="border border-th-bkg-4 m-1 p-3 rounded-md">
                          <div className="text-th-fgd-3 text-xs">
                            Market Cap
                          </div>
                          <div className="font-bold text-th-fgd-1 text-lg">
                            $
                            {numberCompacter.format(
                              inputTokenInfo.market_data?.market_cap?.usd
                            )}
                          </div>
                        </div>
                      ) : null}
                      {inputTokenInfo.market_data.total_volume?.usd ? (
                        <div className="border border-th-bkg-4 m-1 p-3 rounded-md">
                          <div className="text-th-fgd-3 text-xs">
                            24h Volume
                          </div>
                          <div className="font-bold text-th-fgd-1 text-lg">
                            $
                            {numberCompacter.format(
                              inputTokenInfo.market_data.total_volume?.usd
                            )}
                          </div>
                        </div>
                      ) : null}
                      {inputTokenInfo.market_data?.circulating_supply ? (
                        <div className="border border-th-bkg-4 m-1 p-3 rounded-md">
                          <div className="text-th-fgd-3 text-xs">
                            Token Supply
                          </div>
                          <div className="font-bold text-th-fgd-1 text-lg">
                            {numberCompacter.format(
                              inputTokenInfo.market_data.circulating_supply
                            )}
                          </div>
                          {inputTokenInfo.market_data?.max_supply ? (
                            <div className="text-th-fgd-2 text-xs">
                              Max Supply:{' '}
                              {numberCompacter.format(
                                inputTokenInfo.market_data.max_supply
                              )}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                      {inputTokenInfo.market_data?.ath?.usd ? (
                        <div className="border border-th-bkg-4 m-1 p-3 rounded-md">
                          <div className="text-th-fgd-3 text-xs">
                            All-Time High
                          </div>
                          <div className="flex">
                            <div className="font-bold text-th-fgd-1 text-lg">
                              $
                              {numberFormatter.format(
                                inputTokenInfo.market_data.ath.usd
                              )}
                            </div>
                            {inputTokenInfo.market_data?.ath_change_percentage
                              ?.usd ? (
                              <div
                                className={`ml-1.5 mt-2 text-xs ${
                                  inputTokenInfo.market_data
                                    ?.ath_change_percentage?.usd >= 0
                                    ? 'text-th-green'
                                    : 'text-th-red'
                                }`}
                              >
                                {(inputTokenInfo.market_data?.ath_change_percentage?.usd).toFixed(
                                  2
                                )}
                                %
                              </div>
                            ) : null}
                          </div>
                          {inputTokenInfo.market_data?.ath_date?.usd ? (
                            <div className="text-th-fgd-2 text-xs">
                              {dayjs(
                                inputTokenInfo.market_data.ath_date.usd
                              ).fromNow()}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                      {inputTokenInfo.market_data?.atl?.usd ? (
                        <div className="border border-th-bkg-4 m-1 p-3 rounded-md">
                          <div className="text-th-fgd-3 text-xs">
                            All-Time Low
                          </div>
                          <div className="flex">
                            <div className="font-bold text-th-fgd-1 text-lg">
                              $
                              {numberFormatter.format(
                                inputTokenInfo.market_data.atl.usd
                              )}
                            </div>
                            {inputTokenInfo.market_data?.atl_change_percentage
                              ?.usd ? (
                              <div
                                className={`ml-1.5 mt-2 text-xs ${
                                  inputTokenInfo.market_data
                                    ?.atl_change_percentage?.usd >= 0
                                    ? 'text-th-green'
                                    : 'text-th-red'
                                }`}
                              >
                                {(inputTokenInfo.market_data?.atl_change_percentage?.usd).toLocaleString(
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
                          {inputTokenInfo.market_data?.atl_date?.usd ? (
                            <div className="text-th-fgd-2 text-xs">
                              {dayjs(
                                inputTokenInfo.market_data.atl_date.usd
                              ).fromNow()}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                    {topHolders?.inputHolders ? (
                      <div className="pt-4">
                        <div className="font-bold m-1 pb-3 text-th-fgd-1 text-base">
                          Top 10 Holders
                        </div>
                        {topHolders.inputHolders.map((holder) => (
                          <a
                            className="border-t border-th-bkg-4 default transition flex justify-between mx-1 px-2 py-2.5 text-th-fgd-3 hover:bg-th-bkg-2"
                            href={`https://explorer.solana.com/address/${holder.owner}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            key={holder.owner}
                          >
                            <div className="text-th-fgd-3">
                              {holder.owner.slice(0, 5) +
                                '…' +
                                holder.owner.slice(-5)}
                            </div>
                            <div className="flex items-center">
                              <div className="text-th-fgd-1">
                                {numberFormatter.format(
                                  holder.amount / Math.pow(10, holder.decimals)
                                )}
                              </div>
                              <ExternalLinkIcon className="h-4 ml-2 w-4" />
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </Disclosure.Panel>
              </>
            )}
          </Disclosure>
        </div>
      ) : (
        <div className="bg-th-bkg-3 mt-3 p-4 rounded-md text-center text-th-fgd-3">
          Input token information is not available.
        </div>
      )}

      {outputTokenInfo && quoteTokenId ? (
        <div className="w-full">
          <Disclosure>
            {({ open }) => (
              <>
                <Disclosure.Button
                  className={`border border-th-bkg-4 default-transition flex items-center justify-between mt-3 p-3 rounded-md w-full hover:bg-th-bkg-2 ${
                    open
                      ? 'border-b-transparent rounded-b-none'
                      : 'transform rotate-360'
                  }`}
                >
                  <div className="flex items-center">
                    {outputTokenInfo.image?.small ? (
                      <img
                        className="rounded-full"
                        src={outputTokenInfo.image?.small}
                        width="32"
                        height="32"
                        alt={outputTokenInfo.name}
                      />
                    ) : null}
                    <div className="ml-2.5 text-left">
                      <h2 className="font-bold text-base text-th-fgd-1">
                        {outputTokenInfo?.symbol?.toUpperCase()}
                      </h2>
                      <div className="font-normal text-th-fgd-3 text-xs">
                        {outputTokenInfo.name}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="flex items-center space-x-3">
                      {outputTokenInfo.market_data?.current_price?.usd ? (
                        <div className="font-normal text-th-fgd-1">
                          $
                          {numberFormatter.format(
                            outputTokenInfo.market_data.current_price.usd
                          )}
                        </div>
                      ) : null}
                      {outputTokenInfo.market_data
                        ?.price_change_percentage_24h ? (
                        <div
                          className={`font-normal text-th-fgd-1 ${
                            outputTokenInfo.market_data
                              .price_change_percentage_24h >= 0
                              ? 'text-th-green'
                              : 'text-th-red'
                          }`}
                        >
                          {outputTokenInfo.market_data.price_change_percentage_24h.toFixed(
                            2
                          )}
                          %
                        </div>
                      ) : null}
                    </div>
                    <ChevronDownIcon
                      className={`default-transition h-6 ml-2 w-6 text-th-fgd-3 ${
                        open ? 'transform rotate-180' : 'transform rotate-360'
                      }`}
                    />
                  </div>
                </Disclosure.Button>
                <Disclosure.Panel>
                  <div className="border border-th-bkg-4 border-t-0 p-3 rounded-b-md">
                    <div className="font-bold m-1 mt-0 pb-2 text-th-fgd-1 text-base">
                      Market Data
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 grid-flow-row">
                      {outputTokenInfo.market_cap_rank ? (
                        <div className="border border-th-bkg-4 m-1 p-3 rounded-md">
                          <div className="text-th-fgd-3 text-xs">
                            Market Cap Rank
                          </div>
                          <div className="font-bold text-th-fgd-1 text-lg">
                            #{outputTokenInfo.market_cap_rank}
                          </div>
                        </div>
                      ) : null}
                      {outputTokenInfo.market_data?.market_cap &&
                      outputTokenInfo.market_data?.market_cap?.usd !== 0 ? (
                        <div className="border border-th-bkg-4 m-1 p-3 rounded-md">
                          <div className="text-th-fgd-3 text-xs">
                            Market Cap
                          </div>
                          <div className="font-bold text-th-fgd-1 text-lg">
                            $
                            {numberCompacter.format(
                              outputTokenInfo.market_data?.market_cap?.usd
                            )}
                          </div>
                        </div>
                      ) : null}
                      {outputTokenInfo.market_data.total_volume?.usd ? (
                        <div className="border border-th-bkg-4 m-1 p-3 rounded-md">
                          <div className="text-th-fgd-3 text-xs">
                            24h Volume
                          </div>
                          <div className="font-bold text-th-fgd-1 text-lg">
                            $
                            {numberCompacter.format(
                              outputTokenInfo.market_data.total_volume?.usd
                            )}
                          </div>
                        </div>
                      ) : null}
                      {outputTokenInfo.market_data?.circulating_supply ? (
                        <div className="border border-th-bkg-4 m-1 p-3 rounded-md">
                          <div className="text-th-fgd-3 text-xs">
                            Token Supply
                          </div>
                          <div className="font-bold text-th-fgd-1 text-lg">
                            {numberCompacter.format(
                              outputTokenInfo.market_data.circulating_supply
                            )}
                          </div>
                          {outputTokenInfo.market_data?.max_supply ? (
                            <div className="text-th-fgd-2 text-xs">
                              Max Supply:{' '}
                              {numberCompacter.format(
                                outputTokenInfo.market_data.max_supply
                              )}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                      {outputTokenInfo.market_data?.ath?.usd ? (
                        <div className="border border-th-bkg-4 m-1 p-3 rounded-md">
                          <div className="text-th-fgd-3 text-xs">
                            All-Time High
                          </div>
                          <div className="flex">
                            <div className="font-bold text-th-fgd-1 text-lg">
                              $
                              {numberFormatter.format(
                                outputTokenInfo.market_data.ath.usd
                              )}
                            </div>
                            {outputTokenInfo.market_data?.ath_change_percentage
                              ?.usd ? (
                              <div
                                className={`ml-1.5 mt-2 text-xs ${
                                  outputTokenInfo.market_data
                                    ?.ath_change_percentage?.usd >= 0
                                    ? 'text-th-green'
                                    : 'text-th-red'
                                }`}
                              >
                                {(outputTokenInfo.market_data?.ath_change_percentage?.usd).toFixed(
                                  2
                                )}
                                %
                              </div>
                            ) : null}
                          </div>
                          {outputTokenInfo.market_data?.ath_date?.usd ? (
                            <div className="text-th-fgd-2 text-xs">
                              {dayjs(
                                outputTokenInfo.market_data.ath_date.usd
                              ).fromNow()}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                      {outputTokenInfo.market_data?.atl?.usd ? (
                        <div className="border border-th-bkg-4 m-1 p-3 rounded-md">
                          <div className="text-th-fgd-3 text-xs">
                            All-Time Low
                          </div>
                          <div className="flex">
                            <div className="font-bold text-th-fgd-1 text-lg">
                              $
                              {numberFormatter.format(
                                outputTokenInfo.market_data.atl.usd
                              )}
                            </div>
                            {outputTokenInfo.market_data?.atl_change_percentage
                              ?.usd ? (
                              <div
                                className={`ml-1.5 mt-2 text-xs ${
                                  outputTokenInfo.market_data
                                    ?.atl_change_percentage?.usd >= 0
                                    ? 'text-th-green'
                                    : 'text-th-red'
                                }`}
                              >
                                {(outputTokenInfo.market_data?.atl_change_percentage?.usd).toLocaleString(
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
                          {outputTokenInfo.market_data?.atl_date?.usd ? (
                            <div className="text-th-fgd-2 text-xs">
                              {dayjs(
                                outputTokenInfo.market_data.atl_date.usd
                              ).fromNow()}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                    {topHolders?.outputHolders ? (
                      <div className="pt-4">
                        <div className="font-bold m-1 pb-3 text-th-fgd-1 text-base">
                          Top 10 Holders
                        </div>
                        {topHolders.outputHolders.map((holder) => (
                          <a
                            className="border-t border-th-bkg-4 default transition flex justify-between mx-1 px-2 py-2.5 text-th-fgd-3 hover:bg-th-bkg-2"
                            href={`https://explorer.solana.com/address/${holder.owner}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            key={holder.owner}
                          >
                            <div className="text-th-fgd-3">
                              {holder.owner.slice(0, 5) +
                                '…' +
                                holder.owner.slice(-5)}
                            </div>
                            <div className="flex items-center">
                              <div className="text-th-fgd-1">
                                {numberFormatter.format(
                                  holder.amount / Math.pow(10, holder.decimals)
                                )}
                              </div>
                              <ExternalLinkIcon className="h-4 ml-2 w-4" />
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </Disclosure.Panel>
              </>
            )}
          </Disclosure>
        </div>
      ) : (
        <div className="bg-th-bkg-3 mt-3 p-4 rounded-md text-center text-th-fgd-3">
          Output token information is not available.
        </div>
      )}
    </div>
  )
}

export default SwapTokenInfo
