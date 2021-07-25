import { useEffect, useMemo, useState } from 'react'
import { Table, Thead, Tbody, Tr, Th, Td } from 'react-super-responsive-table'
import styled from '@emotion/styled'
import { CurrencyDollarIcon, HeartIcon } from '@heroicons/react/outline'
import {
  getTokenBySymbol,
  getMarketByPublicKey,
  nativeI80F48ToUi,
  PerpMarket,
} from '@blockworks-foundation/mango-client'
import useMangoStore from '../../stores/useMangoStore'
import { useBalances } from '../../hooks/useBalances'
import { usdFormatter, tokenPrecision } from '../../utils'
import SideBadge from '../SideBadge'

const StyledAccountValue = styled.div`
  font-size: 1.8rem;
  line-height: 1.2;
`

export default function AccountOverview() {
  const [portfolio, setPortfolio] = useState([])
  const allMarkets = useMangoStore((s) => s.selectedMangoGroup.markets)
  const balances = useBalances()
  const groupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)

  const perpMarkets = useMemo(
    () =>
      mangoGroup
        ? groupConfig.perpMarkets.map(
            (m) => mangoGroup.perpMarkets[m.marketIndex]
          )
        : [],
    [mangoGroup]
  )

  const perpAccounts = useMemo(
    () =>
      mangoAccount
        ? groupConfig.perpMarkets.map(
            (m) => mangoAccount.perpAccounts[m.marketIndex]
          )
        : [],
    [mangoAccount]
  )

  useEffect(() => {
    const portfolio = []
    perpAccounts.forEach((acc, index) => {
      const market = perpMarkets[index]
      const marketConfig = getMarketByPublicKey(groupConfig, market.perpMarket)
      const perpMarket = allMarkets[
        marketConfig.publicKey.toString()
      ] as PerpMarket
      if (
        +nativeI80F48ToUi(acc.quotePosition, marketConfig.quoteDecimals) > 0
      ) {
        portfolio.push({
          market: marketConfig.name,
          balance: perpMarket.baseLotsToNumber(acc.basePosition),
          symbol: marketConfig.baseSymbol,
          value: +nativeI80F48ToUi(
            acc.quotePosition,
            marketConfig.quoteDecimals
          ),
          type:
            perpMarket.baseLotsToNumber(acc.basePosition) > 0
              ? 'Long'
              : 'Short',
        })
      }
    })
    balances.forEach((b) => {
      const token = getTokenBySymbol(groupConfig, b.symbol)
      const tokenIndex = mangoGroup.getTokenIndex(token.mintKey)
      if (+b.marginDeposits > 0) {
        portfolio.push({
          market: b.symbol,
          balance: +b.marginDeposits + b.orders + b.unsettled,
          symbol: b.symbol,
          value:
            (+b.marginDeposits + b.orders + b.unsettled) *
            mangoGroup.getPrice(tokenIndex, mangoCache).toNumber(),
          type: 'Deposits',
        })
      }
      if (+b.borrows > 0) {
        portfolio.push({
          market: b.symbol,
          balance: +b.borrows,
          value: b.borrows.mul(mangoGroup.getPrice(tokenIndex, mangoCache)),
          type: 'Borrows',
        })
      }
    })
    setPortfolio(portfolio.sort((a, b) => b.value - a.value))
  }, [perpAccounts])

  return mangoAccount ? (
    <>
      <div className="pb-6">
        <div className="pb-1 text-th-fgd-3">Account Value</div>
        <div className="flex items-center">
          <CurrencyDollarIcon className="flex-shrink-0 h-7 w-7 mr-1.5 text-th-primary" />
          <StyledAccountValue className="text-th-fgd-1">
            {usdFormatter.format(
              +mangoAccount.computeValue(mangoGroup, mangoCache).toFixed(2)
            )}
          </StyledAccountValue>
        </div>
      </div>
      <div className="grid grid-flow-col grid-cols-1 grid-rows-4 sm:grid-cols-2 sm:grid-rows-2 md:grid-cols-4 md:grid-rows-1 gap-4 pb-10">
        <div className="bg-th-bkg-3 p-3 rounded-md">
          <div className="pb-0.5 text-xs text-th-fgd-3">Positions</div>
          <div className="flex items-center">
            <CurrencyDollarIcon className="flex-shrink-0 h-5 w-5 mr-2 text-th-primary" />
            <div className="text-lg text-th-fgd-1">
              {portfolio.length > 0
                ? usdFormatter.format(
                    portfolio.reduce(
                      (acc, d) => d.market.includes('PERP') && acc + d.value,
                      0
                    )
                  )
                : 0}
            </div>
          </div>
        </div>
        <div className="bg-th-bkg-3 p-3 rounded-md">
          <div className="pb-0.5 text-xs text-th-fgd-3">Deposits</div>
          <div className="flex items-center">
            <CurrencyDollarIcon className="flex-shrink-0 h-5 w-5 mr-2 text-th-primary" />
            <div className="text-lg text-th-fgd-1">
              {usdFormatter.format(
                +mangoAccount.getAssetsVal(mangoGroup, mangoCache)
              )}
            </div>
          </div>
        </div>
        <div className="bg-th-bkg-3 p-3 rounded-md">
          <div className="pb-0.5 text-xs text-th-fgd-3">Borrows</div>
          <div className="flex items-center">
            <CurrencyDollarIcon className="flex-shrink-0 h-5 w-5 mr-2 text-th-primary" />
            <div className="text-lg text-th-fgd-1">
              {usdFormatter.format(
                +mangoAccount.getLiabsVal(mangoGroup, mangoCache)
              )}
            </div>
          </div>
        </div>
        <div className="bg-th-bkg-3 p-3 rounded-md">
          <div className="pb-0.5 text-xs text-th-fgd-3">Health Ratio</div>
          <div className="flex items-center">
            <HeartIcon className="flex-shrink-0 h-5 w-5 mr-2 text-th-primary" />
            <div className="text-lg text-th-fgd-1">
              {mangoAccount.getHealthRatio(mangoGroup, mangoCache, 'Maint')}%
            </div>
          </div>
        </div>
      </div>
      {portfolio.length > 0 ? (
        <>
          <div className="pb-4 text-th-fgd-1 text-lg">Portfolio</div>
          <Table className="min-w-full divide-y divide-th-bkg-2">
            <Thead>
              <Tr className="text-th-fgd-3 text-xs">
                <Th scope="col" className={`px-6 py-3 text-left font-normal`}>
                  Asset/Market
                </Th>
                <Th scope="col" className={`px-6 py-3 text-left font-normal`}>
                  Type
                </Th>
                <Th scope="col" className={`px-6 py-3 text-left font-normal`}>
                  Size
                </Th>
                <Th scope="col" className="px-6 py-3 text-left font-normal">
                  Value
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {portfolio.map((pos, i) => (
                <Tr
                  key={i}
                  className={`border-b border-th-bkg-3
                  ${i % 2 === 0 ? `bg-th-bkg-3` : `bg-th-bkg-2`}
                `}
                >
                  <Td
                    className={`px-6 py-3 whitespace-nowrap text-sm text-th-fgd-1`}
                  >
                    <div className="flex items-center">
                      <img
                        alt=""
                        width="20"
                        height="20"
                        src={`/assets/icons/${pos.symbol.toLowerCase()}.svg`}
                        className={`mr-2.5`}
                      />
                      <div>{pos.market}</div>
                    </div>
                  </Td>
                  <Td
                    className={`px-6 py-3 whitespace-nowrap text-sm text-th-fgd-1`}
                  >
                    {pos.type === 'Long' || pos.type === 'Short' ? (
                      <SideBadge side={pos.type} />
                    ) : (
                      pos.type
                    )}
                  </Td>
                  <Td
                    className={`px-6 py-3 whitespace-nowrap text-sm text-th-fgd-1`}
                  >
                    {pos.balance.toFixed(tokenPrecision[pos.symbol])}
                  </Td>
                  <Td
                    className={`px-6 py-3 whitespace-nowrap text-sm text-th-fgd-1`}
                  >
                    {usdFormatter.format(pos.value)}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </>
      ) : null}
    </>
  ) : null
}
