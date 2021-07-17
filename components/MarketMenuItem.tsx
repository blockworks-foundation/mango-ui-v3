import { useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { Popover } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/solid'
import Link from 'next/link'

export default function MarketMenuItem({ menuTitle = '', linksArray = [] }) {
  const { asPath } = useRouter()
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
            <Popover.Button className="focus:outline-none" ref={buttonRef}>
              <div
                className="flex items-center px-2.5 py-1 text-th-fgd-3 hover:text-th-primary"
                onClick={() => handleClick(open)}
              >
                {/* <img
                  alt=""
                  src={`/assets/icons/${menuTitle.toLowerCase()}.svg`}
                  className={`mr-1.5 h-4 w-auto`}
                /> */}
                <span
                  className={`font-normal text-xs ${
                    asPath.includes(menuTitle) && 'text-th-primary'
                  }`}
                >
                  {menuTitle}
                </span>
                <ChevronDownIcon
                  className={`${
                    open ? 'transform rotate-180' : 'transform rotate-360'
                  } h-4 w-4 default-transition
                    `}
                  aria-hidden="true"
                />
              </div>
            </Popover.Button>
            <Popover.Panel className="absolute top-4 z-10">
              <div className="relative bg-th-bkg-3 divide-y divide-th-fgd-4 px-3 pt-4 rounded">
                {linksArray.map((m) => (
                  <Link
                    href={`/${
                      m.name.slice(-4) === 'PERP' ? 'perp' : 'spot'
                    }/${m.name.slice(0, -5)}`}
                    key={m.name}
                  >
                    <a
                      className={`block py-2 text-th-fgd-1 text-xs hover:text-th-primary ${
                        asPath.includes(menuTitle)
                          ? (asPath.includes('perp') &&
                              m.name.slice(-4) === 'PERP') ||
                            (asPath.includes('spot') &&
                              m.name.slice(-4) === 'USDC')
                            ? 'text-th-primary'
                            : 'text-th-fgd-1'
                          : null
                      }`}
                    >
                      {m.name}
                    </a>
                  </Link>
                ))}
              </div>
            </Popover.Panel>
          </div>
        )}
      </Popover>
    </div>
  )
}
