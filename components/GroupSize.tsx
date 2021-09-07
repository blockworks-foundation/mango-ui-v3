import React, { useMemo } from 'react'
import { Listbox } from '@headlessui/react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/solid'
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
    <div className={`${className}`}>
      <Listbox value={value} onChange={onChange}>
        {({ open }) => (
          <>
            <Listbox.Button
              className={`font-normal border border-th-bkg-4 hover:border-th-primary rounded focus:outline-none focus:border-th-primary`}
            >
              <div
                className={`flex items-center justify-between space-x-1 pr-1 pl-2`}
              >
                <span>{value}</span>

                {open ? (
                  <ChevronUpIcon className={`h-5 w-5 text-th-primary`} />
                ) : (
                  <ChevronDownIcon className={`h-5 w-5 text-th-primary`} />
                )}
              </div>
            </Listbox.Button>
            {open ? (
              <Listbox.Options
                static
                className={`z-40 p-1 absolute top-full right-0 mt-1 bg-th-bkg-1 origin-top-left divide-y divide-th-bkg-3 shadow-lg outline-none rounded-md`}
              >
                {sizes.map((size) => (
                  <Listbox.Option key={size} value={size}>
                    {({ selected }) => (
                      <div
                        className={`pl-6 p-1 text-right hover:bg-th-bkg-2 hover:cursor-pointer tracking-wider ${
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
