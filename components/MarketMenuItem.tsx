import { useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { Popover } from '@headlessui/react'
import Link from 'next/link'
import {
  AaveMonoIcon,
  BtcMonoIcon,
  CopeMonoIcon,
  DogeMonoIcon,
  EthMonoIcon,
  FidaMonoIcon,
  FttMonoIcon,
  MediaMonoIcon,
  MerMonoIcon,
  MngoMonoIcon,
  RayMonoIcon,
  SolMonoIcon,
  SrmMonoIcon,
  StepMonoIcon,
  SushiMonoIcon,
  UniMonoIcon,
} from './icons'

const symbolIcons = {
  AaveMonoIcon,
  BtcMonoIcon,
  CopeMonoIcon,
  DogeMonoIcon,
  EthMonoIcon,
  FidaMonoIcon,
  FttMonoIcon,
  MediaMonoIcon,
  MerMonoIcon,
  MngoMonoIcon,
  RayMonoIcon,
  SolMonoIcon,
  SrmMonoIcon,
  StepMonoIcon,
  SushiMonoIcon,
  UniMonoIcon,
}

export default function MarketMenuItem({ menuTitle = '', linksArray = [] }) {
  const { asPath } = useRouter()
  const buttonRef = useRef(null)
  const [openState, setOpenState] = useState(false)

  const iconName = `${menuTitle.substr(0, 1)}${menuTitle
    .substr(1, 4)
    .toLowerCase()}MonoIcon`
  const SymbolIcon = symbolIcons[iconName]

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
            className="flex flex-col h-10"
          >
            <Popover.Button
              className="flex items-center px-2.5 h-10 text-th-fgd-3 hover:text-th-primary focus:outline-none"
              ref={buttonRef}
              onClick={() => handleClick(open)}
            >
              <SymbolIcon
                className={`h-3.5 w-auto mr-1.5 ${
                  asPath.includes(menuTitle) && 'text-th-primary'
                }`}
              />
              <span
                className={`font-normal text-xs ${
                  asPath.includes(menuTitle) && 'text-th-primary'
                }`}
              >
                {menuTitle}
              </span>
            </Popover.Button>
            <Popover.Panel className="absolute top-10 z-10">
              <div className="relative bg-th-bkg-3 divide-y divide-th-fgd-4 px-3 rounded rounded-t-none">
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
