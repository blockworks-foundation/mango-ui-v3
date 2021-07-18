import { useRef, useState } from 'react'
import { Popover } from '@headlessui/react'
import { DotsHorizontalIcon } from '@heroicons/react/solid'
import Link from 'next/link'

export default function NavDropMenu({ menuTitle = '', linksArray = [] }) {
  const buttonRef = useRef(null)
  const [openState, setOpenState] = useState(false)

  const toggleMenu = () => {
    setOpenState((openState) => !openState)
    buttonRef?.current?.click()
  }

  const onHover = (open, action) => {
    if (
      (!open && !openState && action === 'onMouseEnter') ||
      (open && openState && action === 'onMouseLeave')
    ) {
      toggleMenu()
    }
  }

  const handleClick = (open) => {
    setOpenState(!open)
  }

  return (
    <div className="">
      <Popover className="relative">
        {({ open }) => (
          <div
            onMouseEnter={() => onHover(open, 'onMouseEnter')}
            onMouseLeave={() => onHover(open, 'onMouseLeave')}
            className="flex flex-col"
          >
            <Popover.Button className="h-10 focus:outline-none" ref={buttonRef}>
              <div
                className="flex items-center text-th-fgd-1 hover:text-th-primary"
                onClick={() => handleClick(open)}
              >
                <span className="font-bold">{menuTitle}</span>
                <DotsHorizontalIcon
                  className="h-4 w-4 default-transition ml-1.5"
                  aria-hidden="true"
                />
              </div>
            </Popover.Button>
            <Popover.Panel className="absolute top-10 z-10">
              <div className="relative bg-th-bkg-2 divide-y divide-th-bkg-3 px-4 rounded">
                {linksArray.map(([name, href, isExternal]) =>
                  !isExternal ? (
                    <Link href={href} key={href}>
                      <a className="block py-3 text-th-fgd-1 whitespace-nowrap hover:text-th-primary">
                        {name}
                      </a>
                    </Link>
                  ) : (
                    <a
                      className="block py-3 text-th-fgd-1 whitespace-nowrap hover:text-th-primary"
                      href={href}
                      key={href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {name}
                    </a>
                  )
                )}
              </div>
            </Popover.Panel>
          </div>
        )}
      </Popover>
    </div>
  )
}
