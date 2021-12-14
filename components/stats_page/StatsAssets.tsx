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
      <div className="flex flex-row-reverse items-center md:items-stretch justify-between md:flex-col mb-4">
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
        <div className="bg-th-bkg-3 hidden md:flex mb-4 md:mb-6 md:-mt-6 md:-mx-6 px-3 md:px-4 py-2 rounded-md md:rounded-none md:rounded-t-md">
          {latestStats.map((stat, index) => (
            <div
              className={`md:px-2 py-1 text-xs md:text-sm ${
                index > 0 ? 'ml-4 md:ml-2' : null
              } rounded-md cursor-pointer default-transition
                          ${
                            selectedAsset === stat.name
                              ? `text-th-primary`
                              : `text-th-fgd-3 hover:text-th-fgd-1`
                          }
                        `}
              onClick={() => setSelectedAsset(stat.name)}
              key={stat.name as string}
            >
              {stat.name}
            </div>
          ))}
        </div>
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
