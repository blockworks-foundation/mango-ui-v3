import {
  Fragment,
  FunctionComponent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Popover, Transition } from '@headlessui/react'
import { useTranslation } from 'next-i18next'
import { StarIcon } from '@heroicons/react/outline'
import {
  ChevronDownIcon,
  StarIcon as FilledStarIcon,
} from '@heroicons/react/solid'
import useLocalStorageState from '../hooks/useLocalStorageState'
import MarketNavItem from './MarketNavItem'
import useMangoStore from '../stores/useMangoStore'

const initialMenuCategories = [
  { name: 'Futures', desc: 'perp-desc' },
  { name: 'Spot', desc: 'spot-desc' },
]

export const FAVORITE_MARKETS_KEY = 'favoriteMarkets-0.1'

const TradeNavMenu = () => {
  const [favoriteMarkets] = useLocalStorageState(FAVORITE_MARKETS_KEY, [])
  const [activeMenuCategory, setActiveMenuCategory] = useState('Futures')
  const [menuCategories, setMenuCategories] = useState(initialMenuCategories)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { t } = useTranslation('common')

  const marketsInfo = useMangoStore((s) => s.marketsInfo)

  const perpMarketsInfo = useMemo(
    () =>
      marketsInfo
        .filter((mkt) => mkt?.name.includes('PERP'))
        .sort((a, b) => b.volumeUsd24h - a.volumeUsd24h),
    [marketsInfo]
  )

  const spotMarketsInfo = useMemo(
    () =>
      marketsInfo
        .filter((mkt) => mkt?.name.includes('USDC'))
        .sort((a, b) => b.volumeUsd24h - a.volumeUsd24h),
    [marketsInfo]
  )

  const markets = useMemo(
    () =>
      activeMenuCategory === 'Futures'
        ? perpMarketsInfo
        : activeMenuCategory === 'Spot'
        ? spotMarketsInfo
        : marketsInfo.filter((mkt) => favoriteMarkets.includes(mkt.name)),
    [activeMenuCategory, marketsInfo]
  )

  const handleMenuCategoryChange = (categoryName) => {
    setActiveMenuCategory(categoryName)
  }

  const toggleMenu = () => {
    buttonRef?.current?.click()
    if (favoriteMarkets.length > 0) {
      setActiveMenuCategory('Favorites')
    } else {
      setActiveMenuCategory('Futures')
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
        setActiveMenuCategory('Futures')
      }
    }
  }, [favoriteMarkets])

  return (
    <Popover>
      {({ open }) => (
        <div
          onMouseEnter={() => onHoverMenu(open, 'onMouseEnter')}
          onMouseLeave={() => onHoverMenu(open, 'onMouseLeave')}
          className="relative z-50 flex flex-col"
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
              <span>{t('trade')}</span>
              <ChevronDownIcon
                className={`default-transition ml-0.5 h-5 w-5 ${
                  open ? 'rotate-180 transform' : 'rotate-360 transform'
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
            <Popover.Panel className="absolute top-14 grid min-h-[235px] w-[760px] grid-cols-3 grid-rows-1">
              <div className="col-span-1 rounded-bl-lg bg-th-bkg-4">
                <MenuCategories
                  activeCategory={activeMenuCategory}
                  categories={menuCategories}
                  onChange={handleMenuCategoryChange}
                />
              </div>
              <div className="col-span-2 rounded-br-lg bg-th-bkg-3 p-4">
                <div className="grid grid-flow-row grid-cols-2 gap-x-6">
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
        className={`default-transition absolute top-0 left-0 z-10 w-0.5 bg-th-primary`}
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
            className={`default-transition relative flex h-14 w-full cursor-pointer flex-col justify-center whitespace-nowrap rounded-none px-4 font-bold hover:bg-th-bkg-3 ${
              activeCategory === cat.name
                ? `bg-th-bkg-3 text-th-primary`
                : `text-th-fgd-2 hover:text-th-primary`
            }
          `}
          >
            {t(cat.name.toLowerCase().replace(' ', '-'))}
            <div className="text-xs font-normal text-th-fgd-4">
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
    const newFavorites: any = [...favoriteMarkets, mkt]
    setFavoriteMarkets(newFavorites)
  }

  const removeFromFavorites = (mkt) => {
    setFavoriteMarkets(favoriteMarkets.filter((m) => m.name !== mkt))
  }

  return favoriteMarkets.find((mkt) => mkt === market.name) ? (
    <button
      className="default-transition flex items-center justify-center text-th-primary hover:text-th-fgd-3"
      onClick={() => removeFromFavorites(market.name)}
    >
      <FilledStarIcon className="h-5 w-5" />
    </button>
  ) : (
    <button
      className="default-transition flex items-center justify-center text-th-fgd-4 hover:text-th-primary"
      onClick={() => addToFavorites(market.name)}
    >
      <StarIcon className="h-5 w-5" />
    </button>
  )
}
