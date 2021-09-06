import { Listbox } from '@headlessui/react'
// import styled from '@emotion/styled'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/solid'

const StyledListbox = Listbox.Button

const GroupSize = ({ tickSize, value, onChange, className = '' }) => {
  const sizes = [tickSize, tickSize*5, tickSize*10, tickSize*50, tickSize*100]
  return (
    <div className={`${className}`}>
      <div className={`text-xs pr-2`}>Grouping</div>
      <Listbox value={value} onChange={onChange}>
        {({ open }) => (
          <>
            <StyledListbox
              className={`w-2/3 font-normal h-full bg-th-bkg-1 border border-th-fgd-4 hover:border-th-primary rounded focus:outline-none focus:border-th-primary`}
            >
              <div
                className={`flex items-center justify-between space-x-3 pr-2 pl-1`}
              >
                {open ? (
                  <ChevronUpIcon className={`h-5 w-5 text-th-primary`} />
                ) : (
                  <ChevronDownIcon className={`h-5 w-5 text-th-primary`} />
                )}
                <span>{value}</span>
              </div>
            </StyledListbox>
            {open ? (
              <Listbox.Options
                static
                className={`w-2/3 z-40 p-1 absolute top-full right-0 mt-1 bg-th-bkg-1 origin-top-left divide-y divide-th-bkg-3 shadow-lg outline-none rounded-md`}
              >
                {sizes.map((size) => (
                  <Listbox.Option key={size} value={size}>
                    {({ selected }) => (
                      <div
                        className={`p-1 text-right hover:bg-th-bkg-2 hover:cursor-pointer tracking-wider ${
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

export default GroupSize
