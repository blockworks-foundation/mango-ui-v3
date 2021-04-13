import { useEffect, useState } from 'react'
import styled from '@emotion/styled'
import { LineChart, Line, ReferenceLine, XAxis, YAxis, Tooltip } from 'recharts'
import useDimensions from 'react-cool-dimensions'
import { IDS, MangoClient } from '@blockworks-foundation/mango-client'
import { PublicKey, Connection } from '@solana/web3.js'
import { DEFAULT_MANGO_GROUP } from '../utils/mango'
import FloatingElement from '../components/FloatingElement'
import useConnection from '../hooks/useConnection'
import TopBar from '../components/TopBar'
import Select from '../components/Select'

const DECIMALS = {
  BTC: 4,
  ETH: 3,
  USDT: 2,
  USDC: 2,
  WUSDT: 2,
}

const icons = {
  BTC: '/assets/icons/btc.svg',
  ETH: '/assets/icons/eth.svg',
  USDT: '/assets/icons/usdt.svg',
  USDC: '/assets/icons/usdc.svg',
  WUSDT: '/assets/icons/usdt.svg',
}

const ChartLayover = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  color: #525a6a;
`

const ChartWrapper = styled.div`
  height: 100%;
  width: 100%;
`

const useMangoStats = () => {
  const [stats, setStats] = useState([
    {
      symbol: '',
      depositInterest: 0,
      borrowInterest: 0,
      totalDeposits: 0,
      totalBorrows: 0,
      utilization: '0',
    },
  ])
  const [latestStats, setLatestStats] = useState<any[]>([])
  const { cluster } = useConnection()

  useEffect(() => {
    const fetchStats = async () => {
      const response = await fetch(
        `https://mango-stats.herokuapp.com?mangoGroup=BTC_ETH_USDT`
      )
      const stats = await response.json()

      setStats(stats)
    }
    fetchStats()
  }, [])

  useEffect(() => {
    const getLatestStats = async () => {
      const client = new MangoClient()
      const connection = new Connection(
        IDS.cluster_urls[cluster],
        'singleGossip'
      )
      const assets = IDS[cluster].mango_groups?.[DEFAULT_MANGO_GROUP]?.symbols
      const mangoGroupId =
        IDS[cluster].mango_groups?.[DEFAULT_MANGO_GROUP]?.mango_group_pk
      if (!mangoGroupId) return
      const mangoGroupPk = new PublicKey(mangoGroupId)
      const mangoGroup = await client.getMangoGroup(connection, mangoGroupPk)
      const latestStats = Object.keys(assets).map((symbol, index) => {
        const totalDeposits = mangoGroup.getUiTotalDeposit(index)
        const totalBorrows = mangoGroup.getUiTotalBorrow(index)

        return {
          time: new Date(),
          symbol,
          totalDeposits,
          totalBorrows,
          depositInterest: mangoGroup.getDepositRate(index) * 100,
          borrowInterest: mangoGroup.getBorrowRate(index) * 100,
          utilization: totalDeposits > 0.0 ? totalBorrows / totalDeposits : 0.0,
        }
      })
      setLatestStats(latestStats)
    }

    getLatestStats()
  }, [cluster])

  return { latestStats, stats }
}

const StatsChart = ({ title, xAxis, yAxis, data, labelFormat }) => {
  const [mouseData, setMouseData] = useState<string | null>(null)
  // @ts-ignore
  const { observe, width, height } = useDimensions()

  const handleMouseMove = (coords) => {
    if (coords.activePayload) {
      setMouseData(coords.activePayload[0].payload)
    }
  }

  const handleMouseLeave = () => {
    setMouseData(null)
  }

  return (
    <ChartWrapper ref={observe}>
      <ChartLayover>
        <div>
          <strong>
            {title}
            {mouseData ? `: ${labelFormat(mouseData[yAxis])}` : null}
          </strong>
        </div>
        {mouseData ? (
          <div>
            <strong>
              Date
              {mouseData
                ? `: ${new Date(mouseData[xAxis]).toDateString()}`
                : null}
            </strong>
          </div>
        ) : null}
      </ChartLayover>
      {width > 0 ? (
        <LineChart
          width={width}
          height={height}
          margin={{ top: 50, right: 50 }}
          data={data}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <Tooltip
            cursor={{
              stroke: '#f7f7f7',
              strokeWidth: 1.5,
              strokeOpacity: 0.3,
              strokeDasharray: '6 5',
            }}
            content={<></>}
          />
          <Line
            isAnimationActive={false}
            type="linear"
            dot={false}
            dataKey={yAxis}
            stroke="#f2c94c"
            strokeWidth={2}
          />
          {mouseData ? (
            <ReferenceLine
              y={mouseData[yAxis]}
              strokeDasharray="6 5"
              strokeWidth={1.5}
              strokeOpacity={0.3}
            />
          ) : null}
          <XAxis dataKey={xAxis} hide />
          <YAxis dataKey={yAxis} hide />
        </LineChart>
      ) : null}
    </ChartWrapper>
  )
}

export default function StatsPage() {
  const [selectedAsset, setSelectedAsset] = useState<string>('BTC')
  const { latestStats, stats } = useMangoStats()

  const selectedStatsData = stats.filter(
    (stat) => stat.symbol === selectedAsset
  )

  return (
    <div className={`bg-th-bkg-1 text-th-fgd-1 transition-all `}>
      <TopBar />
      <div className="min-h-screen w-full lg:w-2/3 mx-auto p-1 sm:px-2 sm:py-1 md:px-6 md:py-1">
        <FloatingElement>
          <div className="text-center">
            <h1 className={`text-th-fgd-1 text-3xl`}>Mango Stats</h1>
          </div>
          <div className="hidden md:flex md:flex-col min-w-full">
            <table className="min-w-full">
              <thead className="">
                <tr>
                  <th scope="col" className="text-left py-4">
                    Asset
                  </th>
                  <th scope="col" className="text-left py-4">
                    Total Deposits
                  </th>
                  <th scope="col" className="text-left py-4">
                    Total Borrows
                  </th>
                  <th scope="col" className="text-left py-4">
                    Deposit Interest
                  </th>
                  <th scope="col" className="text-left py-4">
                    Borrow Interest
                  </th>
                  <th scope="col" className="text-left py-4">
                    Utilization
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-600">
                {latestStats.map((stat) => (
                  <tr key={stat.symbol}>
                    <td className="flex items-center text-left py-4">
                      <img src={icons[stat.symbol]} alt={icons[stat.symbol]} />
                      <button
                        onClick={() => setSelectedAsset(stat.symbol)}
                        className="text-th-primary cursor-pointer ml-2"
                      >
                        <div style={{ width: '100%' }}>{stat.symbol}</div>
                      </button>
                    </td>
                    <td className="text-left py-4">
                      {stat.totalDeposits.toFixed(DECIMALS[stat.symbol])}
                    </td>
                    <td className="text-left py-4">
                      {stat.totalBorrows.toFixed(DECIMALS[stat.symbol])}
                    </td>
                    <td className="text-left py-4">
                      {stat.depositInterest.toFixed(2)}%
                    </td>
                    <td className="text-left py-4">
                      {stat.borrowInterest.toFixed(2)}%
                    </td>
                    <td className="text-left py-4">
                      {(parseFloat(stat.utilization) * 100).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FloatingElement>
        {selectedAsset ? (
          <FloatingElement shrink>
            <div className="flex justify-center text-2xl">
              <span className={`text-th-fgd-1`}>Historical</span>
              <Select
                className="mx-4 text-lg"
                value={selectedAsset}
                onChange={(val) => setSelectedAsset(val)}
              >
                {latestStats.map(({ symbol }) => (
                  <Select.Option key={symbol} value={symbol}>
                    {symbol}
                  </Select.Option>
                ))}
              </Select>
              <span className={`text-th-fgd-1`}>Stats</span>
            </div>

            <div className="flex flex-col md:flex-row mt-2">
              <div
                className="relative my-2 md:w-1/2"
                style={{ height: '300px' }}
              >
                <StatsChart
                  title="Total Deposits"
                  xAxis="time"
                  yAxis="totalDeposits"
                  data={selectedStatsData}
                  labelFormat={(x) => x.toFixed(DECIMALS[selectedAsset])}
                />
              </div>
              <div
                className="relative my-2 md:w-1/2"
                style={{ height: '300px' }}
              >
                <StatsChart
                  title="Total Borrows"
                  xAxis="time"
                  yAxis="totalBorrows"
                  data={selectedStatsData}
                  labelFormat={(x) => x.toFixed(DECIMALS[selectedAsset])}
                />
              </div>
            </div>
            <div className="flex flex-col md:flex-row">
              <div
                className="relative my-2 md:w-1/2"
                style={{ height: '300px' }}
              >
                <StatsChart
                  title="Deposit Interest"
                  xAxis="time"
                  yAxis="depositInterest"
                  data={selectedStatsData}
                  labelFormat={(x) => `${(x * 100).toFixed(5)}%`}
                />
              </div>
              <div
                className="relative my-2 md:w-1/2"
                style={{ height: '300px' }}
              >
                <StatsChart
                  title="Borrow Interest"
                  xAxis="time"
                  yAxis="borrowInterest"
                  data={selectedStatsData}
                  labelFormat={(x) => `${(x * 100).toFixed(5)}%`}
                />
              </div>
            </div>
          </FloatingElement>
        ) : null}
      </div>
    </div>
  )
}
