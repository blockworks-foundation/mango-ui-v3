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
      <div className="mb-4 flex flex-row-reverse items-center justify-between md:flex-col md:items-stretch">
        <Select
          value={selectedAsset}
          onChange={(a) => setSelectedAsset(a)}
          className="w-24 md:hidden"
        >
          {latestStats.map((stat) => (
            <Select.Option key={stat.name} value={stat.name}>
              {stat.name}
            </Select.Option>
          ))}
        </Select>
        <div className="mb-4 hidden rounded-md bg-th-bkg-3 px-3 py-2 md:mb-6 md:flex md:px-4">
          {latestStats.map((stat, index) => (
            <div
              className={`py-1 text-xs font-bold md:px-2 md:text-sm ${
                index > 0 ? 'ml-4 md:ml-2' : null
              } default-transition cursor-pointer rounded-md
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
          <h2>{selectedAsset}</h2>
        </div>
      </div>
      <div className="grid grid-flow-col grid-cols-1 grid-rows-4 gap-2 sm:gap-4 md:grid-cols-2 md:grid-rows-2">
        <div
          className="relative rounded-md border border-th-bkg-3 p-4 md:mb-0"
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
          className="relative rounded-md border border-th-bkg-3 p-4"
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
          className="relative rounded-md border border-th-bkg-3 p-4 md:mb-0"
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
          className="relative rounded-md border border-th-bkg-3 p-4"
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
