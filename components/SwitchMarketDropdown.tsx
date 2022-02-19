import { Fragment, useCallback, useMemo, useRef, useState } from 'react'
import useMangoGroupConfig from '../hooks/useMangoGroupConfig'
import { Popover, Transition } from '@headlessui/react'
import { SearchIcon } from '@heroicons/react/outline'
import { ChevronDownIcon } from '@heroicons/react/solid'
import Input from './Input'
import { useTranslation } from 'next-i18next'
import MarketNavItem from './MarketNavItem'
import useMangoStore from '../stores/useMangoStore'

const SwitchMarketDropdown = () => {
  const groupConfig = useMangoGroupConfig()
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const baseSymbol = marketConfig.baseSymbol
  const isPerpMarket = marketConfig.kind === 'perp'

  const markets = useMemo(
    () => [...groupConfig.spotMarkets, ...groupConfig.perpMarkets],
    [groupConfig]
  )
  const spotMarkets = useMemo(
    () =>
      [...groupConfig.spotMarkets].sort((a, b) => a.name.localeCompare(b.name)),
    [groupConfig]
  )
  const perpMarkets = useMemo(
    () =>
      [...groupConfig.perpMarkets].sort((a, b) => a.name.localeCompare(b.name)),
    [groupConfig]
  )

  const [suggestions, setSuggestions] = useState([])
  const [searchString, setSearchString] = useState('')
  const buttonRef = useRef(null)
  const { t } = useTranslation('common')
  const filteredMarkets = markets
    .filter((m) => m.name.toLowerCase().includes(searchString.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name))

  const onSearch = (searchString) => {
    if (searchString.length > 0) {
      const newSuggestions = suggestions.filter((v) =>
        v.name.toLowerCase().includes(searchString.toLowerCase())
      )
      setSuggestions(newSuggestions)
    }
    setSearchString(searchString)
  }

  const callbackRef = useCallback((inputElement) => {
    if (inputElement) {
      const timer = setTimeout(() => inputElement.focus(), 200)
      return () => clearTimeout(timer)
    }
  }, [])

  return (
    <Popover>
      {({ open }) => (
        <div className="flex flex-col relative">
          <Popover.Button
            className={`border border-th-bkg-4 p-0.5 hover:border-th-fgd-4 focus:outline-none focus:bg-th-bkg-3 focus:border-th-bkg-3 ${
              open && 'bg-th-bkg-3 border-th-bkg-3'
            }`}
            ref={buttonRef}
          >
            <div className="flex items-center pl-2">
              <img
                alt=""
                width="24"
                height="24"
                src={`/assets/icons/${baseSymbol.toLowerCase()}.svg`}
                className={`mr-2.5`}
              />

              <div className="font-semibold pr-0.5 text-xl">{baseSymbol}</div>
              <span className="text-th-fgd-4 text-xl">
                {isPerpMarket ? '-' : '/'}
              </span>
              <div className="font-semibold pl-0.5 text-xl">
                {isPerpMarket ? 'PERP' : groupConfig.quoteSymbol}
              </div>
              <div
                className={`flex h-10 items-center justify-center rounded-none w-8`}
              >
                <ChevronDownIcon
                  className={`default-transition h-6 w-6 ${
                    open ? 'transform rotate-180' : 'transform rotate-360'
                  }`}
                />
              </div>
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
              className="absolute bg-th-bkg-3 max-h-96 overflow-y-auto p-4 left-0 transform rounded-b-md rounded-tl-md thin-scroll top-14 w-72 z-10"
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
                <div className="pt-1.5">
                  {filteredMarkets.length > 0 ? (
                    filteredMarkets.map((mkt) => (
                      <MarketNavItem
                        buttonRef={buttonRef}
                        onClick={() => setSearchString('')}
                        market={mkt}
                        key={mkt.name}
                      />
                    ))
                  ) : (
                    <p className="mb-0 text-center">{t('no-markets')}</p>
                  )}
                </div>
              ) : (
                <div className="">
                  <div className="flex justify-between py-1.5">
                    <h4 className="text-xs">{t('perp')}</h4>
                    <p className="mb-0 text-th-fgd-4 text-xs">
                      {t('rolling-change')}
                    </p>
                  </div>
                  {perpMarkets.map((mkt) => (
                    <MarketNavItem
                      buttonRef={buttonRef}
                      onClick={() => setSearchString('')}
                      market={mkt}
                      key={mkt.name}
                    />
                  ))}
                  <div className="flex justify-between py-1.5">
                    <h4 className="text-xs">{t('spot')}</h4>
                    <p className="mb-0 text-th-fgd-4 text-xs">
                      {t('rolling-change')}
                    </p>
                  </div>
                  {spotMarkets.map((mkt) => (
                    <MarketNavItem
                      buttonRef={buttonRef}
                      onClick={() => setSearchString('')}
                      market={mkt}
                      key={mkt.name}
                    />
                  ))}
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
