import { Listbox } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/solid'

const Select = ({
  value,
  onChange,
  children,
  className = '',
  placeholder = '',
  disabled = false,
}) => {
  return (
    <div className={`relative ${className}`}>
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        {({ open }) => (
          <>
            <Listbox.Button
              className={`h-full w-full font-normal bg-th-bkg-1 ring-1 ring-th-bkg-4 ring-inset rounded-md hover:ring-th-fgd-4 focus:outline-none focus:border-th-fgd-4`}
            >
              <div
                style={{ minHeight: '2.5rem' }}
                className={`flex items-center justify-between space-x-4 p-2 text-th-fgd-1`}
              >
                {value ? value : placeholder}
                <ChevronDownIcon
                  className={`default-transition h-6 w-6 mr-1 text-th-fgd-1 ${
                    open ? 'transform rotate-180' : 'transform rotate-360'
                  }`}
                />
              </div>
            </Listbox.Button>
            {open ? (
              <Listbox.Options
                static
                className={`text-th-fgd-1 max-h-60 overflow-auto z-20 w-full p-1 absolute left-0 mt-1 bg-th-bkg-1 origin-top-left divide-y divide-th-bkg-3 shadow-lg outline-none rounded-md thin-scroll`}
              >
                {children}
              </Listbox.Options>
            ) : null}
          </>
        )}
      </Listbox>
    </div>
  )
}

const Option = ({ value, children, className = '' }) => {
  return (
    <Listbox.Option value={value}>
      {({ selected }) => (
        <div
          className={`p-2 hover:bg-th-bkg-3 hover:cursor-pointer tracking-wider ${
            selected && `text-th-primary`
          } ${className}`}
        >
          {children}
        </div>
      )}
    </Listbox.Option>
  )
}

Select.Option = Option

export default Select
