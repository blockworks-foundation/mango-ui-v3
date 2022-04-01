import React from 'react'
import Link from 'next/link'
import { EyeIcon, EyeOffIcon } from '@heroicons/react/outline'
import { ChevronRightIcon } from '@heroicons/react/solid'
import Modal from './Modal'
import useLocalStorageState from '../hooks/useLocalStorageState'
import useMangoStore from '../stores/useMangoStore'
import { formatUsdValue } from '../utils'
import { LinkButton } from './Button'
import { useTranslation } from 'next-i18next'

const MarketsModal = ({
  isOpen,
  markets,
  onClose,
}: {
  isOpen: boolean
  markets: Array<any>
  onClose?: (x?) => void
}) => {
  const { t } = useTranslation('common')
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const [hiddenMarkets, setHiddenMarkets] = useLocalStorageState(
    'hiddenMarkets',
    []
  )

  const handleHideShowMarket = (asset) => {
    if (hiddenMarkets.includes(asset)) {
      setHiddenMarkets(hiddenMarkets.filter((m) => m !== asset))
    } else {
      setHiddenMarkets(hiddenMarkets.concat(asset))
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex items-end justify-between pb-3 pt-2">
        <div className="text-lg font-bold text-th-fgd-1">{t('markets')}</div>
        {hiddenMarkets.length === 0 ? (
          <LinkButton
            className="mb-0.5 hidden text-xs font-normal text-th-fgd-3 disabled:cursor-not-allowed disabled:text-th-fgd-4 disabled:no-underline md:block"
            // disabled={hiddenMarkets.length === 0}
            onClick={() =>
              setHiddenMarkets(markets.map((mkt) => mkt.baseAsset))
            }
          >
            {t('hide-all')}
          </LinkButton>
        ) : (
          <LinkButton
            className="mb-0.5 hidden text-xs font-normal text-th-fgd-3 disabled:cursor-not-allowed disabled:text-th-fgd-4 disabled:no-underline md:block"
            // disabled={hiddenMarkets.length === 0}
            onClick={() => setHiddenMarkets([])}
          >
            {t('show-all')}
          </LinkButton>
        )}
      </div>
      {markets.map((mkt) => (
        <div key={mkt.baseAsset}>
          <div className="flex items-center justify-between bg-th-bkg-3 px-2.5 py-2">
            <div className="flex items-center">
              <img
                alt=""
                src={`/assets/icons/${mkt.baseAsset.toLowerCase()}.svg`}
                className={`mr-2.5 h-5 w-auto`}
              />
              <span className="text-th-fgd-2">{mkt.baseAsset}</span>
            </div>
            <div className="hidden md:flex">
              {hiddenMarkets.includes(mkt.baseAsset) ? (
                <EyeOffIcon
                  className="default-transition h-4 w-4 cursor-pointer text-th-fgd-4 hover:text-th-fgd-3"
                  onClick={() => handleHideShowMarket(mkt.baseAsset)}
                />
              ) : (
                <EyeIcon
                  className="default-transition h-4 w-4 cursor-pointer text-th-primary hover:text-th-primary-dark"
                  onClick={() => handleHideShowMarket(mkt.baseAsset)}
                />
              )}
            </div>
          </div>
          {/* <div className="bg-[rgba(255,255,255,0.1)] flex items-center justify-between px-2.5 py-0.5 text-th-fgd-3">
            <StyledColumnHeader>Markets</StyledColumnHeader>
            <div className="flex justify-between">
              <StyledColumnHeader className="pr-5 text-right w-20">
                Price
              </StyledColumnHeader>
              <StyledColumnHeader className="text-right w-20">
                24h Change
              </StyledColumnHeader>
              <StyledColumnHeader className="text-right w-20">
                24h Vol
              </StyledColumnHeader>
            </div>
          </div> */}
          <div className="divide-y divide-th-bkg-4">
            {mkt.markets.map((m) => (
              <div
                className={`flex items-center justify-between px-2.5 text-xs`}
                key={m.name}
              >
                <Link href={`/?name=${m.name}`} key={m.name}>
                  <a
                    className="default-transition flex h-12 w-full cursor-pointer items-center justify-between text-th-fgd-2 hover:text-th-primary"
                    onClick={onClose}
                  >
                    {m.name}
                    <div className="flex items-center">
                      <span className="w-20 text-right">
                        {mangoGroup && mangoCache
                          ? formatUsdValue(
                              mangoGroup
                                .getPrice(m.marketIndex, mangoCache)
                                .toNumber()
                            )
                          : null}
                      </span>
                      {/* <span className="text-th-green text-right w-20">
                        +2.44%
                      </span>
                      <span className="text-th-fgd-3 text-right w-20">
                        $233m
                      </span> */}
                      <ChevronRightIcon className="ml-1 h-4 w-5 text-th-fgd-2" />
                    </div>
                  </a>
                </Link>
              </div>
            ))}
          </div>
        </div>
      ))}
    </Modal>
  )
}

export default React.memo(MarketsModal)
