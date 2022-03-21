import { Listbox } from '@headlessui/react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/solid'
import { useViewport } from '../../hooks/useViewport'
import { breakpoints } from '../TradePageGrid'
// import { useTranslation } from 'next-i18next'

const TriggerType = ({ value, onChange, className = '' }) => {
  // const { t } = useTranslation('common')
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false

  const TRIGGER_TYPES = ['Above', 'Below']

  return (
    <div className={`relative ${className}`}>
      {!isMobile ? (
        <Listbox value={value} onChange={onChange}>
          {({ open }) => (
            <>
              <Listbox.Button
                style={{ borderRight: '1px solid transparent' }}
                className={`h-full w-full rounded rounded-r-none border border-th-fgd-4 bg-th-bkg-1 font-normal hover:border-th-primary focus:border-th-primary focus:outline-none`}
              >
                <div
                  className={`flex items-center justify-between space-x-4 pl-2 pr-1`}
                >
                  <span>{value}</span>
                  {open ? (
                    <ChevronUpIcon className={`mr-1 h-5 w-5 text-th-primary`} />
                  ) : (
                    <ChevronDownIcon
                      className={`mr-1 h-5 w-5 text-th-primary`}
                    />
                  )}
                </div>
              </Listbox.Button>
              {open ? (
                <Listbox.Options
                  static
                  className={`absolute left-0 z-20 mt-1 w-full origin-top-left divide-y divide-th-bkg-3 rounded-md bg-th-bkg-1 p-1 shadow-lg outline-none`}
                >
                  {TRIGGER_TYPES.map((type) => (
                    <Listbox.Option key={type} value={type}>
                      {({ selected }) => (
                        <div
                          className={`p-2 tracking-wider hover:cursor-pointer hover:bg-th-bkg-2 ${
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
          {TRIGGER_TYPES.map((triggerType, i) => (
            <div
              className={`default-transition ml-2 cursor-pointer rounded-md bg-th-bkg-4 px-2 py-1
              ${
                value === triggerType
                  ? `text-th-primary ring-1 ring-inset ring-th-primary`
                  : `text-th-fgd-1 opacity-50 hover:opacity-100`
              }
            `}
              key={`${triggerType}${i}`}
              onClick={() => onChange(triggerType)}
            >
              {triggerType}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TriggerType
