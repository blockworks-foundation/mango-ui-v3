import React, { useMemo } from 'react'
import { Listbox } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/solid'
import { isEqual } from '../utils'

const GroupSize = ({ tickSize, value, onChange, className = '' }) => {
  const sizes = useMemo(
    () => [
      tickSize,
      tickSize * 5,
      tickSize * 10,
      tickSize * 50,
      tickSize * 100,
    ],
    [tickSize]
  )

  return (
    <div className={`relative ${className}`}>
      <Listbox value={value} onChange={onChange}>
        {({ open }) => (
          <>
            <Listbox.Button
              className={`bg-th-bkg-1 border border-th-bkg-4 font-normal py-0.5 hover:border-th-fgd-4 rounded focus:outline-none focus:border-th-fgd-4`}
            >
              <div
                className={`flex items-center justify-between space-x-1 pr-1 pl-2 text-xs`}
              >
                <span>{value}</span>

                <ChevronDownIcon
                  className={`default-transition h-4 w-4 text-th-fgd-1 ${
                    open ? 'transform rotate-180' : 'transform rotate-360'
                  }`}
                />
              </div>
            </Listbox.Button>
            {open ? (
              <Listbox.Options
                static
                className={`absolute bg-th-bkg-3 left-0 max-h-60 mt-1 overflow-auto outline-none p-2 rounded-md text-th-fgd-1 thin-scroll top-5 w-full z-20`}
              >
                {sizes.map((size) => (
                  <Listbox.Option key={size} value={size}>
                    {({ selected }) => (
                      <div
                        className={`default-transition py-1.5 text-th-fgd-1 hover:bg-th-bkg-3 hover:cursor-pointer hover:text-th-primary text-right ${
                          selected && `text-th-primary`
                        }`}
                      >
                        {size}
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

export default React.memo(GroupSize, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps, ['tickSize', 'value'])
)
