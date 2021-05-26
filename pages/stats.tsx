import { useEffect, useState } from 'react'
import { LineChart, Line, ReferenceLine, XAxis, YAxis, Tooltip } from 'recharts'
import useDimensions from 'react-cool-dimensions'
import { IDS, MangoClient } from '@blockworks-foundation/mango-client'
import { PublicKey, Connection } from '@solana/web3.js'
import { DEFAULT_MANGO_GROUP } from '../utils/mango'
import useConnection from '../hooks/useConnection'
import TopBar from '../components/TopBar'
import { formatBalanceDisplay } from '../utils/index'
import { Table, Thead, Tbody, Tr, Th, Td } from 'react-super-responsive-table'

const DECIMALS = {
  BTC: 4,
  ETH: 3,
  SOL: 2,
  SRM: 2,
  USDT: 2,
  USDC: 2,
}

const icons = {
  BTC: '/assets/icons/btc.svg',
  ETH: '/assets/icons/eth.svg',
  SOL: '/assets/icons/sol.svg',
  SRM: '/assets/icons/srm.svg',
  USDT: '/assets/icons/usdt.svg',
  USDC: '/assets/icons/usdc.svg',
  WUSDT: '/assets/icons/usdt.svg',
}

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
        `https://mango-stats.herokuapp.com?mangoGroup=BTC_ETH_SOL_SRM_USDC`
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
    <div className="h-full w-full" ref={observe}>
      <div className="absolute -top-4 left-0 h-full w-full pb-4">
        <div className="text-center text-th-fgd-1 text-base font-semibold">
          {title}
        </div>
        {mouseData ? (
          <div className="text-center pt-1">
            <div className="text-sm font-normal text-th-fgd-3">
              {labelFormat(mouseData[yAxis])}
            </div>
            <div className="text-xs font-normal text-th-fgd-4">
              {new Date(mouseData[xAxis]).toDateString()}
            </div>
          </div>
        ) : null}
      </div>
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
    </div>
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
      <div className="min-h-screen w-full xl:w-3/4 mx-auto px-4 sm:px-6 sm:py-1 md:px-8 md:py-1 lg:px-12">
        <div className="text-center pt-8 pb-6 md:pt-10">
          <h1 className={`text-th-fgd-1 text-2xl font-semibold`}>
            Mango Stats
          </h1>
        </div>
        <div className="md:flex md:flex-col min-w-full">
          <Table className="min-w-full divide-y divide-th-bkg-2">
            <Thead>
              <Tr className="text-th-fgd-3">
                <Th scope="col" className="px-6 py-3 text-left font-normal">
                  Asset
                </Th>
                <Th scope="col" className="px-6 py-3 text-left font-normal">
                  Total Deposits
                </Th>
                <Th scope="col" className="px-6 py-3 text-left font-normal">
                  Total Borrows
                </Th>
                <Th scope="col" className="px-6 py-3 text-left font-normal">
                  Deposit Interest
                </Th>
                <Th scope="col" className="px-6 py-3 text-left font-normal">
                  Borrow Interest
                </Th>
                <Th scope="col" className="px-6 py-3 text-left font-normal">
                  Utilization
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {latestStats.map((stat, index) => (
                <Tr
                  key={stat.symbol}
                  className={`border-b border-th-bkg-2
                  ${index % 2 === 0 ? `bg-th-bkg-2` : `bg-th-bkg-1`}
                `}
                >
                  <Td className="px-6 py-4 whitespace-nowrap text-sm text-th-fgd-1">
                    <div className="flex items-center">
                      <img
                        src={icons[stat.symbol]}
                        alt={icons[stat.symbol]}
                        className="w-5 h-5 md:w-6 md:h-6"
                      />
                      <button
                        onClick={() => setSelectedAsset(stat.symbol)}
                        className="underline cursor-pointer ml-3 hover:text-th-primary hover:no-underline"
                      >
                        {stat.symbol}
                      </button>
                    </div>
                  </Td>
                  <Td className="px-6 py-4 whitespace-nowrap text-sm text-th-fgd-1">
                    {formatBalanceDisplay(
                      stat.totalDeposits,
                      DECIMALS[stat.symbol]
                    ).toLocaleString(undefined, {
                      maximumFractionDigits: DECIMALS[stat.symbol],
                    })}
                  </Td>
                  <Td className="px-6 py-4 whitespace-nowrap text-sm text-th-fgd-1">
                    {formatBalanceDisplay(
                      stat.totalBorrows,
                      DECIMALS[stat.symbol]
                    ).toLocaleString(undefined, {
                      maximumFractionDigits: DECIMALS[stat.symbol],
                    })}
                  </Td>
                  <Td className="px-6 py-4 whitespace-nowrap text-sm text-th-fgd-1">
                    {stat.depositInterest.toFixed(2)}%
                  </Td>
                  <Td className="px-6 py-4 whitespace-nowrap text-sm text-th-fgd-1">
                    {stat.borrowInterest.toFixed(2)}%
                  </Td>
                  <Td className="px-6 py-4 whitespace-nowrap text-sm text-th-fgd-1">
                    {(parseFloat(stat.utilization) * 100).toFixed(2)}%
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </div>
        {selectedAsset ? (
          <div className="py-10 md:py-14">
            <div className="flex flex-col items-center pb-12">
              <h2 className="text-th-fgd-1 text-center text-2xl font-semibold mb-4">
                Historical Stats
              </h2>
              <div className="flex self-center">
                {latestStats.map((stat) => (
                  <div
                    className={`px-2 py-1 mr-2 rounded-md cursor-pointer default-transition bg-th-bkg-3
              ${
                selectedAsset === stat.symbol
                  ? `text-th-primary`
                  : `text-th-fgd-1 opacity-50 hover:opacity-100`
              }
            `}
                    onClick={() => setSelectedAsset(stat.symbol)}
                    key={stat.symbol as string}
                  >
                    {stat.symbol}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col md:flex-row pb-14">
              <div
                className="relative my-2 pb-14 md:pb-0 md:w-1/2"
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
                className="relative my-2 pb-14 md:pb-0 md:w-1/2"
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
          </div>
        ) : null}
      </div>
    </div>
  )
}
