import { Listbox } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/solid'

const Select = ({
  value,
  onChange,
  children,
  className = '',
  dropdownPanelClassName = '',
  placeholder = '',
  disabled = false,
}) => {
  return (
    <div className={`relative ${className}`}>
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        {({ open }) => (
          <>
            <Listbox.Button
              className={`h-full w-full rounded-md bg-th-bkg-1 font-normal ring-1 ring-inset ring-th-bkg-4 hover:ring-th-fgd-4 focus:border-th-fgd-4 focus:outline-none`}
            >
              <div
                style={{ minHeight: '2.5rem' }}
                className={`flex items-center justify-between space-x-2 p-2 text-th-fgd-1`}
              >
                {value ? value : placeholder}
                <ChevronDownIcon
                  className={`default-transition h-5 w-5 flex-shrink-0 text-th-fgd-1 ${
                    open ? 'rotate-180 transform' : 'rotate-360 transform'
                  }`}
                />
              </div>
            </Listbox.Button>
            {open ? (
              <Listbox.Options
                static
                className={`thin-scroll absolute left-0 z-20 mt-1 max-h-60 w-full origin-top-left overflow-auto rounded-md bg-th-bkg-2 p-2 text-th-fgd-1 outline-none ${dropdownPanelClassName}`}
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
    <Listbox.Option className="mb-0" value={value}>
      {({ selected }) => (
        <div
          className={`default-transition rounded p-2 text-th-fgd-1 hover:cursor-pointer hover:bg-th-bkg-3 hover:text-th-primary ${
            selected ? 'text-th-primary' : ''
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
