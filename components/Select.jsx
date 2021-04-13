import { Listbox } from '@headlessui/react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/solid'

const Select = ({ value, onChange, options, className = '' }) => {
  return (
    <div className={`relative`}>
      <Listbox value={value} onChange={onChange}>
        {({ open }) => (
          <>
            <Listbox.Button
              className={`h-full w-full bg-th-bkg-1 border border-th-fgd-4 rounded focus:outline-none focus:ring-1 focus:ring-th-primary ${className}`}
            >
              <div
                className={`flex items-center justify-between space-x-4 pl-2 pr-1`}
              >
                <span>{value}</span>
                {open ? (
                  <ChevronUpIcon className={`h-5 w-5 mr-1 text-th-primary`} />
                ) : (
                  <ChevronDownIcon className={`h-5 w-5 mr-1 text-th-primary`} />
                )}
              </div>
            </Listbox.Button>
            {open ? (
              <Listbox.Options
                static
                className={`z-20 w-full p-1 absolute left-0 mt-1 bg-th-bkg-1 origin-top-left divide-y divide-th-bkg-3 shadow-lg outline-none rounded-md`}
              >
                {options.map((option) => (
                  <Listbox.Option key={option} value={option}>
                    {({ selected }) => (
                      <div
                        className={`p-2 hover:bg-th-bkg-3 hover:cursor-pointer tracking-wider ${
                          selected && `text-th-primary`
                        }`}
                      >
                        {option}
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

export default Select
