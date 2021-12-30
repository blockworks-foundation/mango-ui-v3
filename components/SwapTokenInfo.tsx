import { FunctionComponent, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'
import useDimensions from 'react-cool-dimensions'

interface SwapTokenInfoProps {
  inputTokenId?: string
  inputTokenSymbol?: string
  outputTokenId?: string
}

const SwapTokenInfo: FunctionComponent<SwapTokenInfoProps> = ({
  inputTokenId,
  inputTokenSymbol,
  outputTokenId,
}) => {
  const [chartData, setChartData] = useState(null)
  const [outputTokenInfo, setOutputTokenInfo] = useState(null)
  const [mouseData, setMouseData] = useState<string | null>(null)
  const [daysToShow, setDaysToShow] = useState(1)
  const { observe, width, height } = useDimensions()

  const handleMouseMove = (coords) => {
    if (coords.activePayload) {
      setMouseData(coords.activePayload[0].payload)
    }
  }

  const handleMouseLeave = () => {
    setMouseData(null)
  }

  const getChartData = async () => {
    const inputResponse = await fetch(
      `https://api.coingecko.com/api/v3/coins/${inputTokenId}/ohlc?vs_currency=usd&days=${daysToShow}`
    )
    const outputResponse = await fetch(
      `https://api.coingecko.com/api/v3/coins/${outputTokenId}/ohlc?vs_currency=usd&days=${daysToShow}`
    )
    const inputData = await inputResponse.json()
    const outputData = await outputResponse.json()

    // let data
    // if (inputData.length === outputData.length) {
    //   data = inputData.concat(outputData)
    // } else {
    //   const difference = inputData.length - outputData.length
    //   if (difference > 0) {
    //     const trimmedInputData = inputData.slice(0, difference * -1)
    //     data = trimmedInputData.concat(outputData)
    //   } else {
    //     const trimmedOutputData = outputData.slice(0, difference)
    //     data = inputData.concat(trimmedOutputData)
    //   }
    // }

    const data = inputData.concat(outputData)

    const formattedData = data.reduce((a, c) => {
      const found = a.find((price) => price.time === c[0])
      if (found) {
        found.price = found.inputPrice / c[4]
      } else {
        a.push({ time: c[0], inputPrice: c[4] })
      }
      return a
    }, [])
    setChartData(formattedData.filter((d) => d.price))
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
    if (inputTokenId && outputTokenId) {
      getChartData()
    }
  }, [daysToShow, inputTokenId, outputTokenId])

  useMemo(() => {
    if (outputTokenId) {
      getOutputTokenInfo()
    }
  }, [outputTokenId])

  console.log(outputTokenInfo)

  return (
    <div>
      {chartData ? (
        <div className="p-4">
          <div className="flex justify-between">
            <div>
              {inputTokenSymbol && outputTokenInfo ? (
                <div className="text-th-fgd-3 text-sm">{`${inputTokenSymbol.toUpperCase()}/${outputTokenInfo.symbol.toUpperCase()}`}</div>
              ) : null}
              {mouseData ? (
                <>
                  <div className="font-bold text-lg text-th-fgd-1">
                    {mouseData['price'].toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 6,
                    })}
                  </div>
                  <div className="text-xs font-normal text-th-fgd-4">
                    {dayjs(mouseData['time']).format('DD MMM YY, h:mma')}
                  </div>
                </>
              ) : (
                <>
                  <div className="font-bold text-lg text-th-fgd-1">
                    {chartData[chartData.length - 1]['price'].toLocaleString(
                      undefined,
                      {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 6,
                      }
                    )}
                  </div>
                  <div className="text-xs font-normal text-th-fgd-4">
                    {dayjs(chartData[chartData.length - 1]['time']).format(
                      'DD MMM YY, h:mma'
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="flex h-5">
              <button
                className={`default-transition font-bold mx-3 text-th-fgd-1 text-xs hover:text-th-primary focus:outline-none ${
                  daysToShow === 1 && 'text-th-primary'
                }`}
                onClick={() => setDaysToShow(1)}
              >
                24H
              </button>
              <button
                className={`default-transition font-bold mx-3 text-th-fgd-1 text-xs hover:text-th-primary focus:outline-none ${
                  daysToShow === 7 && 'text-th-primary'
                }`}
                onClick={() => setDaysToShow(7)}
              >
                7D
              </button>
              <button
                className={`default-transition font-bold ml-3 text-th-fgd-1 text-xs hover:text-th-primary focus:outline-none ${
                  daysToShow === 30 && 'text-th-primary'
                }`}
                onClick={() => setDaysToShow(30)}
              >
                30D
              </button>
            </div>
          </div>
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
                  <stop offset="0%" stopColor="#FF9C24" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#FF9C24" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                isAnimationActive={true}
                type="monotone"
                dataKey="price"
                stroke="#FF9C24"
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
          </div>
        </div>
      ) : (
        <div className="bg-th-bkg-3 p-4 rounded-md text-center text-th-fgd-3">
          Chart not available
        </div>
      )}
      {outputTokenInfo ? (
        <div className="mt-6">
          <h2 className="font-bold px-4 text-lg text-th-fgd-1">
            {outputTokenInfo.name}
          </h2>
          <div className="grid grid-flow-col grid-rows-2 mt-2 px-3">
            {outputTokenInfo.market_cap_rank ? (
              <div className="border border-th-bkg-4 m-1 p-3 rounded-md">
                <div className="text-th-fgd-4 text-xs">Market Cap Rank</div>
                <div className="font-bold text-th-fgd-1 text-lg">
                  #{outputTokenInfo.market_cap_rank}
                </div>
              </div>
            ) : null}
            {outputTokenInfo.market_data?.market_cap ? (
              <div className="border border-th-bkg-4 m-1 p-3 rounded-md">
                <div className="text-th-fgd-4 text-xs">Market Cap</div>
                <div className="font-bold text-th-fgd-1 text-lg">
                  $
                  {outputTokenInfo.market_data?.market_cap?.usd.toLocaleString()}
                </div>
              </div>
            ) : null}
            {outputTokenInfo.market_cap_rank ? (
              <div className="border border-th-bkg-4 m-1 p-3 rounded-md">
                <div className="text-th-fgd-4 text-xs">Market Cap Rank</div>
                <div className="font-bold text-th-fgd-1 text-lg">
                  #{outputTokenInfo.market_cap_rank}
                </div>
              </div>
            ) : null}
            {outputTokenInfo.market_data?.market_cap ? (
              <div className="border border-th-bkg-4 m-1 p-3 rounded-md">
                <div className="text-th-fgd-4 text-xs">Market Cap</div>
                <div className="font-bold text-th-fgd-1 text-lg">
                  $
                  {outputTokenInfo.market_data?.market_cap?.usd.toLocaleString()}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default SwapTokenInfo
