import { Listbox } from '@headlessui/react'
import styled from '@emotion/styled'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/solid'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from './TradePageGrid'

const StyledListbox = styled(Listbox.Button)`
  border-right: 1px solid transparent;
`

const TriggerType = ({ value, onChange, className = '' }) => {
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false

  const TRIGGER_TYPES = ['Above', 'Below']

  return (
    <div className={`relative ${className}`}>
      {!isMobile ? (
        <Listbox value={value} onChange={onChange}>
          {({ open }) => (
            <>
              <StyledListbox
                className={`font-normal h-full w-full bg-th-bkg-1 border border-th-fgd-4 hover:border-th-primary rounded rounded-r-none focus:outline-none focus:border-th-primary`}
              >
                <div
                  className={`flex items-center justify-between space-x-4 pl-2 pr-1`}
                >
                  <span>{value}</span>
                  {open ? (
                    <ChevronUpIcon className={`h-5 w-5 mr-1 text-th-primary`} />
                  ) : (
                    <ChevronDownIcon
                      className={`h-5 w-5 mr-1 text-th-primary`}
                    />
                  )}
                </div>
              </StyledListbox>
              {open ? (
                <Listbox.Options
                  static
                  className={`z-20 w-full p-1 absolute left-0 mt-1 bg-th-bkg-1 origin-top-left divide-y divide-th-bkg-3 shadow-lg outline-none rounded-md`}
                >
                  {TRIGGER_TYPES.map((type) => (
                    <Listbox.Option key={type} value={type}>
                      {({ selected }) => (
                        <div
                          className={`p-2 hover:bg-th-bkg-2 hover:cursor-pointer tracking-wider ${
                            selected && `text-th-primary`
                          }`}
                        >
                          {type}
                        </div>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              ) : null}
            </>
          )}
        </Listbox>
      ) : (
        <div className="flex">
          {TRIGGER_TYPES.map((triggerType) => {
            ;<div
              className={`px-2 py-1 ml-2 rounded-md cursor-pointer default-transition bg-th-bkg-4
              ${
                value === triggerType
                  ? `ring-1 ring-inset ring-th-primary text-th-primary`
                  : `text-th-fgd-1 opacity-50 hover:opacity-100`
              }
            `}
              onClick={() => onChange(triggerType)}
            >
              {triggerType}
            </div>
          })}
        </div>
      )}
    </div>
  )
}

export default TriggerType
