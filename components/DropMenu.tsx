import { Fragment, FunctionComponent, ReactNode } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import Tooltip from './Tooltip'
import { useTranslation } from 'next-i18next'

type DropMenuProps = {
  button: ReactNode
  buttonClassName?: string
  disabled?: boolean
  onChange: (...args: any[]) => any
  options: Array<any>
  toolTipContent?: string
  value?: any
}

const DropMenu: FunctionComponent<DropMenuProps> = ({
  button,
  buttonClassName,
  disabled,
  value,
  onChange,
  options,
  toolTipContent,
}) => {
  const { t } = useTranslation('common')

  return (
    <div className={`relative`}>
      <Listbox value={value} onChange={onChange}>
        {({ open }) => (
          <>
            <Listbox.Button className={buttonClassName} disabled={disabled}>
              {toolTipContent && !open ? (
                <Tooltip content={toolTipContent} className="text-xs py-1">
                  {button}
                </Tooltip>
              ) : (
                button
              )}
            </Listbox.Button>
            <Transition
              appear={true}
              show={open}
              as={Fragment}
              enter="transition-all ease-in duration-200"
              enterFrom="opacity-0 transform scale-75"
              enterTo="opacity-100 transform scale-100"
              leave="transition ease-out duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options
                className={`absolute bg-th-bkg-3 left-1/2 mt-2 px-4 py-2.5 rounded-md transform -translate-x-1/2 z-10`}
                static
              >
                {options.map((option) => (
                  <Listbox.Option
                    key={option.name}
                    value={option.locale || option.name}
                  >
                    {({ selected }) => (
                      <div
                        className={`default-transition py-1.5 hover:text-th-primary hover:cursor-pointer tracking-wider whitespace-nowrap ${
                          selected && `text-th-primary`
                        } ${option.icon && `flex items-center`}`}
                      >
                        {option.icon ? (
                          <div className="mr-2">{option.icon}</div>
                        ) : null}
                        {t(option.name.toLowerCase())}
                      </div>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </>
        )}
      </Listbox>
    </div>
  )
}

export default DropMenu
