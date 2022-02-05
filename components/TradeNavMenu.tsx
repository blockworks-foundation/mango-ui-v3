import { FunctionComponent, useEffect, useRef, useState } from 'react'
import { Popover } from '@headlessui/react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { QuestionMarkCircleIcon } from '@heroicons/react/outline'
import { ChevronDownIcon } from '@heroicons/react/solid'
import useMangoGroupConfig from '../hooks/useMangoGroupConfig'
import * as MonoIcons from './icons'
import { initialMarket } from './SettingsModal'

const menuCategories = [
  { name: 'Spot', desc: 'spot-desc' },
  { name: 'Perp', desc: 'perp-desc' },
]

const TradeNavMenu = () => {
  const [activeMenuCategory, setActiveMenuCategory] = useState('Spot')

  let timeout
  const timeoutDuration = 200

  const buttonRef = useRef(null)
  const [openState, setOpenState] = useState(false)
  const groupConfig = useMangoGroupConfig()
  const { asPath } = useRouter()

  const markets =
    activeMenuCategory === 'Spot'
      ? [...groupConfig.spotMarkets]
      : [...groupConfig.perpMarkets]

  const handleMenuCategoryChange = (categoryName) => {
    setActiveMenuCategory(categoryName)
  }

  const renderIcon = (symbol) => {
    const iconName = `${symbol.slice(0, 1)}${symbol
      .slice(1, 4)
      .toLowerCase()}MonoIcon`

    const SymbolIcon = MonoIcons[iconName] || QuestionMarkCircleIcon
    return <SymbolIcon className={`h-3.5 w-auto mr-2`} />
  }

  const toggleMenu = () => {
    setOpenState((openState) => !openState)
    buttonRef?.current?.click()
  }

  const handleClick = (open) => {
    setOpenState(!open)
    clearTimeout(timeout)
  }

  const onHoverMenu = (open, action) => {
    if (
      (!open && !openState && action === 'onMouseEnter') ||
      (open && openState && action === 'onMouseLeave')
    ) {
      clearTimeout(timeout)
      timeout = setTimeout(() => toggleMenu(), timeoutDuration)
    }
  }

  const handleClickOutside = (event) => {
    if (buttonRef.current && !buttonRef.current.contains(event.target)) {
      event.stopPropagation()
    }
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  })

  return (
    <Popover>
      {({ open }) => (
        <div
          onMouseEnter={() => onHoverMenu(open, 'onMouseEnter')}
          onMouseLeave={() => onHoverMenu(open, 'onMouseLeave')}
          className="flex flex-col"
        >
          <Popover.Button
            className="-mr-3 px-3 rounded-none focus:outline-none focus:bg-th-bkg-3"
            ref={buttonRef}
          >
            <div
              className={`flex h-14 items-center rounded-none hover:text-th-primary ${
                open && 'bg-th-bkg-3'
              }`}
              onClick={() => handleClick(open)}
            >
              <span>Trade</span>
              <ChevronDownIcon
                className={`default-transition h-5 ml-0.5 w-5 ${
                  open ? 'transform rotate-180' : 'transform rotate-360'
                }`}
              />
            </div>
          </Popover.Button>

          <Popover.Panel className="absolute grid grid-cols-3 grid-rows-1 top-14 w-[700px] z-10">
            <div className="bg-th-bkg-4 col-span-1 rounded-bl-lg">
              <MenuCategories
                activeCategory={activeMenuCategory}
                categories={menuCategories}
                onChange={handleMenuCategoryChange}
              />
            </div>
            <div className="bg-th-bkg-3 col-span-2 p-4 rounded-br-lg">
              <div className="grid grid-cols-2 grid-flow-row">
                {markets.map((mkt) => (
                  <div className="col-span-1 text-th-fgd-3" key={mkt.name}>
                    <Link
                      href={{
                        pathname: '/',
                        query: { name: mkt.name },
                      }}
                      shallow={true}
                    >
                      <a
                        className={`flex items-center py-2 text-xs hover:text-th-primary whitespace-nowrap ${
                          asPath.includes(mkt.name) ||
                          (asPath === '/' && initialMarket.name === mkt.name)
                            ? 'text-th-primary'
                            : 'text-th-fgd-1'
                        }`}
                      >
                        {renderIcon(mkt.baseSymbol)}
                        {mkt.name}
                      </a>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </Popover.Panel>
        </div>
      )}
    </Popover>
  )
}

export default TradeNavMenu

interface MenuCategoriesProps {
  activeCategory: string
  onChange: (x) => void
  categories: Array<any>
}

const MenuCategories: FunctionComponent<MenuCategoriesProps> = ({
  activeCategory,
  onChange,
  categories,
}) => {
  const { t } = useTranslation('common')

  return (
    <div className={`relative`}>
      <div
        className={`absolute bg-th-primary top-0 default-transition left-0 w-0.5 z-10`}
        style={{
          transform: `translateY(${
            categories.findIndex((cat) => cat.name === activeCategory) * 100
          }%)`,
          height: `${100 / categories.length}%`,
        }}
      />
      {categories.map((cat) => {
        return (
          <button
            key={cat.name}
            onClick={() => onChange(cat.name)}
            onMouseEnter={() => onChange(cat.name)}
            className={`cursor-pointer default-transition flex flex-col h-14 justify-center px-4 relative rounded-none w-full whitespace-nowrap hover:bg-th-bkg-3
                      ${
                        activeCategory === cat.name
                          ? `bg-th-bkg-3 text-th-primary`
                          : `text-th-fgd-2 hover:text-th-primary`
                      }
                    `}
          >
            {t(cat.name.toLowerCase().replace(' ', '-'))}
            <div className="text-th-fgd-4 text-xs">{t(cat.desc)}</div>
          </button>
        )
      })}
    </div>
  )
}
