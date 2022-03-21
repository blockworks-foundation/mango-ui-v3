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
              className={`rounded border border-th-bkg-4 bg-th-bkg-1 py-0.5 font-normal hover:border-th-fgd-4 focus:border-th-fgd-4 focus:outline-none`}
            >
              <div
                className={`flex items-center justify-between space-x-1 pr-1 pl-2 text-xs`}
              >
                <span>{value}</span>

                <ChevronDownIcon
                  className={`default-transition h-4 w-4 text-th-fgd-1 ${
                    open ? 'rotate-180 transform' : 'rotate-360 transform'
                  }`}
                />
              </div>
            </Listbox.Button>
            {open ? (
              <Listbox.Options
                static
                className={`thin-scroll absolute left-0 top-5 z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-th-bkg-3 p-2 text-th-fgd-1 outline-none`}
              >
                {sizes.map((size) => (
                  <Listbox.Option key={size} value={size}>
                    {({ selected }) => (
                      <div
                        className={`default-transition text-right text-th-fgd-1 hover:cursor-pointer hover:bg-th-bkg-3 hover:text-th-primary ${
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
