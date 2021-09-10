import { useState } from 'react'
import TradeHistoryTable from '../TradeHistoryTable'

// const historyViews = ['Trades', 'Deposits', 'Withdrawals', 'Liquidations']

export default function AccountHistory() {
  const [view] = useState('Trades')
  return (
    <>
      <div className="flex items-center justify-between mb-3 sm:mt-1">
        <div className="text-th-fgd-1 text-lg">Trade History</div>
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
      </div>
      <ViewContent view={view} />
    </>
  )
}

const ViewContent = ({ view }) => {
  switch (view) {
    case 'Trades':
      return <TradeHistoryTable />
    case 'Deposits':
      return <div>Deposits</div>
    case 'Withdrawals':
      return <div>Withdrawals</div>
    case 'Liquidations':
      return <div>Liquidations</div>
    default:
      return <TradeHistoryTable />
  }
}
