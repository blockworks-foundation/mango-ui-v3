import { Fragment, useRef } from 'react'
import { Popover, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/solid'
import Link from 'next/link'

type NavDropMenuProps = {
  menuTitle: string | React.ReactNode
  linksArray: [string, string, boolean, React.ReactNode][]
}

export default function NavDropMenu({
  menuTitle = '',
  linksArray = [],
}: NavDropMenuProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  const toggleMenu = () => {
    buttonRef?.current?.click()
  }

  const onHover = (open, action) => {
    if (
      (!open && action === 'onMouseEnter') ||
      (open && action === 'onMouseLeave')
    ) {
      toggleMenu()
    }
  }

  return (
    <Popover className="relative">
      {({ open }) => (
        <div
          onMouseEnter={() => onHover(open, 'onMouseEnter')}
          onMouseLeave={() => onHover(open, 'onMouseLeave')}
          className="flex flex-col"
        >
          <Popover.Button
            className={`-mr-3 rounded-none px-3 focus:bg-th-bkg-3 focus:outline-none ${
              open && 'bg-th-bkg-3'
            }`}
            ref={buttonRef}
          >
            <div
              className={`flex h-14 items-center rounded-none font-bold hover:text-th-primary`}
            >
              <span className="font-bold">{menuTitle}</span>
              <ChevronDownIcon
                className={`default-transition ml-0.5 h-5 w-5 ${
                  open ? 'rotate-180 transform' : 'rotate-360 transform'
                }`}
                aria-hidden="true"
              />
            </div>
          </Popover.Button>
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
            <Popover.Panel className="absolute top-14 z-10">
              <div className="relative rounded-b-md bg-th-bkg-3 px-4 py-2.5">
                {linksArray.map(([name, href, isExternal, icon]) =>
                  !isExternal ? (
                    <Link href={href} key={href}>
                      <a className="default-transition flex items-center whitespace-nowrap py-1.5 text-th-fgd-1 hover:text-th-primary">
                        {icon ? <div className="mr-2">{icon}</div> : null}
                        {name}
                      </a>
                    </Link>
                  ) : (
                    <a
                      className="default-transition flex items-center whitespace-nowrap py-1.5 text-th-fgd-1 hover:text-th-primary"
                      href={href}
                      key={href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {icon ? <div className="mr-2">{icon}</div> : null}
                      {name}
                    </a>
                  )
                )}
              </div>
            </Popover.Panel>
          </Transition>
        </div>
      )}
    </Popover>
  )
}
