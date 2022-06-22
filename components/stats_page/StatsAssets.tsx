import { useState } from 'react'
import Chart from '../Chart'
import { useTranslation } from 'next-i18next'
import TabButtons from 'components/TabButtons'

export default function StatsAssets({ latestStats, stats }) {
  const { t } = useTranslation('common')
  const [selectedAsset, setSelectedAsset] = useState<string>('BTC')

  const selectedStatsData = stats.filter((stat) => stat.name === selectedAsset)

  return (
    <>
      <div className="mb-4 flex flex-row-reverse items-center justify-between md:flex-col md:items-stretch">
        <div className="mb-2">
          <TabButtons
            activeTab={selectedAsset}
            tabs={latestStats.map((s) => ({ label: s.name, key: s.name }))}
            onClick={setSelectedAsset}
            showSymbolIcon
          />
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
