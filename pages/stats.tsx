import { useEffect, useState } from 'react'
import styled from '@emotion/styled'
import { Button, Select } from 'antd'
import { LineChart, Line, ReferenceLine, XAxis, YAxis, Tooltip } from 'recharts'
import useDimensions from 'react-cool-dimensions'
import { IDS, MangoClient } from '@blockworks-foundation/mango-client'
import { PublicKey, Connection } from '@solana/web3.js'
import { DEFAULT_MANGO_GROUP } from '../utils/mango'
import FloatingElement from '../components/FloatingElement'
import useConnection from '../hooks/useConnection'
import TopBar from '../components/TopBar'

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

const Wrapper = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px 16px;
`

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
    <Wrapper>
      <TopBar />
      <div className="px-48">
        <FloatingElement>
          <>
            <div className="text-center">
              <h1 className={`text-white text-lg`}>Mango Stats</h1>
            </div>
            <div className="flex justify-between divide">
              <div>Asset</div>
              <div>Total Deposits</div>
              <div>Total Borrows</div>
              <div>Deposit Interest</div>
              <div>Borrow Interest</div>
              <div>Utilization</div>
            </div>
            <div className="divide-y divide-gray-600">
              {latestStats.map((stat) => (
                <div key={stat.symbol} className="flex justify-between py-4">
                  <div className="flex items-center">
                    <img src={icons[stat.symbol]} alt={icons[stat.symbol]} />
                    <button
                      onClick={() => setSelectedAsset(stat.symbol)}
                      className="text-th-primary cursor-pointer ml-2"
                    >
                      <div style={{ width: '100%' }}>{stat.symbol}</div>
                    </button>
                  </div>
                  <div>{stat.totalDeposits.toFixed(DECIMALS[stat.symbol])}</div>
                  <div>{stat.totalBorrows.toFixed(DECIMALS[stat.symbol])}</div>
                  <div>{stat.depositInterest.toFixed(2)}%</div>
                  <div>{stat.borrowInterest.toFixed(2)}%</div>
                  <div>{(parseFloat(stat.utilization) * 100).toFixed(2)}%</div>
                </div>
              ))}
            </div>
          </>
        </FloatingElement>
        {selectedAsset ? (
          <FloatingElement shrink>
            <div className="flex justify-center text-lg">
              <span className={`text-white`}>Historical</span>
              <Select
                style={{ margin: '0px 8px', fontSize: 16 }}
                value={selectedAsset}
                onChange={(val) => setSelectedAsset(val)}
              >
                {latestStats.map(({ symbol }) => (
                  <Select.Option key={symbol} value={symbol}>
                    {symbol}
                  </Select.Option>
                ))}
              </Select>
              <span className={`text-white`}>Stats</span>
            </div>

            <div className="flex flex-row mt-2">
              <div className="relative w-1/2" style={{ height: '300px' }}>
                <StatsChart
                  title="Total Deposits"
                  xAxis="time"
                  yAxis="totalDeposits"
                  data={selectedStatsData}
                  labelFormat={(x) => x.toFixed(DECIMALS[selectedAsset])}
                />
              </div>
              <div className="relative w-1/2" style={{ height: '300px' }}>
                <StatsChart
                  title="Total Borrows"
                  xAxis="time"
                  yAxis="totalBorrows"
                  data={selectedStatsData}
                  labelFormat={(x) => x.toFixed(DECIMALS[selectedAsset])}
                />
              </div>
            </div>
            <div className="flex flex-row" style={{ margin: '50px 0' }}>
              <div className="relative w-1/2" style={{ height: '300px' }}>
                <StatsChart
                  title="Deposit Interest"
                  xAxis="time"
                  yAxis="depositInterest"
                  data={selectedStatsData}
                  labelFormat={(x) => `${(x * 100).toFixed(5)}%`}
                />
              </div>
              <div className="relative w-1/2" style={{ height: '300px' }}>
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
    </Wrapper>
  )
}
