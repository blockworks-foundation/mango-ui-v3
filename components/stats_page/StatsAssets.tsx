import { useState } from 'react'
import Chart from '../Chart'
import Select from '../Select'
import { useTranslation } from 'next-i18next'

export default function StatsAssets({ latestStats, stats }) {
  const { t } = useTranslation('common')
  const [selectedAsset, setSelectedAsset] = useState<string>('BTC')

  const selectedStatsData = stats.filter((stat) => stat.name === selectedAsset)

  return (
    <>
      <div className="flex items-center justify-between mb-4 w-full">
        <div className="flex items-center text-xl text-th-fgd-1">
          <img
            width="24"
            height="24"
            src={`/assets/icons/${selectedAsset
              .split(/-|\//)[0]
              .toLowerCase()}.svg`}
            className="mr-2.5"
          />
          {selectedAsset}
        </div>
        <Select
          value={selectedAsset}
          onChange={(a) => setSelectedAsset(a)}
          className="w-24 md:hidden"
        >
          <div className="space-y-2">
            {latestStats.map((stat) => (
              <Select.Option
                key={stat.name}
                value={stat.name}
                className={`bg-th-bkg-1 relative rounded-md w-full px-3 py-3 cursor-pointer default-transition flex hover:bg-th-bkg-3 focus:outline-none`}
              >
                <div className="flex items-center justify-between w-full">
                  {stat.name}
                </div>
              </Select.Option>
            ))}
          </div>
        </Select>
        <div className="hidden md:flex pb-4 sm:pb-0">
          {latestStats.map((stat) => (
            <div
              className={`px-2 py-1 ml-2 rounded-md cursor-pointer default-transition bg-th-bkg-3
              ${
                selectedAsset === stat.name
                  ? `ring-1 ring-inset ring-th-primary text-th-primary`
                  : `text-th-fgd-1 opacity-50 hover:opacity-100`
              }
            `}
              onClick={() => setSelectedAsset(stat.name)}
              key={stat.name as string}
            >
              {stat.name}
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-flow-col grid-cols-1 grid-rows-4 md:grid-cols-2 md:grid-rows-2 gap-2 sm:gap-4">
        <div
          className="border border-th-bkg-4 relative md:mb-0 p-4 rounded-md"
          style={{ height: '330px' }}
        >
          <Chart
            title={t('total-deposits')}
            xAxis="time"
            yAxis="totalDeposits"
            data={selectedStatsData}
            labelFormat={(x) =>
              x.toLocaleString(undefined, { maximumFractionDigits: 2 })
            }
            type="area"
          />
        </div>
        <div
          className="border border-th-bkg-4 relative p-4 rounded-md"
          style={{ height: '330px' }}
        >
          <Chart
            title={t('deposit-interest')}
            xAxis="time"
            yAxis="depositRate"
            data={selectedStatsData}
            labelFormat={(x) => `${(x * 100).toFixed(5)}%`}
            tickFormat={(x) =>
              (x * 100).toLocaleString(undefined, { maximumFractionDigits: 4 })
            }
            type="bar"
          />
        </div>
        <div
          className="border border-th-bkg-4 relative md:mb-0 p-4 rounded-md"
          style={{ height: '330px' }}
        >
          <Chart
            title={t('total-borrows')}
            xAxis="time"
            yAxis="totalBorrows"
            data={selectedStatsData}
            labelFormat={(x) =>
              x.toLocaleString(undefined, { maximumFractionDigits: 2 })
            }
            type="area"
          />
        </div>
        <div
          className="border border-th-bkg-4 relative p-4 rounded-md"
          style={{ height: '330px' }}
        >
          <Chart
            title={t('borrow-interest')}
            xAxis="time"
            yAxis="borrowRate"
            data={selectedStatsData}
            labelFormat={(x) => `${(x * 100).toFixed(5)}%`}
            tickFormat={(x) =>
              (x * 100).toLocaleString(undefined, { maximumFractionDigits: 4 })
            }
            type="bar"
          />
        </div>
      </div>
    </>
  )
}
