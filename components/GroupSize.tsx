import { Listbox } from '@headlessui/react'
import styled from '@emotion/styled'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/solid'

const StyledListbox = styled(Listbox.Button)`
  
`

const GroupSize = ({ tickSize, value, onChange, className = '' }) => {
  const sizes = []
  for (let i = 0; i < 5; i++) {
    sizes.push(tickSize * Math.pow(10,i))
  }
  return (
    <div className={`relative${className}`}>
      <div className={`text-xs`}>Grouping</div>
      <Listbox value={value} onChange={onChange}>
        {({ open }) => (
          <>
            <StyledListbox
              className={`font-normal h-full w-full bg-th-bkg-1 border border-th-fgd-4 hover:border-th-primary rounded focus:outline-none focus:border-th-primary`}
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
            </StyledListbox>
            {open ? (
              <Listbox.Options
                static
                className={`z-40 w-full p-1 absolute left-0 mt-1 bg-th-bkg-1 origin-top-left divide-y divide-th-bkg-3 shadow-lg outline-none rounded-md`}
              >
                {sizes.map((size) => (
                  <Listbox.Option key={size} value={size}>
                    {({ selected }) => (
                      <div
                        className={`p-2 hover:bg-th-bkg-2 hover:cursor-pointer tracking-wider ${
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
