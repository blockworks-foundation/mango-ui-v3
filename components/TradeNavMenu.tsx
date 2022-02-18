import { Fragment, FunctionComponent, useEffect, useRef, useState } from 'react'
import { Popover, Transition } from '@headlessui/react'
import { useTranslation } from 'next-i18next'
import { StarIcon } from '@heroicons/react/outline'
import {
  ChevronDownIcon,
  StarIcon as FilledStarIcon,
} from '@heroicons/react/solid'
import useMangoGroupConfig from '../hooks/useMangoGroupConfig'
import useLocalStorageState from '../hooks/useLocalStorageState'
import MarketNavItem from './MarketNavItem'

const initialMenuCategories = [
  { name: 'Perp', desc: 'perp-desc' },
  { name: 'Spot', desc: 'spot-desc' },
]

export const FAVORITE_MARKETS_KEY = 'favoriteMarkets'

const TradeNavMenu = () => {
  const [favoriteMarkets] = useLocalStorageState(FAVORITE_MARKETS_KEY, [])
  const [activeMenuCategory, setActiveMenuCategory] = useState('Perp')
  const [menuCategories, setMenuCategories] = useState(initialMenuCategories)
  const buttonRef = useRef(null)
  const groupConfig = useMangoGroupConfig()
  const { t } = useTranslation('common')

  const markets =
    activeMenuCategory === 'Favorites'
      ? favoriteMarkets
      : activeMenuCategory === 'Spot'
      ? [...groupConfig.spotMarkets]
      : [...groupConfig.perpMarkets]

  const handleMenuCategoryChange = (categoryName) => {
    setActiveMenuCategory(categoryName)
  }

  const toggleMenu = () => {
    buttonRef?.current?.click()
    if (favoriteMarkets.length > 0) {
      setActiveMenuCategory('Favorites')
    } else {
      setActiveMenuCategory('Perp')
    }
  }

  const onHoverMenu = (open, action) => {
    if (
      (!open && action === 'onMouseEnter') ||
      (open && action === 'onMouseLeave')
    ) {
      toggleMenu()
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

  useEffect(() => {
    if (favoriteMarkets.length > 0 && menuCategories.length === 2) {
      const newCategories = [{ name: 'Favorites', desc: '' }, ...menuCategories]
      setMenuCategories(newCategories)
    }
    if (favoriteMarkets.length === 0 && menuCategories.length === 3) {
      setMenuCategories(
        menuCategories.filter((cat) => cat.name !== 'Favorites')
      )
      if (activeMenuCategory === 'Favorites') {
        setActiveMenuCategory('Perp')
      }
    }
  }, [favoriteMarkets])

  return (
    <Popover>
      {({ open }) => (
        <div
          onMouseEnter={() => onHoverMenu(open, 'onMouseEnter')}
          onMouseLeave={() => onHoverMenu(open, 'onMouseLeave')}
          className="relative flex flex-col z-50"
        >
          <Popover.Button
            className={`-mr-3 px-3 rounded-none focus:outline-none focus:bg-th-bkg-3 ${
              open && 'bg-th-bkg-3'
            }`}
            ref={buttonRef}
          >
            <div
              className={`flex font-bold h-14 items-center rounded-none hover:text-th-primary`}
            >
              <span>{t('trade')}</span>
              <ChevronDownIcon
                className={`default-transition h-5 ml-0.5 w-5 ${
                  open ? 'transform rotate-180' : 'transform rotate-360'
                }`}
              />
            </div>
          </Popover.Button>
          <Transition
            appear={true}
            show={open}
            as={Fragment}
            enter="transition-all ease-in duration-100"
            enterFrom="opacity-0 transform scale-90"
            enterTo="opacity-100 transform scale-100"
            leave="transition ease-out duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Popover.Panel className="absolute grid grid-cols-3 grid-rows-1 min-h-[235px] top-14 w-[700px] z-10">
              <div className="bg-th-bkg-4 col-span-1 rounded-bl-lg">
                <MenuCategories
                  activeCategory={activeMenuCategory}
                  categories={menuCategories}
                  onChange={handleMenuCategoryChange}
                />
              </div>
              <div className="bg-th-bkg-3 col-span-2 p-4 rounded-br-lg">
                <div className="grid grid-cols-2 grid-flow-row gap-x-6">
                  {markets.map((mkt) => (
                    <MarketNavItem
                      buttonRef={buttonRef}
                      market={mkt}
                      key={mkt.name}
                    />
                  ))}
                </div>
              </div>
            </Popover.Panel>
          </Transition>
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
            className={`cursor-pointer default-transition flex flex-col h-14 justify-center px-4 relative rounded-none w-full whitespace-nowrap hover:bg-th-bkg-3 ${
              activeCategory === cat.name
                ? `bg-th-bkg-3 text-th-primary`
                : `text-th-fgd-2 hover:text-th-primary`
            }
          `}
          >
            {t(cat.name.toLowerCase().replace(' ', '-'))}
            <div className="font-normal text-th-fgd-4 text-xs">
              {t(cat.desc)}
            </div>
          </button>
        )
      })}
    </div>
  )
}

export const FavoriteMarketButton = ({ market }) => {
  const [favoriteMarkets, setFavoriteMarkets] = useLocalStorageState(
    FAVORITE_MARKETS_KEY,
    []
  )

  const addToFavorites = (mkt) => {
    const newFavorites = [...favoriteMarkets, mkt]
    setFavoriteMarkets(newFavorites)
  }

  const removeFromFavorites = (mkt) => {
    setFavoriteMarkets(favoriteMarkets.filter((m) => m.name !== mkt.name))
  }

  return favoriteMarkets.find((mkt) => mkt.name === market.name) ? (
    <button
      className="default-transition text-th-primary hover:text-th-fgd-3"
      onClick={() => removeFromFavorites(market)}
    >
      <FilledStarIcon className="h-5 w-5" />
    </button>
  ) : (
    <button
      className="default-transition text-th-fgd-4 hover:text-th-primary"
      onClick={() => addToFavorites(market)}
    >
      <StarIcon className="h-5 w-5" />
    </button>
  )
}
