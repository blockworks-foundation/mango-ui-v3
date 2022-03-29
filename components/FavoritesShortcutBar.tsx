import useLocalStorageState from '../hooks/useLocalStorageState'
import { FAVORITE_MARKETS_KEY } from './TradeNavMenu'
import { StarIcon } from '@heroicons/react/solid'
import { QuestionMarkCircleIcon } from '@heroicons/react/outline'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from './TradePageGrid'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { initialMarket } from './SettingsModal'
import * as MonoIcons from './icons'
import { Transition } from '@headlessui/react'
import useMangoStore from '../stores/useMangoStore'

const FavoritesShortcutBar = () => {
  const [favoriteMarkets] = useLocalStorageState(FAVORITE_MARKETS_KEY, [])
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false
  const { asPath } = useRouter()
  const marketsInfo = useMangoStore((s) => s.marketsInfo)

  const renderIcon = (mktName) => {
    const symbol = mktName.slice(0, -5)
    const iconName = `${symbol.slice(0, 1)}${symbol
      .slice(1, 4)
      .toLowerCase()}MonoIcon`

    const SymbolIcon = MonoIcons[iconName] || QuestionMarkCircleIcon
    return <SymbolIcon className={`mr-1.5 h-3.5 w-auto`} />
  }

  return !isMobile ? (
    <Transition
      appear={true}
      className="flex items-center space-x-4 bg-th-bkg-3 px-4 py-2 xl:px-6"
      show={favoriteMarkets.length > 0}
      enter="transition-all ease-in duration-200"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition ease-out duration-200"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <StarIcon className="h-5 w-5 text-th-fgd-4" />
      {favoriteMarkets.map((mkt) => {
        const change24h = marketsInfo?.find((m) => m.name === mkt)?.change24h
        return (
          <Link href={`/?name=${mkt}`} key={mkt} shallow={true}>
            <a
              className={`default-transition flex items-center whitespace-nowrap py-1 text-xs hover:text-th-primary ${
                asPath.includes(mkt) ||
                (asPath === '/' && initialMarket.name === mkt)
                  ? 'text-th-primary'
                  : 'text-th-fgd-3'
              }`}
            >
              {renderIcon(mkt)}
              <span className="mb-0 mr-1.5 text-xs">{mkt}</span>
              {change24h ? (
                <div
                  className={`text-xs ${
                    change24h
                      ? change24h >= 0
                        ? 'text-th-green'
                        : 'text-th-red'
                      : 'text-th-fgd-4'
                  }`}
                >
                  {`${(change24h * 100).toFixed(1)}%`}
                </div>
              ) : null}
            </a>
          </Link>
        )
      })}
    </Transition>
  ) : null
}

export default FavoritesShortcutBar
