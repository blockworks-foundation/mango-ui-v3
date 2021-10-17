import { useState } from 'react'
import TradeHistoryTable from '../TradeHistoryTable'
import { useTranslation } from 'next-i18next'

// const historyViews = ['Trades', 'Deposits', 'Withdrawals', 'Liquidations']

export default function AccountHistory() {
  const { t } = useTranslation('common')
  const [view] = useState('Trades')
  return (
    <>
      <div className="pb-3.5 text-th-fgd-1 text-base">{t('trade-history')}</div>
      {/* Todo: add this back when the data is available */}
      {/* <div className="flex">
          {historyViews.map((section) => (
            <div
              className={`border px-3 py-1.5 mr-2 rounded cursor-pointer default-transition
              ${
                view === section
                  ? `bg-th-bkg-3 border-th-bkg-3 text-th-primary`
                  : `border-th-fgd-4 text-th-fgd-1 opacity-80 hover:opacity-100`
              }
            `}
              onClick={() => setView(section)}
              key={section as string}
            >
              {section}
            </div>
          ))}
        </div> */}
      <ViewContent view={view} />
    </>
  )
}

const ViewContent = ({ view }) => {
  const { t } = useTranslation('common')

  switch (view) {
    case 'Trades':
      return <TradeHistoryTable />
    case 'Deposits':
      return <div>{t('deposits')}</div>
    case 'Withdrawals':
      return <div>Withdrawals</div>
    case 'Liquidations':
      return <div>Liquidations</div>
    default:
      return <TradeHistoryTable />
  }
}
