import { useTranslation } from 'next-i18next'
import { useEffect, useState } from 'react'
import { EyeIcon, EyeOffIcon } from '@heroicons/react/outline'
import { ChevronRightIcon } from '@heroicons/react/solid'
import useLocalStorageState from '../hooks/useLocalStorageState'
import useMangoGroupConfig from '../hooks/useMangoGroupConfig'
import useMangoStore from '../stores/useMangoStore'
import Link from 'next/link'
import { formatUsdValue } from '../utils'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'tv-chart'])),
      // Will be passed to the page component as props
    },
  }
}

const SelectMarket = () => {
  const { t } = useTranslation('common')
  const groupConfig = useMangoGroupConfig()
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)

  const [markets, setMarkets] = useState([])

  const [hiddenMarkets, setHiddenMarkets] = useLocalStorageState(
    'hiddenMarkets',
    []
  )

  useEffect(() => {
    const markets = []
    const allMarkets = [...groupConfig.spotMarkets, ...groupConfig.perpMarkets]
    allMarkets.forEach((market) => {
      const base = market.name.slice(0, -5)
      const found = markets.find((b) => b.baseAsset === base)
      if (!found) {
        markets.push({ baseAsset: base, markets: [market] })
      } else {
        found.markets.push(market)
      }
    })
    setMarkets(markets)
  }, [])

  const handleHideShowMarket = (asset) => {
    if (hiddenMarkets.includes(asset)) {
      setHiddenMarkets(hiddenMarkets.filter((m) => m !== asset))
    } else {
      setHiddenMarkets(hiddenMarkets.concat(asset))
    }
  }

  return (
    <div>
      <div className="flex items-end justify-between pb-3 pt-2">
        <div className="font-bold text-lg text-th-fgd-1">{t('markets')}</div>
        {/*hiddenMarkets.length === 0 ? (
          <LinkButton
            className="font-normal hidden md:block mb-0.5 text-th-fgd-3 text-xs disabled:cursor-not-allowed disabled:no-underline disabled:text-th-fgd-4"
            onClick={() =>
              setHiddenMarkets(markets.map((mkt) => mkt.baseAsset))
            }
          >
            {t('hide-all')}
          </LinkButton>
        ) : (
          <LinkButton
            className="font-normal hidden md:block mb-0.5 text-th-fgd-3 text-xs disabled:cursor-not-allowed disabled:no-underline disabled:text-th-fgd-4"
            onClick={() => setHiddenMarkets([])}
          >
            {t('show-all')}
          </LinkButton>
        )*/}
      </div>
      {markets.map((mkt) => (
        <div key={mkt.baseAsset}>
          <div className="bg-th-bkg-3 flex items-center justify-between px-2.5 py-2">
            <div className="flex items-center">
              <img
                alt=""
                src={`/assets/icons/${mkt.baseAsset.toLowerCase()}.svg`}
                className={`h-5 mr-2.5 w-auto`}
              />
              <span className="text-th-fgd-2">{mkt.baseAsset}</span>
            </div>
            <div className="hidden md:flex">
              {hiddenMarkets.includes(mkt.baseAsset) ? (
                <EyeOffIcon
                  className="cursor-pointer default-transition h-4 text-th-fgd-4 w-4 hover:text-th-fgd-3"
                  onClick={() => handleHideShowMarket(mkt.baseAsset)}
                />
              ) : (
                <EyeIcon
                  className="cursor-pointer default-transition h-4 text-th-primary w-4 hover:text-th-primary-dark"
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
            {mangoGroup
              ? mkt.markets.map((m) => (
                  <div
                    className={`flex items-center justify-between px-2.5 text-xs`}
                    key={m.name}
                  >
                    <Link href={`/market?name=${m.name}`} key={m.name}>
                      <a className="cursor-pointer default-transition flex h-12 items-center justify-between text-th-fgd-2 hover:text-th-primary w-full">
                        {m.name}
                        <div className="flex items-center">
                          <span className="text-right w-20">
                            {formatUsdValue(
                              mangoGroup
                                .getPrice(m.marketIndex, mangoCache)
                                .toNumber()
                            )}
                          </span>
                          <ChevronRightIcon className="h-4 ml-1 w-5 text-th-fgd-2" />
                        </div>
                      </a>
                    </Link>
                  </div>
                ))
              : null}
          </div>
        </div>
      ))}
      {/* spacer so last market can be selected albeit bottom bar overlay */}
      <p className="flex h-12 md:hidden"></p>
    </div>
  )
}

export default SelectMarket
