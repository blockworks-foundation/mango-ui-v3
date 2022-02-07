import { Fragment, useCallback, useRef, useState } from 'react'
import useMangoGroupConfig from '../hooks/useMangoGroupConfig'
import { useRouter } from 'next/router'
import { Popover, Transition } from '@headlessui/react'
import useLocalStorageState from '../hooks/useLocalStorageState'
import { FAVORITE_MARKETS_KEY } from './TradeNavMenu'
import * as MonoIcons from './icons'
import { SearchIcon, QuestionMarkCircleIcon } from '@heroicons/react/outline'
import { SwitchHorizontalIcon, XIcon } from '@heroicons/react/solid'
import { FavoriteMarketButton } from './TradeNavMenu'
import { initialMarket } from './SettingsModal'
import Input from './Input'
import { useTranslation } from 'next-i18next'
import { getWeights } from '@blockworks-foundation/mango-client'
import useMangoStore from '../stores/useMangoStore'

const SwitchMarketDropdown = () => {
  const [favoriteMarkets] = useLocalStorageState(FAVORITE_MARKETS_KEY, [])
  const groupConfig = useMangoGroupConfig()
  const markets = [...groupConfig.spotMarkets, ...groupConfig.perpMarkets]
  const spotMarkets = [...groupConfig.spotMarkets]
    .filter((m) => !favoriteMarkets.find((n) => n.name === m.name))
    .sort((a, b) => a.name.localeCompare(b.name))

  const perpMarkets = [...groupConfig.perpMarkets]
    .filter((m) => !favoriteMarkets.find((n) => n.name === m.name))
    .sort((a, b) => a.name.localeCompare(b.name))
  const [suggestions, setSuggestions] = useState([])
  const [searchString, setSearchString] = useState('')
  const buttonRef = useRef(null)
  const { asPath } = useRouter()
  const router = useRouter()
  const { t } = useTranslation('common')
  const filteredMarkets = markets
    .filter((m) => m.name.toLowerCase().includes(searchString.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name))
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)

  const renderIcon = (symbol) => {
    const iconName = `${symbol.slice(0, 1)}${symbol
      .slice(1, 4)
      .toLowerCase()}MonoIcon`

    const SymbolIcon = MonoIcons[iconName] || QuestionMarkCircleIcon
    return <SymbolIcon className={`h-3.5 w-auto mr-2`} />
  }

  const onSearch = (searchString) => {
    if (searchString.length > 0) {
      const newSuggestions = suggestions.filter((v) =>
        v.name.toLowerCase().includes(searchString.toLowerCase())
      )
      setSuggestions(newSuggestions)
    }
    setSearchString(searchString)
  }

  const selectMarket = (market) => {
    buttonRef?.current?.click()
    router.push(`/?name=${market.name}`, undefined, { shallow: true })
    setSearchString('')
  }

  const callbackRef = useCallback((inputElement) => {
    if (inputElement) {
      const timer = setTimeout(() => inputElement.focus(), 200)
      return () => clearTimeout(timer)
    }
  }, [])

  const getMarketLeverage = (market) => {
    if (!mangoGroup) return 1
    const ws = getWeights(mangoGroup, market.marketIndex, 'Init')
    const w = market.name.includes('PERP')
      ? ws.perpAssetWeight
      : ws.spotAssetWeight
    return Math.round((100 * -1) / (w.toNumber() - 1)) / 100
  }

  return (
    <Popover>
      {({ open }) => (
        <div className="flex flex-col ml-2 relative">
          <Popover.Button
            className={`focus:outline-none focus:bg-th-bkg-3 ${
              open && 'bg-th-bkg-3'
            }`}
            ref={buttonRef}
          >
            <div
              className={`flex h-10 items-center justify-center rounded-none w-10 hover:text-th-primary`}
            >
              {open ? (
                <XIcon className="h-5 w-5" />
              ) : (
                <SwitchHorizontalIcon className="h-5 w-5" />
              )}
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
            <Popover.Panel
              className="absolute bg-th-bkg-3 max-h-96 overflow-y-auto p-4 left-1/2 transform -translate-x-1/2 rounded-b-md rounded-tl-md thin-scroll top-12 w-56 z-10"
              static
            >
              <div className="pb-2.5">
                <Input
                  onChange={(e) => onSearch(e.target.value)}
                  prefix={<SearchIcon className="h-4 text-th-fgd-3 w-4" />}
                  ref={callbackRef}
                  type="text"
                  value={searchString}
                />
              </div>
              {searchString.length > 0 ? (
                <div className="pt-1.5 space-y-2.5">
                  {filteredMarkets.length > 0 ? (
                    filteredMarkets.map((mkt) => (
                      <div className="text-th-fgd-3" key={mkt.name}>
                        <div className="flex items-center justify-between">
                          <button
                            className="font-normal"
                            onClick={() => selectMarket(mkt)}
                          >
                            <div
                              className={`flex items-center text-xs hover:text-th-primary w-full whitespace-nowrap ${
                                asPath.includes(mkt.name) ||
                                (asPath === '/' &&
                                  initialMarket.name === mkt.name)
                                  ? 'text-th-primary'
                                  : 'text-th-fgd-1'
                              }`}
                            >
                              {renderIcon(mkt.baseSymbol)}
                              {mkt.name}
                              <span className="ml-1.5 text-xs text-th-fgd-4">
                                {getMarketLeverage(mkt)}x
                              </span>
                            </div>
                          </button>
                          <FavoriteMarketButton market={mkt} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="mb-0 text-center">{t('no-markets')}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {favoriteMarkets.length > 0 ? (
                    <>
                      <h4 className="pt-1.5 text-xs">{t('favorites')}</h4>
                      {favoriteMarkets.map((mkt) => (
                        <div className="text-th-fgd-3" key={mkt.name}>
                          <div className="flex items-center justify-between">
                            <button
                              className="font-normal"
                              onClick={() => selectMarket(mkt)}
                            >
                              <div
                                className={`flex items-center text-xs hover:text-th-primary w-full whitespace-nowrap ${
                                  asPath.includes(mkt.name) ||
                                  (asPath === '/' &&
                                    initialMarket.name === mkt.name)
                                    ? 'text-th-primary'
                                    : 'text-th-fgd-1'
                                }`}
                              >
                                {renderIcon(mkt.baseSymbol)}
                                {mkt.name}
                                <span className="ml-1.5 text-xs text-th-fgd-4">
                                  {getMarketLeverage(mkt)}x
                                </span>
                              </div>
                            </button>
                            <FavoriteMarketButton market={mkt} />
                          </div>
                        </div>
                      ))}
                    </>
                  ) : null}
                  {spotMarkets.length > 0 ? (
                    <>
                      <h4 className="pt-1.5 text-xs">{t('spot')}</h4>
                      {spotMarkets.map((mkt) => (
                        <div className="text-th-fgd-3" key={mkt.name}>
                          <div className="flex items-center justify-between">
                            <button
                              className="font-normal"
                              onClick={() => selectMarket(mkt)}
                            >
                              <div
                                className={`flex items-center text-xs hover:text-th-primary w-full whitespace-nowrap ${
                                  asPath.includes(mkt.name) ||
                                  (asPath === '/' &&
                                    initialMarket.name === mkt.name)
                                    ? 'text-th-primary'
                                    : 'text-th-fgd-1'
                                }`}
                              >
                                {renderIcon(mkt.baseSymbol)}
                                {mkt.name}
                                <span className="ml-1.5 text-xs text-th-fgd-4">
                                  {getMarketLeverage(mkt)}x
                                </span>
                              </div>
                            </button>
                            <FavoriteMarketButton market={mkt} />
                          </div>
                        </div>
                      ))}
                    </>
                  ) : null}
                  {perpMarkets.length > 0 ? (
                    <>
                      <h4 className="pt-1.5 text-xs">{t('perp')}</h4>
                      {perpMarkets
                        .filter(
                          (m) => !favoriteMarkets.find((n) => n.name === m.name)
                        )
                        .map((mkt) => (
                          <div className="text-th-fgd-3" key={mkt.name}>
                            <div className="flex items-center justify-between">
                              <button
                                className="font-normal"
                                onClick={() => selectMarket(mkt)}
                              >
                                <div
                                  className={`flex items-center text-xs hover:text-th-primary w-full whitespace-nowrap ${
                                    asPath.includes(mkt.name) ||
                                    (asPath === '/' &&
                                      initialMarket.name === mkt.name)
                                      ? 'text-th-primary'
                                      : 'text-th-fgd-1'
                                  }`}
                                >
                                  {renderIcon(mkt.baseSymbol)}
                                  {mkt.name}
                                  <span className="ml-1.5 text-xs text-th-fgd-4">
                                    {getMarketLeverage(mkt)}x
                                  </span>
                                </div>
                              </button>
                              <FavoriteMarketButton market={mkt} />
                            </div>
                          </div>
                        ))}
                    </>
                  ) : null}
                </div>
              )}
            </Popover.Panel>
          </Transition>
        </div>
      )}
    </Popover>
  )
}

export default SwitchMarketDropdown
