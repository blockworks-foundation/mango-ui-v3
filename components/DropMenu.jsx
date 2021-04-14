import { Listbox } from '@headlessui/react'

const DropMenu = ({ button, buttonClassName, value, onChange, options }) => {
  return (
    <div className={`relative`}>
      <Listbox value={value} onChange={onChange}>
        {({ open }) => (
          <>
            <Listbox.Button
              className={`${buttonClassName} transition-all duration-500`}
            >
              {button}
            </Listbox.Button>
            {open ? (
              <Listbox.Options
                className={`z-20 p-1 absolute right-0 top-11 bg-th-bkg-1 divide-y divide-th-bkg-3 shadow-lg outline-none rounded-md w-44`}
              >
                {options.map((option) => (
                  <Listbox.Option key={option.name} value={option.name}>
                    {({ selected }) => (
                      <div
                        className={`p-2 hover:bg-th-bkg-2 hover:cursor-pointer tracking-wider ${
                          selected && `text-th-primary`
                        } ${option.icon && `flex flex-row items-center`}`}
                      >
                        {option.icon ? (
                          <div className="mr-2 w-5 h-5">{option.icon}</div>
                        ) : null}
                        {option.name}
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

export default DropMenu
