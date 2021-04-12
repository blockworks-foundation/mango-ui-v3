import React, { useEffect, useState } from 'react'
import styled from '@emotion/styled'
import { Col, Row, Button, Divider, Select } from 'antd'
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
  .borderNone .ant-select-selector {
    border: none !important;
  }
`

const SizeTitle = styled(Row)`
  padding: 20px 0 14px;
  color: #525a6a;
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
      <Row justify="center">
        <Col lg={24} xl={18} xxl={12}>
          <FloatingElement shrink>
            <React.Fragment>
              <Divider>
                <span className={`text-white`}>Mango Stats</span>
              </Divider>
              <SizeTitle>
                <Col span={1}></Col>
                <Col span={3}>Asset</Col>
                <Col span={4}>Total Deposits</Col>
                <Col span={4}>Total Borrows</Col>
                <Col span={4}>Deposit Interest</Col>
                <Col span={4}>Borrow Interest</Col>
                <Col span={4}>Utilization</Col>
              </SizeTitle>
              {latestStats.map((stat) => (
                <div key={stat.symbol}>
                  <Divider />
                  <Row>
                    <Col span={1}>
                      <img src={icons[stat.symbol]} alt={icons[stat.symbol]} />
                    </Col>
                    <Col span={3}>
                      <Button
                        type="link"
                        onClick={() => setSelectedAsset(stat.symbol)}
                      >
                        <div style={{ width: '100%' }}>{stat.symbol}</div>
                      </Button>
                    </Col>
                    <Col span={4}>
                      {stat.totalDeposits.toFixed(DECIMALS[stat.symbol])}
                    </Col>
                    <Col span={4}>
                      {stat.totalBorrows.toFixed(DECIMALS[stat.symbol])}
                    </Col>
                    <Col span={4}>{stat.depositInterest.toFixed(2)}%</Col>
                    <Col span={4}>{stat.borrowInterest.toFixed(2)}%</Col>
                    <Col span={4}>
                      {(parseFloat(stat.utilization) * 100).toFixed(2)}%
                    </Col>
                  </Row>
                </div>
              ))}
            </React.Fragment>
          </FloatingElement>
          {selectedAsset ? (
            <FloatingElement shrink>
              <Divider>
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
              </Divider>

              <Row>
                <Col span={12} style={{ height: '300px' }}>
                  <StatsChart
                    title="Total Deposits"
                    xAxis="time"
                    yAxis="totalDeposits"
                    data={selectedStatsData}
                    labelFormat={(x) => x.toFixed(DECIMALS[selectedAsset])}
                  />
                </Col>
                <Col span={12} style={{ height: '300px' }}>
                  <StatsChart
                    title="Total Borrows"
                    xAxis="time"
                    yAxis="totalBorrows"
                    data={selectedStatsData}
                    labelFormat={(x) => x.toFixed(DECIMALS[selectedAsset])}
                  />
                </Col>
              </Row>
              <Row style={{ margin: '50px 0' }}>
                <Col span={12} style={{ height: '300px' }}>
                  <StatsChart
                    title="Deposit Interest"
                    xAxis="time"
                    yAxis="depositInterest"
                    data={selectedStatsData}
                    labelFormat={(x) => `${(x * 100).toFixed(5)}%`}
                  />
                </Col>
                <Col span={12} style={{ height: '300px' }}>
                  <StatsChart
                    title="Borrow Interest"
                    xAxis="time"
                    yAxis="borrowInterest"
                    data={selectedStatsData}
                    labelFormat={(x) => `${(x * 100).toFixed(5)}%`}
                  />
                </Col>
              </Row>
            </FloatingElement>
          ) : null}
        </Col>
      </Row>
    </Wrapper>
  )
}
