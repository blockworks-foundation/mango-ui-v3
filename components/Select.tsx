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
                className={`flex items-center justify-between space-x-2 p-2 text-th-fgd-1`}
              >
                {value ? value : placeholder}
                <ChevronDownIcon
                  className={`default-transition flex-shrink-0 h-5 w-5 text-th-fgd-1 ${
                    open ? 'transform rotate-180' : 'transform rotate-360'
                  }`}
                />
              </div>
            </Listbox.Button>
            {open ? (
              <Listbox.Options
                static
                className={`absolute bg-th-bkg-3 left-0 max-h-60 mt-1 overflow-auto origin-top-left outline-none p-2 rounded-md text-th-fgd-1 thin-scroll w-full z-20`}
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
          className={`default-transition text-th-fgd-1 hover:bg-th-bkg-3 hover:cursor-pointer hover:text-th-primary ${
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
