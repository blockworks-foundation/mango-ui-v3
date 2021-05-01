import { Listbox } from '@headlessui/react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/solid'

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
              className={`h-full w-full font-normal bg-th-bkg-1 border border-th-fgd-4 rounded hover:border-th-primary focus:outline-none focus:border-th-primary`}
            >
              <div
                className={`flex items-center justify-between space-x-4 p-3`}
              >
                <span className="text-th-fgd-1">
                  {value ? value : placeholder}
                </span>
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
                className={`text-th-fgd-1 z-20 w-full p-1 absolute left-0 mt-1 bg-th-bkg-1 origin-top-left divide-y divide-th-bkg-3 shadow-lg outline-none rounded-md`}
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
