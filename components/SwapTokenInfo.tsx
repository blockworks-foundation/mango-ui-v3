import { FunctionComponent, useEffect, useMemo, useState } from 'react'
import { ExternalLinkIcon, EyeOffIcon } from '@heroicons/react/outline'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'
import useDimensions from 'react-cool-dimensions'
import { IconButton } from './Button'
import { LineChartIcon } from './icons'
import { useTranslation } from 'next-i18next'
import { ExpandableRow } from './TableElements'

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
  const [inputTokenInfo, setInputTokenInfo] = useState<any>(null)
  const [outputTokenInfo, setOutputTokenInfo] = useState<any>(null)
  const [mouseData, setMouseData] = useState<string | null>(null)
  const [daysToShow, setDaysToShow] = useState(1)
  const [topHolders, setTopHolders] = useState<any>(null)
  const { observe, width, height } = useDimensions()
  const { t } = useTranslation(['common', 'swap'])

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
    if (!inputTokenId || !outputTokenId) {
      return
    }
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

    let data: any[] = []
    if (Array.isArray(inputData)) {
      data = data.concat(inputData)
    }
    if (Array.isArray(outputData)) {
      data = data.concat(outputData)
    }

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
                <div className="text-sm text-th-fgd-3">
                  {`${outputTokenInfo?.symbol?.toUpperCase()}/${inputTokenInfo?.symbol?.toUpperCase()}`}
                </div>
              ) : null}
              {mouseData ? (
                <>
                  <div className="text-lg font-bold text-th-fgd-1">
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
                  <div className="text-lg font-bold text-th-fgd-1">
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
                <LineChartIcon className="h-4 w-4" />
              ) : (
                <EyeOffIcon className="h-4 w-4" />
              )}
            </IconButton>
          </div>
          {!hideChart ? (
            <div className="mt-4 h-52 w-full" ref={observe}>
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
                  className={`default-transition px-3 py-2 text-xs font-bold text-th-fgd-1 hover:text-th-primary focus:outline-none ${
                    daysToShow === 1 && 'text-th-primary'
                  }`}
                  onClick={() => setDaysToShow(1)}
                >
                  24H
                </button>
                <button
                  className={`default-transition px-3 py-2 text-xs font-bold text-th-fgd-1 hover:text-th-primary focus:outline-none ${
                    daysToShow === 7 && 'text-th-primary'
                  }`}
                  onClick={() => setDaysToShow(7)}
                >
                  7D
                </button>
                <button
                  className={`default-transition px-3 py-2 text-xs font-bold text-th-fgd-1 hover:text-th-primary focus:outline-none ${
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
        <div className="mt-4 rounded-md bg-th-bkg-3 p-4 text-center text-th-fgd-3 md:mt-0">
          <LineChartIcon className="mx-auto h-6 w-6 text-th-primary" />
          {t('swap:chart-not-available')}
        </div>
      )}
      <div className="pt-8">
        {inputTokenInfo && outputTokenInfo && baseTokenId ? (
          <ExpandableRow
            buttonTemplate={
              <div className="text-fgd-1 flex w-full items-center justify-between">
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
                    <h2 className="text-base font-bold text-th-fgd-1">
                      {inputTokenInfo?.symbol?.toUpperCase()}
                    </h2>
                    <div className="text-xs font-normal text-th-fgd-3">
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
                          inputTokenInfo.market_data?.current_price.usd
                        )}
                      </div>
                    ) : null}
                    {inputTokenInfo.market_data?.price_change_percentage_24h ? (
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
                </div>
              </div>
            }
            panelTemplate={
              <div>
                <div className="m-1 mt-0 pb-2 text-base font-bold text-th-fgd-1">
                  {t('market-data')}
                </div>
                <div className="grid grid-flow-row grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
                  {inputTokenInfo.market_cap_rank ? (
                    <div className="m-1 rounded-md border border-th-bkg-4 p-3">
                      <div className="text-xs text-th-fgd-3">
                        {t('swap:market-cap-rank')}
                      </div>
                      <div className="text-lg font-bold text-th-fgd-1">
                        #{inputTokenInfo.market_cap_rank}
                      </div>
                    </div>
                  ) : null}
                  {inputTokenInfo.market_data?.market_cap &&
                  inputTokenInfo.market_data?.market_cap?.usd !== 0 ? (
                    <div className="m-1 rounded-md border border-th-bkg-4 p-3">
                      <div className="text-xs text-th-fgd-3">
                        {t('swap:market-cap')}
                      </div>
                      <div className="text-lg font-bold text-th-fgd-1">
                        $
                        {numberCompacter.format(
                          inputTokenInfo.market_data?.market_cap?.usd
                        )}
                      </div>
                    </div>
                  ) : null}
                  {inputTokenInfo.market_data?.total_volume?.usd ? (
                    <div className="m-1 rounded-md border border-th-bkg-4 p-3">
                      <div className="text-xs text-th-fgd-3">
                        {t('daily-volume')}
                      </div>
                      <div className="text-lg font-bold text-th-fgd-1">
                        $
                        {numberCompacter.format(
                          inputTokenInfo.market_data?.total_volume?.usd
                        )}
                      </div>
                    </div>
                  ) : null}
                  {inputTokenInfo.market_data?.circulating_supply ? (
                    <div className="m-1 rounded-md border border-th-bkg-4 p-3">
                      <div className="text-xs text-th-fgd-3">
                        {t('swap:token-supply')}
                      </div>
                      <div className="text-lg font-bold text-th-fgd-1">
                        {numberCompacter.format(
                          inputTokenInfo.market_data.circulating_supply
                        )}
                      </div>
                      {inputTokenInfo.market_data?.max_supply ? (
                        <div className="text-xs text-th-fgd-2">
                          {t('swap:max-supply')}:{' '}
                          {numberCompacter.format(
                            inputTokenInfo.market_data.max_supply
                          )}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  {inputTokenInfo.market_data?.ath?.usd ? (
                    <div className="m-1 rounded-md border border-th-bkg-4 p-3">
                      <div className="text-xs text-th-fgd-3">
                        {t('swap:ath')}
                      </div>
                      <div className="flex">
                        <div className="text-lg font-bold text-th-fgd-1">
                          $
                          {numberFormatter.format(
                            inputTokenInfo.market_data.ath.usd
                          )}
                        </div>
                        {inputTokenInfo.market_data?.ath_change_percentage
                          ?.usd ? (
                          <div
                            className={`ml-1.5 mt-2 text-xs ${
                              inputTokenInfo.market_data?.ath_change_percentage
                                ?.usd >= 0
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
                        <div className="text-xs text-th-fgd-2">
                          {dayjs(
                            inputTokenInfo.market_data.ath_date.usd
                          ).fromNow()}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  {inputTokenInfo.market_data?.atl?.usd ? (
                    <div className="m-1 rounded-md border border-th-bkg-4 p-3">
                      <div className="text-xs text-th-fgd-3">
                        {t('swap:atl')}
                      </div>
                      <div className="flex">
                        <div className="text-lg font-bold text-th-fgd-1">
                          $
                          {numberFormatter.format(
                            inputTokenInfo.market_data.atl.usd
                          )}
                        </div>
                        {inputTokenInfo.market_data?.atl_change_percentage
                          ?.usd ? (
                          <div
                            className={`ml-1.5 mt-2 text-xs ${
                              inputTokenInfo.market_data?.atl_change_percentage
                                ?.usd >= 0
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
                        <div className="text-xs text-th-fgd-2">
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
                    <div className="m-1 pb-3 text-base font-bold text-th-fgd-1">
                      {t('swap:top-ten')}
                    </div>
                    {topHolders.inputHolders.map((holder) => (
                      <a
                        className="default mx-1 flex justify-between border-t border-th-bkg-4 px-2 py-2.5 text-th-fgd-3 transition hover:bg-th-bkg-2"
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
                          <ExternalLinkIcon className="ml-2 h-4 w-4" />
                        </div>
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            }
          />
        ) : (
          <div className="mt-3 rounded-md bg-th-bkg-3 p-4 text-center text-th-fgd-3">
            {t('swap:input-info-unavailable')}
          </div>
        )}

        {outputTokenInfo && quoteTokenId ? (
          <div className="w-full border-b border-th-bkg-4">
            <ExpandableRow
              buttonTemplate={
                <div className="text-fgd-1 flex w-full items-center justify-between">
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
                      <h2 className="text-base font-bold text-th-fgd-1">
                        {outputTokenInfo?.symbol?.toUpperCase()}
                      </h2>
                      <div className="text-xs font-normal text-th-fgd-3">
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
                            outputTokenInfo.market_data?.current_price.usd
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
                  </div>
                </div>
              }
              panelTemplate={
                <div>
                  <div className="m-1 mt-0 pb-2 text-base font-bold text-th-fgd-1">
                    {t('market-data')}
                  </div>
                  <div className="grid grid-flow-row grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
                    {outputTokenInfo.market_cap_rank ? (
                      <div className="m-1 rounded-md border border-th-bkg-4 p-3">
                        <div className="text-xs text-th-fgd-3">
                          {t('swap:market-cap-rank')}
                        </div>
                        <div className="text-lg font-bold text-th-fgd-1">
                          #{outputTokenInfo.market_cap_rank}
                        </div>
                      </div>
                    ) : null}
                    {outputTokenInfo.market_data?.market_cap &&
                    outputTokenInfo.market_data?.market_cap?.usd !== 0 ? (
                      <div className="m-1 rounded-md border border-th-bkg-4 p-3">
                        <div className="text-xs text-th-fgd-3">
                          {t('swap:market-cap')}
                        </div>
                        <div className="text-lg font-bold text-th-fgd-1">
                          $
                          {numberCompacter.format(
                            outputTokenInfo.market_data?.market_cap?.usd
                          )}
                        </div>
                      </div>
                    ) : null}
                    {outputTokenInfo.market_data?.total_volume?.usd ? (
                      <div className="m-1 rounded-md border border-th-bkg-4 p-3">
                        <div className="text-xs text-th-fgd-3">
                          {t('daily-volume')}
                        </div>
                        <div className="text-lg font-bold text-th-fgd-1">
                          $
                          {numberCompacter.format(
                            outputTokenInfo.market_data?.total_volume?.usd
                          )}
                        </div>
                      </div>
                    ) : null}
                    {outputTokenInfo.market_data?.circulating_supply ? (
                      <div className="m-1 rounded-md border border-th-bkg-4 p-3">
                        <div className="text-xs text-th-fgd-3">
                          {t('swap:token-supply')}
                        </div>
                        <div className="text-lg font-bold text-th-fgd-1">
                          {numberCompacter.format(
                            outputTokenInfo.market_data.circulating_supply
                          )}
                        </div>
                        {outputTokenInfo.market_data?.max_supply ? (
                          <div className="text-xs text-th-fgd-2">
                            {t('swap:max-supply')}:{' '}
                            {numberCompacter.format(
                              outputTokenInfo.market_data.max_supply
                            )}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    {outputTokenInfo.market_data?.ath?.usd ? (
                      <div className="m-1 rounded-md border border-th-bkg-4 p-3">
                        <div className="text-xs text-th-fgd-3">
                          {t('swap:ath')}
                        </div>
                        <div className="flex">
                          <div className="text-lg font-bold text-th-fgd-1">
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
                          <div className="text-xs text-th-fgd-2">
                            {dayjs(
                              outputTokenInfo.market_data.ath_date.usd
                            ).fromNow()}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    {outputTokenInfo.market_data?.atl?.usd ? (
                      <div className="m-1 rounded-md border border-th-bkg-4 p-3">
                        <div className="text-xs text-th-fgd-3">
                          {t('swap:atl')}
                        </div>
                        <div className="flex">
                          <div className="text-lg font-bold text-th-fgd-1">
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
                          <div className="text-xs text-th-fgd-2">
                            {dayjs(
                              outputTokenInfo.market_data.atl_date.usd
                            ).fromNow()}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  {topHolders?.inputHolders ? (
                    <div className="pt-4">
                      <div className="m-1 pb-3 text-base font-bold text-th-fgd-1">
                        {t('swap:top-ten')}
                      </div>
                      {topHolders.inputHolders.map((holder) => (
                        <a
                          className="default mx-1 flex justify-between border-t border-th-bkg-4 px-2 py-2.5 text-th-fgd-3 transition hover:bg-th-bkg-2"
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
                            <ExternalLinkIcon className="ml-2 h-4 w-4" />
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              }
            />
          </div>
        ) : (
          <div className="mt-3 rounded-md bg-th-bkg-3 p-4 text-center text-th-fgd-3">
            {t('swap:output-info-unavailable')}
          </div>
        )}
      </div>
    </div>
  )
}

export default SwapTokenInfo
