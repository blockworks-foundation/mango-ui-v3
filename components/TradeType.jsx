import { Listbox } from '@headlessui/react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/solid'

const TRADE_TYPES = ['Limit', 'Market']

const TradeType = ({ value, onChange, className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      <Listbox value={value} onChange={onChange}>
        {({ open }) => (
          <>
            <Listbox.Button
              className={`h-full w-full border-l border-th-fgd-4 focus:outline-none focus:ring-1 focus:ring-th-primary`}
            >
              <div
                className={`flex items-center justify-between space-x-4 font-light pl-2`}
              >
                <span>{value}</span>
                {open ? (
                  <ChevronUpIcon className={`h-5 w-5 mr-1`} />
                ) : (
                  <ChevronDownIcon className={`h-5 w-5 mr-1`} />
                )}
              </div>
            </Listbox.Button>
            {open ? (
              <Listbox.Options
                static
                className={`z-20 w-full p-1 absolute left-0 mt-1 bg-th-bkg-3 origin-top-left divide-y divide-th-fgd-4 shadow-lg outline-none`}
              >
                {TRADE_TYPES.map((type) => (
                  <Listbox.Option key={type} value={type}>
                    {({ selected }) => (
                      <div
                        className={`p-2 text-base hover:bg-th-fgd-4 hover:cursor-pointer tracking-wider font-light ${
                          selected && `text-th-primary`
                        }`}
                      >
                        {type}
                      </div>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            ) : null}
          </>
        )}
      </Listbox>
    </div>
  )
}

export default TradeType
