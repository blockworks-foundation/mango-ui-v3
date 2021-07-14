import useMangoStore from '../stores/useMangoStore'
import { Table, Thead, Tbody, Tr, Th, Td } from 'react-super-responsive-table'
import {
  getMarketByPublicKey,
  nativeI80F48ToUi,
  nativeToUi,
  PerpMarket,
} from '@blockworks-foundation/mango-client'
import { useMemo } from 'react'

const PositionsTable = () => {
  const groupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const allMarkets = useMangoStore((s) => s.selectedMangoGroup.markets)
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

  console.log({ perpMarkets, perpAccounts })

  return (
    <div className={`flex flex-col py-4`}>
      <div className={`-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8`}>
        <div className={`align-middle inline-block min-w-full sm:px-6 lg:px-8`}>
          {perpAccounts.length ? (
            <div
              className={`overflow-hidden border-b border-th-bkg-2 sm:rounded-md`}
            >
              <Table className={`min-w-full divide-y divide-th-bkg-2`}>
                <Thead>
                  <Tr className="text-th-fgd-3">
                    <Th
                      scope="col"
                      className={`px-6 py-2 text-left font-normal`}
                    >
                      Market
                    </Th>
                    <Th
                      scope="col"
                      className={`px-6 py-2 text-left font-normal`}
                    >
                      Base Position
                    </Th>
                    <Th
                      scope="col"
                      className={`px-6 py-2 text-left font-normal`}
                    >
                      Quote Position
                    </Th>
                    <Th
                      scope="col"
                      className={`px-6 py-2 text-left font-normal`}
                    >
                      Unrealized PnL
                    </Th>
                    <Th
                      scope="col"
                      className={`px-6 py-2 text-left font-normal`}
                    >
                      Health
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {perpAccounts.map((acc, index) => {
                    const market = perpMarkets[index]
                    const marketConfig = getMarketByPublicKey(
                      groupConfig,
                      market.perpMarket
                    )

                    const marketCache =
                      mangoCache.perpMarketCache[marketConfig.marketIndex]
                    const price =
                      mangoCache.priceCache[marketConfig.marketIndex].price
                    const perpMarket = allMarkets[
                      marketConfig.publicKey.toString()
                    ] as PerpMarket

                    return (
                      <Tr
                        key={`${index}`}
                        className={`border-b border-th-bkg-3
                        ${index % 2 === 0 ? `bg-th-bkg-3` : `bg-th-bkg-2`}
                      `}
                      >
                        <Td
                          className={`px-6 py-4 whitespace-nowrap text-sm text-th-fgd-1`}
                        >
                          {marketConfig.name}
                        </Td>
                        <Td
                          className={`px-6 py-4 whitespace-nowrap text-sm text-th-fgd-1`}
                        >
                          {perpMarket.baseLotsToNumber(acc.basePosition)}
                        </Td>
                        <Td
                          className={`px-6 py-4 whitespace-nowrap text-sm text-th-fgd-1`}
                        >
                          {nativeI80F48ToUi(
                            acc.quotePosition,
                            marketConfig.quoteDecimals
                          ).toFixed()}
                        </Td>
                        <Td
                          className={`px-6 py-4 whitespace-nowrap text-sm text-th-fgd-1`}
                        >
                          $
                          {nativeI80F48ToUi(
                            acc.getPnl(market, price),
                            marketConfig.quoteDecimals
                          ).toFixed()}
                        </Td>
                        <Td
                          className={`px-6 py-4 whitespace-nowrap text-sm text-th-fgd-1`}
                        >
                          {acc
                            .getHealth(
                              market,
                              price,
                              market.maintAssetWeight,
                              market.maintLiabWeight,
                              marketCache.longFunding,
                              marketCache.shortFunding
                            )
                            .toFixed(3)}
                        </Td>
                      </Tr>
                    )
                  })}
                </Tbody>
              </Table>
            </div>
          ) : (
            <div
              className={`w-full text-center py-6 bg-th-bkg-1 text-th-fgd-3 rounded-md`}
            >
              No open positions
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PositionsTable
