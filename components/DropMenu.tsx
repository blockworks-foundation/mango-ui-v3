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
                <Tooltip content={toolTipContent} className="py-1 text-xs">
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
                className={`absolute left-1/2 z-10 mt-2 -translate-x-1/2 transform rounded-md bg-th-bkg-3 px-4 py-2.5`}
                static
              >
                {options.map((option) => (
                  <Listbox.Option
                    key={option.name}
                    value={option.locale || option.name}
                  >
                    {({ selected }) => (
                      <div
                        className={`default-transition whitespace-nowrap tracking-wider text-th-fgd-1 hover:cursor-pointer hover:text-th-primary ${
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
